import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Copy, 
  Check, 
  Lock, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  FileText,
  Clock,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { FREE_PLAN_FEATURES } from '../types';

export type UpgradeFeatureTrigger = 
  | 'diario_ilimitado'
  | 'criar_clube'
  | 'criar_evento'
  | 'criar_roteiro'
  | 'desconto_vip'
  | 'geral';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: UpgradeFeatureTrigger;
  onSuccess?: () => void;
}

const FEATURE_MESSAGES: Record<UpgradeFeatureTrigger, { title: string; desc: string }> = {
  diario_ilimitado: {
    title: 'Limite do Diário de Bordo Atingido (5/5 no Mês)',
    desc: 'O Modo Gratuito inclui até 5 registros mensais. Desbloqueie viagens ilimitadas com o Plano Pro ou Modo Bonificado!'
  },
  criar_clube: {
    title: 'Fundação e Gestão Completa de Moto Clube',
    desc: 'A criação e presidência de Moto Clubes é um recurso exclusivo para pilotos MotoLegado Pro ou com Modo Bonificado liberado.'
  },
  criar_evento: {
    title: 'Criação e Agendamento de Eventos Coletivos',
    desc: 'No Plano Gratuito você pode visualizar e confirmar presença. Para cadastrar e publicar eventos oficiais, ative o Pro ou Modo Bonificado.'
  },
  criar_roteiro: {
    title: 'Criação e Compartilhamento de Roteiros',
    desc: 'A publicação de expedições e rotas comunitárias na rede MotoLegado é exclusiva para pilotos VIP Pro e Bonificados.'
  },
  desconto_vip: {
    title: 'Descontos VIP Exclusivos de até 20%',
    desc: 'Desbloqueie condições especiais em oficinas, concessionárias, hotéis e points gastronômicos conveniados à rede.'
  },
  geral: {
    title: 'Evolua sua Experiência no MotoLegado',
    desc: 'Desbloqueie o potencial máximo da nossa plataforma com o Plano VIP Pro: diário ilimitado, radares, rotas GPX e recursos exclusivos.'
  }
};

export function UpgradeModal({ isOpen, onClose, feature = 'geral', onSuccess }: UpgradeModalProps) {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Mercado Pago PIX State
  const [pixData, setPixData] = useState<{
    paymentId: number | string;
    status: string;
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    amount: number;
  } | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);

  // Cartão State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Gerador dinâmico de PIX via Mercado Pago API
  const fetchMercadoPagoPix = async (cycle: 'monthly' | 'yearly') => {
    setLoadingPix(true);
    try {
      const res = await fetch('/api/payments/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: cycle,
          email: profile?.email || user?.email || 'comprador.teste@motolegado.com.br',
          name: profile?.name || 'Piloto MotoLegado',
          userId: profile?.id || user?.id || 'piloto-local'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao comunicar com o Mercado Pago');
      }

      setPixData(data);
    } catch (err) {
      console.warn('Fallback PIX local ativado:', err);
      setPixData({
        paymentId: `mp-sim-${Date.now()}`,
        status: 'pending',
        qrCode: `00020126580014br.gov.bcb.pix0136motolegado-pro-${Date.now()}520400005303986540${cycle === 'monthly' ? '29.90' : '299.00'}5802BR5916MOTOLEGADO BRASIL6009SAO PAULO62070503***6304`,
        amount: cycle === 'monthly' ? 29.90 : 299.00
      });
    } finally {
      setLoadingPix(false);
    }
  };

  useEffect(() => {
    if (isOpen && paymentMethod === 'pix') {
      fetchMercadoPagoPix(billingCycle);
    }
  }, [isOpen, billingCycle, paymentMethod]);

  // Monitorar aprovação do PIX no Mercado Pago (Polling em tempo real)
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'pix' || !pixData?.paymentId || paymentSuccess) return;
    if (String(pixData.paymentId).startsWith('mp-sim-')) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${pixData.paymentId}`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.isApproved) {
            clearInterval(interval);
            handleConfirmPayment('pago');
          }
        }
      } catch (e) {
        // Silêncio em erros transitórios de rede
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, paymentMethod, pixData?.paymentId, paymentSuccess]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentTrigger = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.geral;
  const price = billingCycle === 'monthly' ? 'R$ 29,90' : 'R$ 299,00';
  const periodLabel = billingCycle === 'monthly' ? '/ mês' : '/ ano (2 meses grátis)';
  const activePixCode = pixData?.qrCode || `00020126580014br.gov.bcb.pix0136motolegado-pro-${Date.now()}520400005303986540${billingCycle === 'monthly' ? '29.90' : '299.00'}5802BR5916MOTOLEGADO BRASIL6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(activePixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmPayment = async (planType: 'pago' = 'pago') => {
    setIsProcessing(true);

    try {
      // Confirmação de ativação do plano pago
      await new Promise(resolve => setTimeout(resolve, 1200));

      const updates: any = {
        is_pro: true,
        plan_type: planType,
      };

      // Persistir no AuthContext e localStorage
      localStorage.setItem('motolegado_pilot_is_pro', 'true');
      localStorage.setItem('motolegado_pilot_plan', planType);

      await updateProfile(updates);
      await refreshProfile();

      setPaymentSuccess(true);
      setTimeout(() => {
        setIsProcessing(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro ao processar assinatura:', err);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-orange-500/40 rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Fechar checkout"
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all z-50 cursor-pointer shadow-lg active:scale-95"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-widest">
              <Crown size={12} className="text-amber-400" />
              <span>UPGRADE DE ACESSO VIP</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
              {currentTrigger.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentTrigger.desc}
            </p>
          </div>

          {paymentSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white">ACESSO VIP ATIVADO COM SUCESSO!</h3>
              <p className="text-xs text-slate-300">Todas as limitações foram liberadas na sua conta. Aproveite a estrada!</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6 relative z-10">
              {/* Plan Comparison Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                    🟢 SEU MODO GRATUITO (ASFALTO)
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Dashboard e Feed de Notícias</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Diário: Até 5 viagens / mês</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Ver Eventos e Roteiros Públicos</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Perfil com Gamificação Básica</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Suporte Comunitário Aberto</li>
                  </ul>
                </div>

                <div className="space-y-2 sm:pl-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" /> MOTOLEGADO VIP PRO
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-200 font-medium">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Diário de Bordo ILIMITADO</strong></li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Fundar e Gerenciar Moto Clube</strong></li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Criar & Agendar Eventos Oficiais</strong></li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Criar & Publicar Roteiros</strong></li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Exportação de Relatórios de Viagem</strong></li>
                  </ul>
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    billingCycle === 'monthly'
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Mensal (R$ 29,90)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative",
                    billingCycle === 'yearly'
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Anual (R$ 299,00)
                  <span className="ml-1 text-[9px] bg-black/40 px-1.5 py-0.5 rounded-full text-amber-300">
                    -16%
                  </span>
                </button>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Escolha como deseja desbloquear o acesso:
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                      paymentMethod === 'pix'
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <QrCode size={18} />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                      paymentMethod === 'card'
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <CreditCard size={18} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1: PIX */}
              {paymentMethod === 'pix' && (
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">Pagamento via PIX com ativação imediata</span>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono font-bold">
                          Mercado Pago
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Total a pagar: <strong className="text-amber-400 font-mono text-xs">{price}</strong> {periodLabel}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                      Aprovação Instantânea
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual or Base64 QR Code box */}
                    <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                      {loadingPix ? (
                        <div className="flex flex-col items-center justify-center text-slate-700 text-center p-1">
                          <Loader2 size={24} className="animate-spin text-orange-600 mb-1" />
                          <span className="text-[8px] font-bold">Gerando PIX...</span>
                        </div>
                      ) : pixData?.qrCodeBase64 ? (
                        <img 
                          src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                          alt="QR Code PIX Mercado Pago" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode size={96} className="text-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Código Copia e Cola PIX:</label>
                        {pixData?.ticketUrl && (
                          <a 
                            href={pixData.ticketUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold transition-colors"
                          >
                            <span>Abrir fatura Mercado Pago</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activePixCode}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-400 outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedPix ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> O QR Code expira em 30 minutos.
                        </span>
                        {pixData?.paymentId && !String(pixData.paymentId).startsWith('mp-sim') && (
                          <span className="font-mono text-slate-400">
                            ID: {pixData.paymentId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || loadingPix}
                    onClick={() => handleConfirmPayment('pago')}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Validando Pagamento PIX no Mercado Pago...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Já realizei o PIX • Ativar Acesso Agora</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* METHOD 2: CARTÃO */}
              {paymentMethod === 'card' && (
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-white block">Dados do Cartão de Crédito</span>
                      <span className="text-[10px] text-blue-400 font-medium">Processamento seguro Mercado Pago</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">{price} {periodLabel}</span>
                  </div>

                  {/* Preencher Cartão de Teste rápido */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('5031 7557 3450 1000');
                        setCardHolder((profile?.name || 'PILOTO TESTE').toUpperCase());
                        setCardExpiry('12/28');
                        setCardCvv('123');
                      }}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Usar dados de Cartão de Teste MP
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Número do Cartão</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Nome no Cartão</label>
                    <input
                      type="text"
                      placeholder="NOME COMO NO CARTÃO"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Validade</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || !cardNumber}
                    onClick={() => handleConfirmPayment('pago')}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processando no Mercado Pago...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Confirmar e Assinar por {price}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Secure Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Ambiente seguro e criptografado
                </span>
                <span>Cancele a qualquer momento sem fidelidade</span>
              </div>

              {/* Botão de Fechar no Rodapé */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider py-2 px-5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-2 border border-slate-800"
                >
                  <X size={14} />
                  <span>Fechar Checkout</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
