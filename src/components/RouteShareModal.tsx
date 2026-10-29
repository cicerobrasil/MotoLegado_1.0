import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  MapPin, 
  Navigation, 
  Star, 
  Clock, 
  QrCode, 
  Smartphone,
  Sparkles,
  Compass,
  Download,
  BellRing,
  Radio,
  Users,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route } from '../types';
import { estimateRouteMetrics, DEFAULT_ROUTE_FALLBACK } from './Routes';
import { exportRouteToGpx, exportRouteToKml } from '../lib/gpsExport';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { 
  dispatchRouteShareNotification, 
  getPushPermissionStatus, 
  requestPushPermission 
} from '../lib/pushNotifications';

interface RouteShareModalProps {
  route: Route | null;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function RouteShareModal({ route, isOpen, onClose, onToast }: RouteShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isPushSending, setIsPushSending] = useState(false);
  const [pushSent, setPushSent] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [customNote, setCustomNote] = useState<string>('');

  const { profile, user } = useAuth();

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowQrCode(false);
      setPushSent(false);
      setCustomNote('');
    }
  }, [isOpen]);

  const handleSendPushToContacts = async () => {
    if (!route) return;
    setIsPushSending(true);
    try {
      const perm = getPushPermissionStatus();
      if (perm === 'default') {
        await requestPushPermission();
      }

      const senderName = profile?.name || user?.user_metadata?.name || 'Cícero Ranieri';
      const senderAvatar = profile?.avatar_url || '';

      await dispatchRouteShareNotification({
        route,
        sender: {
          id: profile?.id || user?.id,
          name: senderName,
          avatar: senderAvatar
        },
        recipientId: selectedRecipient,
        customMessage: customNote.trim() || undefined
      });

      setPushSent(true);
      if (onToast) {
        onToast(`Notificação push do roteiro "${route.name}" disparada para os contatos com sucesso!`, 'success');
      }
      setTimeout(() => setPushSent(false), 5000);
    } catch (err: any) {
      if (onToast) onToast('Falha ao enviar notificação push: ' + (err?.message || err), 'error');
    } finally {
      setIsPushSending(false);
    }
  };

  if (!isOpen || !route) return null;

  const metrics = estimateRouteMetrics(route);

  // Gera o link único com id da rota e fallback serializado seguro
  const generateShareUrl = (targetRoute: Route): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    params.set('routeId', targetRoute.id);

    try {
      const miniData = {
        id: targetRoute.id,
        name: targetRoute.name,
        mapsAddress: targetRoute.mapsAddress,
        difficulty: targetRoute.difficulty,
        image: targetRoute.image || '',
        description: targetRoute.description?.slice(0, 280) || '',
        riderTips: targetRoute.riderTips?.slice(0, 200) || '',
        distance: targetRoute.distance || Number(metrics.distance) || 0,
        duration: targetRoute.duration || metrics.duration || '',
        mapsUrl: targetRoute.mapsUrl || ''
      };
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(miniData))));
      params.set('tripData', serialized);
    } catch {
      // Ignora falha de codificação e mantém pelo menos o routeId
    }

    return `${origin}/routes?${params.toString()}`;
  };

  const shareUrl = generateShareUrl(route);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (onToast) {
        onToast('Link exclusivo do roteiro copiado com sucesso!', 'success');
      }
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      if (onToast) {
        onToast('Não foi possível copiar o link automaticamente. Selecione e copie manualmente.', 'error');
      }
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Roteiro MotoLegado: ${route.name}`,
          text: `🏍️ Bora rodar juntos? Confira o roteiro de viagem "${route.name}" (${metrics.distance} km - ${route.difficulty}) no MotoLegado!`,
          url: shareUrl
        });
        if (onToast) {
          onToast('Roteiro compartilhado com sucesso!', 'success');
        }
      } catch (err) {
        // Usuário cancelou ou fechou a tela de compartilhamento nativo
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🏍️ *Bora rodar juntos?*\nConfira o roteiro de viagem planejado *${route.name}* no MotoLegado!\n\n📍 *Destino:* ${route.mapsAddress}\n⚡ *Nível:* ${route.difficulty}\n🛣️ *Distância Estimada:* ~${metrics.distance} km (${metrics.duration})\n\n👉 *Acesse todos os detalhes do roteiro aqui:* ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `🏍️ Bora rodar juntos? Confira o roteiro de viagem "${route.name}" (${metrics.distance} km) no MotoLegado!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Confira este roteiro de moto planejado no MotoLegado: "${route.name}" (${metrics.distance} km) 🏍️💨`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Convite de Rota: ${route.name} - MotoLegado`;
    const body = `Olá, parceiro(a) de estrada!\n\nEstou planejando essa viagem no MotoLegado e quero compartilhar o roteiro com você:\n\n🏍️ ${route.name}\n📍 Destino / Percurso: ${route.mapsAddress}\n⚡ Dificuldade: ${route.difficulty}\n🛣️ Distância Estimada: ~${metrics.distance} km (${metrics.duration})\n\nVeja todos os detalhes, mapa e dicas técnicas clicando no link abaixo:\n${shareUrl}\n\nBons ventos e nos vemos na estrada!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&bgcolor=001b3d&color=ff751f&margin=2`;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff751f]/10 border border-[#ff751f]/30 flex items-center justify-center text-[#ff751f]">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                  Compartilhar Roteiro
                </h3>
                <p className="text-xs text-slate-400">
                  Envie para amigos motociclistas ou redes sociais
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Route Preview Card */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3 sm:p-3.5 flex gap-3.5 items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                <img 
                  src={route.image || DEFAULT_ROUTE_FALLBACK} 
                  alt={route.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_ROUTE_FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-600 text-white">
                  {route.difficulty}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase flex items-center gap-1">
                    <Star size={10} className="fill-amber-400" />
                    {route.rating} ({route.totalRatingsCount || 0})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={10} className="text-orange-400" />
                    {metrics.duration}
                  </span>
                </div>

                <h4 className="text-sm font-black italic uppercase tracking-tight text-white truncate">
                  {route.name}
                </h4>

                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <MapPin size={11} className="text-orange-500 shrink-0" />
                  {route.mapsAddress}
                </p>

                <div className="text-[10px] text-slate-500 font-bold">
                  Distância estimada: <span className="text-orange-400 font-mono font-black">~{metrics.distance} km</span>
                </div>
              </div>
            </div>

            {/* Unique Link Input with Copy Action */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Link Exclusivo do Roteiro</span>
                <span className="text-[#ff751f] font-mono text-[9px]">URL Direta</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-0">
                  <Navigation size={14} className="text-slate-500 shrink-0" />
                  <input 
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono truncate select-all"
                  />
                </div>

                <button 
                  onClick={handleCopyLink}
                  className={cn(
                    "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer",
                    copied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-[#ff751f] hover:bg-[#ff853a] text-slate-950 shadow-[#ff751f]/20"
                  )}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sistema de Notificação Push via Service Worker para Contatos */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-slate-950 border border-orange-500/40 space-y-3 shadow-lg shadow-orange-950/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                    <BellRing size={16} className="text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-2">
                      <span>Avisar Contatos via Push Notification</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono font-black uppercase">
                        Service Worker
                      </span>
                    </h4>
                    <p className="text-[10.5px] text-slate-300">
                      Dispara um alerta nativo no dispositivo e painel dos seus contatos avisando sobre este roteiro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensagem customizada opcional */}
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Mensagem aos parceiros (ex: Bora rodar esse sábado? Quem anima?)"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Botão de Disparo Push */}
              <button
                type="button"
                disabled={isPushSending || pushSent}
                onClick={handleSendPushToContacts}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-60",
                  pushSent
                    ? "bg-emerald-600 text-white shadow-emerald-600/30"
                    : "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-600/30"
                )}
              >
                {isPushSending ? (
                  <>
                    <Radio size={14} className="animate-spin text-white" />
                    <span>Enviando Push aos Contatos...</span>
                  </>
                ) : pushSent ? (
                  <>
                    <Check size={15} className="stroke-[3]" />
                    <span>Notificação Push Disparada com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <BellRing size={14} />
                    <span>Disparar Notificação Push via Service Worker</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Share to Social Networks */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Compartilhar Direto nas Redes
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <MessageSquare size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="p-3 rounded-2xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 hover:border-sky-400 text-sky-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <Send size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">Telegram</span>
                </button>

                {/* Twitter / X */}
                <button
                  type="button"
                  onClick={handleShareTwitter}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform font-bold text-sm">
                    𝕏
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">X / Twitter</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="p-3 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 text-blue-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform font-black">
                    f
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">Facebook</span>
                </button>
              </div>

              {/* Native Mobile Share Button (if supported) */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Smartphone size={16} />
                  <span>Compartilhar via Celular (Apps / Instagram / SMS)</span>
                </button>
              )}

              {/* Secondary actions: Email & QR Code Toggle */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Mail size={14} className="text-orange-400" />
                  <span>Enviar por E-mail</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    showQrCode 
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  )}
                >
                  <QrCode size={14} className="text-[#ff751f]" />
                  <span>{showQrCode ? "Ocultar QR Code" : "Exibir QR Code"}</span>
                </button>
              </div>

              {/* QR Code Container for in-person sharing at biker meets */}
              <AnimatePresence>
                {showQrCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-center space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-amber-400">
                      <Sparkles size={14} />
                      <span>Escanear no Encontro de Motos</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Peça para os amigos apontarem a câmera do celular para este QR Code para abrir o roteiro instantaneamente:
                    </p>
                    <div className="inline-block p-3 rounded-2xl bg-[#001b3d] border-2 border-[#ff751f] shadow-xl">
                      <img 
                        src={qrCodeUrl} 
                        alt={`QR Code para ${route.name}`}
                        className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {route.name} • {metrics.distance} km
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exportação Direta para Dispositivos GPS Externos */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Navigation size={12} className="text-[#ff751f]" />
                    <span>Usar em GPS Externo (GPX / KML)</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">Garmin • TomTom • Earth</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      exportRouteToGpx(route);
                      if (onToast) onToast(`Arquivo GPX gerado para "${route.name}". Pronto para transferir ao GPS!`, 'success');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-[#ff751f]/10 border border-slate-800 hover:border-[#ff751f]/50 text-slate-200 hover:text-[#ff751f] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group active:scale-95"
                    title="Baixar arquivo GPX para Garmin, TomTom ou apps de celular"
                  >
                    <Download size={13} className="text-[#ff751f] group-hover:scale-110 transition-transform" />
                    <span>Baixar GPX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportRouteToKml(route);
                      if (onToast) onToast(`Arquivo KML gerado para "${route.name}". Pronto para o Google Earth!`, 'success');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-sky-500/10 border border-slate-800 hover:border-sky-500/50 text-slate-200 hover:text-sky-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group active:scale-95"
                    title="Baixar arquivo KML para Google Earth, My Maps e Maps.me"
                  >
                    <Download size={13} className="text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>Baixar KML</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Compass size={13} className="text-[#ff751f]" />
              MotoLegado • Rotas & Expedições
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RouteShareModal;
