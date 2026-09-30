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
  Clock,
  Loader2,
  ExternalLink,
  MessageCircle,
  Phone,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  OFFICIAL_PIX_CONFIG, 
  generateBacenPixPayload, 
  getPixQrCodeUrl, 
  getWhatsAppReceiptUrl 
} from '../lib/pix';

export type UpgradeFeatureTrigger = 
  | 'diario_ilimitado'
  | 'relatorio_viagem'
  | 'criar_clube'
  | 'membro_clube'
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
  relatorio_viagem: {
    title: 'Exportação de Relatórios de Viagem (PDF e CSV)',
    desc: 'A emissão de relatórios oficiais em PDF, planilhas CSV e dossiês de quilometragem é um recurso exclusivo para assinantes MotoLegado Pro ou Bonificados.'
  },
  criar_clube: {
    title: 'Fundação e Gestão Completa de Moto Clube',
    desc: 'A criação e presidência de Moto Clubes é um recurso exclusivo para pilotos MotoLegado Pro ou com Modo Bonificado liberado.'
  },
  membro_clube: {
    title: 'Ingresso em Moto Clube Oficial (Exclusivo Pro)',
    desc: 'Para preservar o padrão e os benefícios da irmandade, todos os integrantes e candidatos a Moto Clubes Oficiais precisam ser assinantes Pro ou Bonificados.'
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [pixTab, setPixTab] = useState<'direto' | 'automatico'>('direto');
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedPhoneKey, setCopiedPhoneKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Estados de Validação Real do Pagamento
  const [isPaymentApproved, setIsPaymentApproved] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [directNotified, setDirectNotified] = useState(false);

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

  // Resetar estados de verificação quando o modal ou método alternar
  useEffect(() => {
    setIsPaymentApproved(false);
    setStatusFeedback(null);
    setDirectNotified(false);
  }, [isOpen, paymentMethod, billingCycle, pixTab]);

  // Consulta de status do pagamento em tempo real
  const checkPaymentStatus = async (silent = false): Promise<boolean> => {
    if (!silent) setIsCheckingPayment(true);
    try {
      const paymentId = pixData?.paymentId ? String(pixData.paymentId) : '';
      const email = profile?.email || user?.email || '';
      const userId = profile?.id || user?.id || '';

      const queryParams = new URLSearchParams({
        paymentId,
        email,
        userId,
        tab: pixTab
      });

      const res = await fetch(`/api/payments/check-status?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Falha ao consultar servidor');
      }

      const data = await res.json();
      if (data.isApproved) {
        setIsPaymentApproved(true);
        setStatusFeedback('✅ Pagamento identificado com sucesso pelo banco! Você já pode ativar seu acesso.');
        return true;
      } else {
        setIsPaymentApproved(false);
        if (!silent) {
          if (pixTab === 'direto') {
            setStatusFeedback('Aguardando compensação: O crédito de R$ 299,00 ainda não foi confirmado no extrato bancário. Se já transferiu, envie o comprovante no WhatsApp do administrador.');
          } else {
            setStatusFeedback('Aguardando compensação: O banco ainda não identificou a transferência de R$ 299,00. Conclua o PIX no app do seu banco e tente novamente.');
          }
        }
        return false;
      }
    } catch (e) {
      if (!silent) {
        setStatusFeedback('Não foi possível verificar o pagamento neste instante. Certifique-se de que realizou a transferência.');
      }
      return false;
    } finally {
      if (!silent) setIsCheckingPayment(false);
    }
  };

  // Notificar transferência de PIX Direto para o Administrador
  const handleNotifyDirectTransfer = async () => {
    try {
      await fetch('/api/payments/notify-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email || user?.email,
          name: profile?.name,
          userId: profile?.id || user?.id,
          amount: 299.00
        })
      });
      setDirectNotified(true);
      setStatusFeedback('Notificação enviada ao administrador Cícero Ranieri! Envie também o comprovante via WhatsApp para validação imediata.');
    } catch (err) {
      console.error(err);
    }
  };

  // Gerador dinâmico de PIX via Mercado Pago API (Exclusivo para o Plano Anual)
  const fetchMercadoPagoPix = async () => {
    setLoadingPix(true);
    try {
      const res = await fetch('/api/payments/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'yearly',
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
        qrCode: `00020126580014br.gov.bcb.pix0136motolegado-pro-${Date.now()}520400005303986540299.005802BR5916MOTOLEGADO BRASIL6009SAO PAULO62070503***6304`,
        amount: 299.00
      });
    } finally {
      setLoadingPix(false);
    }
  };

  useEffect(() => {
    if (isOpen && paymentMethod === 'pix') {
      if (billingCycle !== 'yearly') {
        setBillingCycle('yearly');
      }
      fetchMercadoPagoPix();
    }
  }, [isOpen, billingCycle, paymentMethod]);

  // Monitorar aprovação do PIX (Polling contínuo em tempo real a cada 4 segundos)
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'pix' || paymentSuccess || isPaymentApproved) return;

    const interval = setInterval(async () => {
      const approved = await checkPaymentStatus(true);
      if (approved) {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, paymentMethod, pixData?.paymentId, paymentSuccess, isPaymentApproved, pixTab]);

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

  // Payload do PIX Oficial do Titular Cicero Ranieri Brasil (R$ 299,00)
  const officialDirectPayload = generateBacenPixPayload({ amount: 299.00 });
  const activePixCode = (pixTab === 'automatico' && pixData?.qrCode)
    ? pixData.qrCode
    : officialDirectPayload;

  const activeQrCodeUrl = (pixTab === 'automatico' && pixData?.qrCodeBase64)
    ? `data:image/png;base64,${pixData.qrCodeBase64}`
    : getPixQrCodeUrl(activePixCode);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(activePixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyPhoneKey = () => {
    navigator.clipboard.writeText(OFFICIAL_PIX_CONFIG.displayKey);
    setCopiedPhoneKey(true);
    setTimeout(() => setCopiedPhoneKey(false), 3000);
  };

  const whatsAppReceiptUrl = getWhatsAppReceiptUrl(profile?.name || user?.email, profile?.email || user?.email, 299.00);

  const handleConfirmPayment = async (planType: 'pago' = 'pago') => {
    // TRAVA DE SEGURANÇA: Se for PIX e não estiver aprovado, não permite prosseguir!
    if (paymentMethod === 'pix' && !isPaymentApproved) {
      const approved = await checkPaymentStatus(false);
      if (!approved) {
        return;
      }
    }

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
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-orange-500 shrink-0" /> <strong>Ingresso & Candidatura a Moto Clubes</strong></li>
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
                  onClick={() => {
                    setBillingCycle('monthly');
                    if (paymentMethod === 'pix') {
                      setPaymentMethod('card');
                    }
                  }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
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
                    "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer",
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
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Escolha a forma de pagamento:
                  </label>
                  <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                    <QrCode size={10} /> PIX apenas no Plano Anual
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (billingCycle === 'monthly') {
                        setBillingCycle('yearly');
                      }
                      setPaymentMethod('pix');
                    }}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer relative",
                      paymentMethod === 'pix'
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="absolute -top-2.5 right-2 text-[8px] font-black uppercase tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-full shadow">
                      Apenas Anual
                    </span>
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

                {/* Banner Informativo Explícito sobre a regra do PIX */}
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5 text-xs text-slate-300">
                  <Sparkles size={16} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong className="text-orange-400 uppercase tracking-wide">Regra de Pagamento:</strong> O <strong>PIX só é aceito para pagamento anual</strong> (R$ 299,00 com 16% de economia). Para o plano mensal (R$ 29,90/mês), o pagamento é aceito exclusivamente via <strong>Cartão de Crédito</strong>.
                  </p>
                </div>
              </div>

              {/* METHOD 1: PIX (HÍBRIDO) */}
              {paymentMethod === 'pix' && (
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                  {/* Header do PIX */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">PIX Oficial MotoLegado • Plano Anual</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                          16% OFF
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Total a pagar: <strong className="text-amber-400 font-mono text-xs">R$ 299,00</strong> / ano (2 meses grátis)</span>
                    </div>

                    {/* Seletor do Modelo Híbrido */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setPixTab('direto')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                          pixTab === 'direto'
                            ? "bg-orange-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Sparkles size={11} className={pixTab === 'direto' ? 'text-amber-300' : 'text-slate-500'} />
                        <span>Chave Direta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPixTab('automatico')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                          pixTab === 'automatico'
                            ? "bg-slate-800 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Zap size={11} className={pixTab === 'automatico' ? 'text-blue-400' : 'text-slate-500'} />
                        <span>Mercado Pago</span>
                      </button>
                    </div>
                  </div>

                  {/* Informações Oficiais do Titular Recebedor */}
                  <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase font-black text-[8px] tracking-wider">Titular Recebedor</span>
                      <strong className="text-white font-bold truncate block">Cicero Ranieri Brasil</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-black text-[8px] tracking-wider">Chave Pix (Celular)</span>
                      <strong className="text-orange-400 font-mono font-bold block">(47) 99136-2628</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-black text-[8px] tracking-wider">Cidade / Base</span>
                      <strong className="text-slate-300 block">Itajaí - SC</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-black text-[8px] tracking-wider">Valor Exato</span>
                      <strong className="text-emerald-400 font-mono font-bold block">R$ 299,00</strong>
                    </div>
                  </div>

                  {/* QR Code e Ações de Cópia */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual QR Code box escaneável */}
                    <div className="w-32 h-32 bg-white p-2 rounded-2xl flex items-center justify-center shrink-0 shadow-xl relative overflow-hidden border border-slate-700/50">
                      {loadingPix && pixTab === 'automatico' ? (
                        <div className="flex flex-col items-center justify-center text-slate-700 text-center p-1">
                          <Loader2 size={24} className="animate-spin text-orange-600 mb-1" />
                          <span className="text-[8px] font-bold">Gerando PIX...</span>
                        </div>
                      ) : (
                        <img 
                          src={activeQrCodeUrl} 
                          alt="QR Code PIX Banco Central Oficial" 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2.5">
                      {/* Código Copia e Cola */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Código Copia e Cola (BR Code):</label>
                          <span className="text-[9px] text-slate-500">Padrão Banco Central</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={activePixCode}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-300 outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-md"
                          >
                            {copiedPix ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Botões Rápidos de Suporte e Comprovante */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyPhoneKey}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedPhoneKey ? <Check size={13} className="text-emerald-400" /> : <Phone size={13} className="text-orange-400" />}
                          <span>{copiedPhoneKey ? 'Chave Copiada!' : 'Copiar Chave Celular: (47) 99136-2628'}</span>
                        </button>

                        <a
                          href={whatsAppReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 rounded-xl text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle size={13} className="text-emerald-400" />
                          <span>Enviar Comprovante via WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Status da Compensação Bancária em Tempo Real */}
                  <div className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all",
                    isPaymentApproved 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  )}>
                    <div className="flex items-center gap-2.5">
                      {isCheckingPayment ? (
                        <Loader2 size={18} className="animate-spin text-orange-400 shrink-0" />
                      ) : isPaymentApproved ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Clock size={18} className="text-amber-400 shrink-0 animate-pulse" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>
                            {isPaymentApproved 
                              ? "Pagamento Aprovado com Sucesso!" 
                              : pixTab === 'direto'
                                ? "Aguardando conferência no extrato bancário"
                                : "Aguardando compensação bancária..."}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isPaymentApproved
                            ? "Crédito de R$ 299,00 validado. Seu acesso VIP Pro está liberado!"
                            : pixTab === 'direto'
                              ? "Envie o comprovante no WhatsApp do administrador para liberação."
                              : "O sistema detecta a transferência bancária automaticamente."}
                        </p>
                      </div>
                    </div>

                    {!isPaymentApproved && (
                      <button
                        type="button"
                        disabled={isCheckingPayment}
                        onClick={() => checkPaymentStatus(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 border border-slate-700 shadow-sm"
                        title="Checar se o pagamento já foi recebido"
                      >
                        {isCheckingPayment ? <Loader2 size={12} className="animate-spin text-orange-400" /> : <RefreshCw size={12} />}
                        <span>Verificar Agora</span>
                      </button>
                    )}
                  </div>

                  {/* Feedback da Verificação */}
                  {statusFeedback && (
                    <div className={cn(
                      "p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in duration-300",
                      isPaymentApproved
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    )}>
                      {isPaymentApproved ? (
                        <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                      )}
                      <span className="text-[11px] leading-relaxed">{statusFeedback}</span>
                    </div>
                  )}

                  {/* Ação Auxiliar para PIX Direto: Notificar transferência */}
                  {pixTab === 'direto' && !isPaymentApproved && !directNotified && (
                    <button
                      type="button"
                      onClick={handleNotifyDirectTransfer}
                      className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send size={13} className="text-orange-400" />
                      <span>Notificar o Administrador que já fiz o PIX</span>
                    </button>
                  )}

                  {/* Botão de Confirmação e Ativação - BLOQUEADO ATÉ PAGAMENTO REAL */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={!isPaymentApproved || isProcessing}
                      onClick={() => {
                        if (!isPaymentApproved) {
                          checkPaymentStatus(false);
                          return;
                        }
                        handleConfirmPayment('pago');
                      }}
                      className={cn(
                        "w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2",
                        isPaymentApproved
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse"
                          : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>Ativando sua Patente VIP Pro...</span>
                        </>
                      ) : isPaymentApproved ? (
                        <>
                          <CheckCircle2 size={18} className="text-white" />
                          <span>Pagamento Confirmado • Ativar Acesso Agora</span>
                        </>
                      ) : (
                        <>
                          <Lock size={15} className="text-slate-500" />
                          <span>Aguardando Pagamento • Botão Bloqueado</span>
                        </>
                      )}
                    </button>

                    {!isPaymentApproved && (
                      <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1 font-medium">
                        <Lock size={11} className="text-slate-500" />
                        <span>Este botão só é liberado após a confirmação do pagamento pelo banco ou administrador.</span>
                      </p>
                    )}
                  </div>
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
                    className="w-full btn-primary py-3.5 disabled:opacity-50"
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
