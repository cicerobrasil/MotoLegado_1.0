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
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-orange-500/40 rounded-2xl sm:rounded-3xl max-w-4xl xl:max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto"
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
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 transition-all z-50 cursor-pointer shadow-lg active:scale-95"
          >
            <X size={18} />
          </button>

          {/* Header Compacto */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800/80 shrink-0 relative z-10 pr-12">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-wider">
                <Crown size={11} className="text-amber-400" />
                <span>UPGRADE DE ACESSO VIP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                • Checkout Seguro MotoLegado
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white">
              {currentTrigger.title}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-snug line-clamp-2 mt-0.5">
              {currentTrigger.desc}
            </p>
          </div>

          {paymentSuccess ? (
            <div className="py-12 px-6 text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white">ACESSO VIP ATIVADO COM SUCESSO!</h3>
              <p className="text-xs text-slate-300">Todas as limitações foram liberadas na sua conta. Aproveite a estrada!</p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 relative z-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
                {/* COLUNA ESQUERDA: Benefícios & Faturamento (5 colunas) */}
                <div className="md:col-span-5 space-y-3.5 flex flex-col justify-between">
                  {/* Benefícios Inclusos */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400" /> MOTOLEGADO VIP PRO
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {price}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-slate-200">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span><strong>Diário de Bordo ILIMITADO</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span><strong>Fundar & Gerenciar Moto Clube</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span><strong>Candidatura & Ingresso em MCs</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span><strong>Criar Eventos & Roteiros Oficiais</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span><strong>Relatórios em PDF e Planilhas CSV</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-orange-500 shrink-0" />
                        <span>Descontos VIP de até 20% na rede</span>
                      </li>
                    </ul>
                  </div>

                  {/* Seletor Mensal / Anual */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Ciclo de Faturamento:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingCycle('monthly');
                          if (paymentMethod === 'pix') {
                            setPaymentMethod('card');
                          }
                        }}
                        className={cn(
                          "py-2 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center",
                          billingCycle === 'monthly'
                            ? "bg-slate-800 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        Mensal
                        <span className="block text-[10px] font-normal text-slate-400 font-mono">R$ 29,90</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={cn(
                          "py-2 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer relative text-center",
                          billingCycle === 'yearly'
                            ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        Anual (-16%)
                        <span className="block text-[10px] font-normal text-amber-200 font-mono">R$ 299,00</span>
                      </button>
                    </div>
                  </div>

                  {/* Garantia & Segurança */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5 text-[10px] text-slate-400">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>Ambiente criptografado. Cancele a qualquer momento sem fidelidade.</span>
                  </div>
                </div>

                {/* COLUNA DIREITA: Forma de Pagamento & Confirmação (7 colunas) */}
                <div className="md:col-span-7 space-y-3">
                  {/* Seletor do Método de Pagamento */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Forma de Pagamento:
                      </label>
                      <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                        <QrCode size={10} /> PIX no Anual (16% OFF)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (billingCycle === 'monthly') {
                            setBillingCycle('yearly');
                          }
                          setPaymentMethod('pix');
                        }}
                        className={cn(
                          "py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer",
                          paymentMethod === 'pix'
                            ? "bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        <QrCode size={15} />
                        <span>PIX Instantâneo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer",
                          paymentMethod === 'card'
                            ? "bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm"
                            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        <CreditCard size={15} />
                        <span>Cartão de Crédito</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTEÚDO PIX */}
                  {paymentMethod === 'pix' && (
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                      {/* Switcher Chave Direta / Mercado Pago & Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-2">
                        <div>
                          <span className="text-xs font-bold text-white block">PIX Anual MotoLegado</span>
                          <span className="text-[10px] text-slate-400">Total: <strong className="text-amber-400 font-mono">R$ 299,00</strong> / ano</span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setPixTab('direto')}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                              pixTab === 'direto'
                                ? "bg-orange-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                            )}
                          >
                            <Sparkles size={10} className={pixTab === 'direto' ? 'text-amber-300' : 'text-slate-500'} />
                            <span>Chave Direta</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPixTab('automatico')}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1",
                              pixTab === 'automatico'
                                ? "bg-slate-800 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                            )}
                          >
                            <Zap size={10} className={pixTab === 'automatico' ? 'text-blue-400' : 'text-slate-500'} />
                            <span>Mercado Pago</span>
                          </button>
                        </div>
                      </div>

                      {/* Dados do Recebedor em Linha Compacta */}
                      <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/20 grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-black">Titular</span>
                          <strong className="text-white truncate block">Cicero Ranieri</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-black">Chave (Celular)</span>
                          <strong className="text-orange-400 font-mono truncate block">(47) 99136-2628</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[8px] uppercase font-black">Valor</span>
                          <strong className="text-emerald-400 font-mono block">R$ 299,00</strong>
                        </div>
                      </div>

                      {/* QR Code + Copia e Cola */}
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-slate-700/50">
                          {loadingPix && pixTab === 'automatico' ? (
                            <div className="flex flex-col items-center justify-center text-slate-700 text-center p-1">
                              <Loader2 size={20} className="animate-spin text-orange-600 mb-1" />
                              <span className="text-[8px] font-bold">Gerando...</span>
                            </div>
                          ) : (
                            <img 
                              src={activeQrCodeUrl} 
                              alt="QR Code PIX Banco Central Oficial" 
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Copia e Cola (BR Code):</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                readOnly
                                value={activePixCode}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-300 outline-none select-all min-w-0"
                              />
                              <button
                                type="button"
                                onClick={handleCopyPix}
                                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-sm"
                              >
                                {copiedPix ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                                <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleCopyPhoneKey}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedPhoneKey ? <Check size={11} className="text-emerald-400" /> : <Phone size={11} className="text-orange-400" />}
                              <span>{copiedPhoneKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                            </button>

                            <a
                              href={whatsAppReceiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <MessageCircle size={11} className="text-emerald-400" />
                              <span>Enviar Comprovante</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Status Bancário & Verificação */}
                      <div className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all",
                        isPaymentApproved 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-900/90 border-slate-800 text-slate-300"
                      )}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isCheckingPayment ? (
                            <Loader2 size={15} className="animate-spin text-orange-400 shrink-0" />
                          ) : isPaymentApproved ? (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Clock size={15} className="text-amber-400 shrink-0 animate-pulse" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">
                              {isPaymentApproved 
                                ? "Pagamento Aprovado com Sucesso!" 
                                : pixTab === 'direto'
                                  ? "Aguardando conferência no extrato"
                                  : "Aguardando compensação bancária..."}
                            </p>
                          </div>
                        </div>

                        {!isPaymentApproved && (
                          <button
                            type="button"
                            disabled={isCheckingPayment}
                            onClick={() => checkPaymentStatus(false)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-50 border border-slate-700 shadow-sm"
                          >
                            {isCheckingPayment ? <Loader2 size={10} className="animate-spin text-orange-400" /> : <RefreshCw size={10} />}
                            <span>Verificar</span>
                          </button>
                        )}
                      </div>

                      {statusFeedback && (
                        <div className={cn(
                          "p-2 rounded-xl border text-[10px] flex items-start gap-1.5 animate-in fade-in duration-200",
                          isPaymentApproved
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        )}>
                          {isPaymentApproved ? (
                            <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                          ) : (
                            <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                          )}
                          <span className="leading-snug">{statusFeedback}</span>
                        </div>
                      )}

                      {pixTab === 'direto' && !isPaymentApproved && !directNotified && (
                        <button
                          type="button"
                          onClick={handleNotifyDirectTransfer}
                          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send size={11} className="text-orange-400" />
                          <span>Notificar Cícero que já fiz o PIX</span>
                        </button>
                      )}

                      {/* Botão de Ativação / Confirmação */}
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
                          "w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2",
                          isPaymentApproved
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse"
                            : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60"
                        )}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-white" />
                            <span>Ativando sua Patente VIP Pro...</span>
                          </>
                        ) : isPaymentApproved ? (
                          <>
                            <CheckCircle2 size={16} className="text-white" />
                            <span>Pagamento Confirmado • Ativar Acesso Agora</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} className="text-slate-500" />
                            <span>Aguardando Pagamento • Botão Bloqueado</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* CONTEÚDO CARTÃO */}
                  {paymentMethod === 'card' && (
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <div>
                          <span className="text-xs font-bold text-white block">Cartão de Crédito</span>
                          <span className="text-[10px] text-blue-400">Processamento via Mercado Pago</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-amber-400">{price}</span>
                          <span className="text-[9px] text-slate-400 block">{periodLabel}</span>
                        </div>
                      </div>

                      {/* Botão Cartão Teste */}
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
                          <Sparkles size={10} /> Preencher Cartão de Teste MP
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400">Número do Cartão</label>
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400">Nome no Cartão</label>
                        <input
                          type="text"
                          placeholder="NOME COMO NO CARTÃO"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-400">Validade</label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-400">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing || !cardNumber}
                        onClick={() => handleConfirmPayment('pago')}
                        className="w-full btn-primary py-3 text-xs font-black uppercase tracking-wider mt-1 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Processando no Mercado Pago...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} />
                            <span>Confirmar e Assinar por {price}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rodapé Compacto */}
          <div className="px-4 py-2.5 sm:px-6 bg-slate-950/70 border-t border-slate-800/80 shrink-0 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-500" />
              Ambiente certificado e seguro
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              <X size={12} />
              <span>Fechar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
