import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  ShieldCheck, 
  Bike, 
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';

interface DigitalIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilotName: string;
  pilotId: string;
  pilotClub: string;
  pilotMotorcycle: string;
  pilotTier: {
    title: string;
    subtitle: string;
    icon: string;
  };
  pilotAvatar?: string;
}

export function DigitalIdModal({
  isOpen,
  onClose,
  pilotName,
  pilotId,
  pilotClub,
  pilotMotorcycle,
  pilotTier,
  pilotAvatar,
}: DigitalIdModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // URL pública ou de verificação do passaporte do piloto
  const passportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile?pilot=${encodeURIComponent(pilotId || '77892-XP')}`
    : `https://motolegado.com/profile?pilot=${encodeURIComponent(pilotId || '77892-XP')}`;

  // Gerar QR Code real escaneável com o link de autenticação
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(passportUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error('Erro ao gerar QR Code real:', err);
        });
    }
  }, [isOpen, passportUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copiar link do passaporte
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(passportUrl)
        .then(() => {
          setCopiedLink(true);
          showToast('Link do Passaporte de Piloto copiado com sucesso!');
          setTimeout(() => setCopiedLink(false), 3000);
        })
        .catch(() => {
          fallbackCopyText(passportUrl);
        });
    } else {
      fallbackCopyText(passportUrl);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      showToast('Link do Passaporte copiado!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      showToast('Não foi possível copiar automaticamente. Use o link abaixo.');
    }
  };

  // Baixar imagem do QR Code
  const handleDownloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    try {
      const a = document.createElement('a');
      a.href = qrCodeDataUrl;
      const safeName = (pilotName || 'Piloto').toLowerCase().replace(/\s+/g, '_');
      a.download = `QRCode_Passaporte_${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Imagem do QR Code baixada com sucesso!');
    } catch (e) {
      showToast('Erro ao baixar QR Code.');
    }
  };

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    const text = 
      `🏍️ *PASSAPORTE DE PILOTO MOTOLEGADO*\n\n` +
      `👤 *Piloto:* ${pilotName}\n` +
      `🛡️ *Moto Clube:* ${pilotClub}\n` +
      `⚡ *Patente:* ${pilotTier.icon} ${pilotTier.title}\n` +
      `🏍️ *Máquina:* ${pilotMotorcycle}\n` +
      `🆔 *Código:* ${pilotId}\n\n` +
      `🔗 *Acesse e verifique meu passaporte:* \n${passportUrl}`;

    try {
      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    } catch (e) {
      handleCopyLink();
    }
  };

  // Compartilhamento Nativo no Celular (se suportado)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passaporte MotoLegado - ${pilotName}`,
          text: `Passaporte de Piloto Oficial de ${pilotName} no MotoLegado.`,
          url: passportUrl,
        });
        showToast('Passaporte compartilhado com sucesso!');
        return;
      } catch (e) {
        // Ignora se o usuário cancelou o menu de compartilhamento
      }
    }
    handleCopyLink();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black italic uppercase text-white tracking-tight flex items-center gap-2">
                  <span>PASSAPORTE DE PILOTO</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                    Verificado
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  QR Code oficial para credenciamento em encontros e validação de perfil.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Body: Digital Passport Card */}
          <div className="p-5 sm:p-8 space-y-6 flex flex-col items-center text-center">
            
            {/* The Badge Identity Container */}
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 p-6 shadow-2xl relative overflow-hidden space-y-5">
              
              {/* Top Card Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MOTOLEGADO ID DIGITAL</span>
                </div>
                <span className="font-mono text-xs font-black text-amber-400">{pilotId}</span>
              </div>

              {/* Scannable Real QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner relative group mx-auto w-fit">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt={`QR Code Passaporte ${pilotName}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-mono text-xs">
                    Gerando QR Code...
                  </div>
                )}
                <div className="text-[9px] text-slate-500 font-black tracking-widest uppercase mt-1">
                  APONTE A CÂMERA PARA ESCANEAR
                </div>
              </div>

              {/* Pilot Summary Info */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 font-bold uppercase tracking-wider">
                  <span>{pilotTier.icon}</span>
                  <span>{pilotTier.title} • {pilotTier.subtitle}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-tight">
                  {pilotName}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-slate-300 font-bold">
                    <ShieldCheck size={13} className="text-amber-500" />
                    {pilotClub}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-slate-300 font-bold">
                    <Bike size={13} className="text-orange-500" />
                    {pilotMotorcycle}
                  </span>
                </div>
              </div>

              {/* Link Box */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 break-all text-center flex items-center justify-between gap-2">
                <span className="truncate">{passportUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shrink-0 font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copiar URL"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary py-3 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                {copiedLink ? (
                  <>
                    <Check size={15} className="text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="btn-secondary py-3 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition-transform"
                title="Salvar imagem PNG do QR Code"
              >
                <Download size={15} className="text-amber-400" />
                <span>Baixar QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
              >
                <Share2 size={15} />
                <span>WhatsApp</span>
              </button>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Chave criptográfica ativa</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
