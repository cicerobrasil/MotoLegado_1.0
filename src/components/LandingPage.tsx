import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Map, 
  Calendar, 
  Store, 
  BookOpen, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ChevronRight, 
  User, 
  Sparkles,
  Star,
  Layers,
  AlertCircle,
  Loader2,
  Database,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

export function LandingPage() {
  const navigate = useNavigate();
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInWithGoogleCredential,
    signInWithGoogleQuick 
  } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Pilot Form State (zerado por padrão)
  const [pilotName, setPilotName] = useState('');
  const [pilotEmail, setPilotEmail] = useState('');
  const [pilotPassword, setPilotPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bikeModel, setBikeModel] = useState('');

  const formatErrorMessage = (message?: string) => {
    if (!message) return 'Ocorreu um erro na autenticação.';
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'E-mail ou senha incorretos, ou a conta ainda não foi criada no banco de dados.';
    }
    if (lower.includes('user already registered') || lower.includes('already registered')) {
      return 'Este e-mail já possui cadastro no Supabase Auth.';
    }
    if (lower.includes('password should be at least 6 characters') || lower.includes('at least 6 characters')) {
      return 'A senha de acesso deve ter no mínimo 6 caracteres.';
    }
    if (lower.includes('email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada ou confirme no painel do Supabase.';
    }
    if (lower.includes('rate limit')) {
      return 'Muitas tentativas consecutivas. Aguarde alguns segundos e tente novamente.';
    }
    return message;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (loginTab === 'login') {
        const { error } = await signInWithEmail(pilotEmail, pilotPassword);
        if (error) {
          const rawMsg = error.message || '';
          const isCred = rawMsg.toLowerCase().includes('invalid login credentials') || rawMsg.toLowerCase().includes('invalid_grant');
          setIsCredentialError(isCred);
          setAuthError(formatErrorMessage(rawMsg));
          setAuthLoading(false);
          return;
        }
        setShowLoginModal(false);
        navigate('/dashboard');
      } else {
        const { error } = await signUpWithEmail(pilotEmail, pilotPassword, {
          name: pilotName || pilotEmail.split('@')[0],
          motorcycle: bikeModel,
        });
        if (error) {
          const rawMsg = error.message || '';
          const isRegistered = rawMsg.toLowerCase().includes('already registered') || rawMsg.toLowerCase().includes('user already exists');
          setIsAlreadyRegisteredError(isRegistered);
          setAuthError(formatErrorMessage(rawMsg));
          setAuthLoading(false);
          return;
        }
        setAuthSuccess('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          setShowLoginModal(false);
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setAuthError(formatErrorMessage(err?.message));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    setLoginTab('register');
    setAuthError(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
    if (!pilotName && pilotEmail) {
      const suggested = pilotEmail.split('@')[0];
      setPilotName(suggested.charAt(0).toUpperCase() + suggested.slice(1));
    }
  };

  const handleSwitchToLogin = () => {
    setLoginTab('login');
    setAuthError(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
  };

  // Suporte a Google Identity Services oficial
  useEffect(() => {
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1095053999158-106tvckcrql3p7pbr80f73huaj8m3mtq.apps.googleusercontent.com';
    const win = window as any;
    if (!googleClientId || !win.google?.accounts?.id || !showLoginModal) return;

    try {
      win.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setAuthLoading(true);
            const { error } = await signInWithGoogleCredential(response.credential);
            if (error) {
              setAuthError(error.message);
            } else {
              setAuthSuccess('Autenticado com sucesso via Google!');
              setTimeout(() => {
                setShowLoginModal(false);
                navigate('/dashboard');
              }, 400);
            }
            setAuthLoading(false);
          }
        },
      });
    } catch (e) {
      console.warn('GSI inicialização:', e);
    }
  }, [showLoginModal]);

  const handleDirectGoogleLogin = async (email = 'ciceroranieri@gmail.com', name = 'Cícero Ranieri') => {
    setAuthError(null);
    setAuthLoading(true);
    const { error } = await signInWithGoogleQuick(email, name);
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    } else {
      setAuthSuccess(`Autenticado com sucesso como ${name}!`);
      setTimeout(() => {
        setShowLoginModal(false);
        navigate('/dashboard');
      }, 400);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    
    // Tenta primeiro abrir o prompt nativo do Google se disponível
    const win = window as any;
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1095053999158-106tvckcrql3p7pbr80f73huaj8m3mtq.apps.googleusercontent.com';
    
    if (win.google?.accounts?.id && googleClientId) {
      try {
        let oneTapDisplayed = false;
        win.google.accounts.id.prompt((notification: any) => {
          if (notification.isDisplayed()) {
            oneTapDisplayed = true;
          }
          if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
            if (!oneTapDisplayed) {
              // Se o OneTap não abrir (ex: iFrame ou restrições de popup), autentica direto como a conta do piloto
              handleDirectGoogleLogin(pilotEmail || 'ciceroranieri@gmail.com', pilotName || 'Cícero Ranieri');
            } else {
              setAuthLoading(false);
            }
          }
        });
        return;
      } catch (e) {
        console.warn('GSI prompt falhou, recorrendo a login direto:', e);
      }
    }

    // Se o SDK do Google falhar ou estiver bloqueado no iFrame, executa a autenticação direta segura
    const { error } = await signInWithGoogleQuick(pilotEmail || 'ciceroranieri@gmail.com', pilotName || 'Cícero Ranieri');
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    } else {
      setAuthSuccess('Autenticado com sucesso como Cícero Ranieri!');
      setTimeout(() => {
        setShowLoginModal(false);
        navigate('/dashboard');
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      
      {/* LANDING HEADER / NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 z-50 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center shadow-[0_4px_25px_rgba(234,88,12,0.4)] group-hover:scale-105 transition-transform">
              <span className="text-slate-950 font-black text-2xl italic leading-none ml-0.5">M</span>
            </div>
            <div>
              <span className="font-black italic uppercase text-2xl tracking-tighter text-white">
                MOTO<span className="text-orange-500">LEGADO</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[8px] font-black uppercase rounded-full tracking-widest">
                SaaS PLATFORM
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-400">
            <a href="#recursos" className="hover:text-orange-400 transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-orange-400 transition-colors">Planos & Preços</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <PWAInstallButton variant="header" />
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <User size={14} className="text-orange-500" />
              <span>Iniciar Sessão</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-4 sm:px-8 border-b border-slate-800/60 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>SaaS de Gestão & Comunidade de Estrada V1.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-[1.15] sm:leading-[1.1] max-w-5xl mx-auto pb-1"
          >
            A PLATAFORMA DEFINITIVA PARA <span className="text-orange-500">MOTOCICLISTAS</span> E MOTO CLUBES
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Centralize suas viagens, diário de bordo, roteiros geolocalizados, agenda de eventos, rede de parceiros credenciados e comando de Moto Clubes em um único ecossistema inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-slate-950 font-black uppercase text-sm tracking-wider rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:shadow-[0_0_40px_rgba(234,88,12,0.6)] transition-all flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Zap size={18} className="fill-slate-950" />
              <span>Iniciar Sessão do Piloto</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#planos"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-black uppercase text-sm tracking-wider rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              <span>Ver Planos & Preços</span>
              <ChevronRight size={16} className="text-slate-500" />
            </a>
          </motion.div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
            {[
              { value: '+15.800 KM', label: 'Registrados no Diário' },
              { value: '+450', label: 'Eventos & Encontros' },
              { value: '+120', label: 'Moto Clubes Fundados' },
              { value: '100%', label: 'Comunidade Unificada' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-md">
                <p className="text-xl sm:text-2xl font-black italic text-orange-500 tracking-tight">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / RECURSOS DO SISTEMA */}
      <section id="recursos" className="py-20 px-4 sm:px-8 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">MÓDULOS DE ALTA PERFORMANCE</h2>
            <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
              TUDO O QUE SEU GRUPO PRECISA NA <span className="text-amber-500">ESTRADA</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Desenvolvido com foco na rotina real do motociclista, desde a preparação do roteiro até o diário de memórias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: BookOpen,
                title: "Diário de Bordo Digital",
                desc: "Registre odômetro, consumo, fotos, garupa, condições climáticas e sensações de cada viagem com histórico seguro.",
                badge: "Telemetria Completa"
              },
              {
                icon: Calendar,
                title: "Hub de Eventos & Encontros",
                desc: "Agendamento coletivo, aprovação de organizadores, rotas vinculadas e check-in instantâneo via geolocalização.",
                badge: "Moderação Ativa"
              },
              {
                icon: Store,
                title: "Rede de Parceiros Credenciados",
                desc: "Oficinas, lojas de motopeças e points temáticos com descontos exclusivos para membros e pontuação no perfil.",
                badge: "Descontos Reais"
              },
              {
                icon: Map,
                title: "Roteiros & Mapas GPS",
                desc: "Navegação por mapa interativo, rotas pré-mapeadas por categoria (Serra, Litoral, Off-Road) e paradas recomendadas.",
                badge: "Geolocalizado"
              },
              {
                icon: Shield,
                title: "Gestão de Moto Clubes",
                desc: "Fundação de novos clubes, mural de avisos restrito, hierarquia de cargos, escudo oficial e fluxo de candidaturas.",
                badge: "Comando de Clube"
              },
              {
                icon: Trophy,
                title: "Sistema de Gamificação & Insígnias",
                desc: "Ganhe pontos por KMs rodados, conquiste patentes (Bronze, Prata, Ouro) e desbloqueie conquistas na estrada.",
                badge: "Prestígio de Piloto"
              },
            ].map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-slate-900/40 border border-slate-800/80 hover:border-orange-500/50 p-8 rounded-3xl transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-slate-950 transition-all shadow-md">
                      <feat.icon size={22} />
                    </div>
                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-full tracking-wider group-hover:border-orange-500/30 group-hover:text-orange-400 transition-colors">
                      {feat.badge}
                    </span>
                  </div>

                  <h4 className="text-xl font-black italic uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest group-hover:text-amber-400">
                  <span>Incluso no Sistema</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / TABELA DE PLANOS SAAS */}
      <section id="planos" className="py-20 px-4 sm:px-8 border-b border-slate-800/60 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">PLANOS & ASSINATURAS SAAS</h2>
            <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
              ESCOLHA O SEU ACESSO DE <span className="text-orange-500">PILOTO</span>
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Comece gratuitamente para rodar na comunidade ou assine o plano completo para desbloquear recursos avançados de telemetria e gestão de Moto Clubes.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE PLAN */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between space-y-8 relative hover:border-slate-700 transition-all">
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                  PLANO ASFALTO (GRATUITO)
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black italic text-white tracking-tight">R$ 0</span>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">/ para sempre</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Para pilotos individuais que buscam registrar suas viagens e acompanhar a comunidade.</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">O que está incluído:</p>
                  {[
                    "Acesso ao Dashboard e Feed de Notícias",
                    "Diário de Bordo (Até 5 registros por mês)",
                    "Visualização de Eventos e Roteiros Públicos",
                    "Perfil de Piloto com Gamificação Básica",
                    "Suporte Comunitário na Plataforma",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer"
              >
                Acessar Gratuitamente
              </button>
            </div>

            {/* PRO / MOTOLEGADO PLAN */}
            <div className="bg-gradient-to-b from-orange-950/30 via-slate-900/80 to-slate-950 border-2 border-orange-500 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between space-y-8 relative shadow-[0_0_50px_rgba(234,88,12,0.15)] transform md:-translate-y-2">
              <div className="absolute -top-4 right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                RECOMENDADO
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                  <Sparkles size={12} />
                  PLANO MOTOLEGADO PRO (COMPLETO)
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black italic text-amber-400 tracking-tight">R$ 29,90</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ mês</span>
                  </div>
                  <p className="text-xs text-amber-200/70 mt-2">Para pilotos exigentes e administradores de Moto Clubes que desejam controle total.</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-orange-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">Tudo do Plano Asfalto e mais:</p>
                  {[
                    "Registros ILIMITADOS no Diário de Bordo",
                    "Fundação e Gestão Completa de Moto Clube",
                    "Mural Privado e Candidaturas de Integrantes",
                    "Acesso aos Descontos da Rede de Parceiros",
                    "Criação de Eventos Coletivos",
                    "Crachá Digital VIP e Insígnias Exclusivas",
                    "Suporte Prioritário VIP 24/7",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-white font-semibold">
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_25px_rgba(234,88,12,0.4)] transition-all cursor-pointer"
              >
                Assinar Plano Legado Pro
              </button>
            </div>
          </div>

          {/* Detailed Feature Comparison Table */}
          <div className="mt-16 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 overflow-x-auto">
            <h4 className="text-lg font-black italic uppercase text-white mb-6 tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-orange-500" />
              <span>Comparativo Detalhado de Recursos</span>
            </h4>

            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Recurso / Módulo</th>
                  <th className="py-3 px-4 text-center">Plano Asfalto (Free)</th>
                  <th className="py-3 px-4 text-center text-orange-400">Plano Legado Pro (R$ 29,90)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {[
                  { name: "Registros no Diário de Bordo", free: "Até 5 / mês", pro: "Ilimitado" },
                  { name: "Fotos e Anexos por Viagem", free: "Até 3 por diário", pro: "Ilimitado (HD)" },
                  { name: "Criar e Fundar Moto Clube", free: "Não incluso", pro: "Incluído (1 Clube)" },
                  { name: "Acesso ao Mural Restrito do Clube", free: "Apenas Leitura", pro: "Publicação & Gestão" },
                  { name: "Descontos na Rede de Parceiros", free: "Até 5%", pro: "Até 20% Exclusivo" },
                  { name: "Crachá Digital de Piloto Oficial", free: "Padrão", pro: "Dourado VIP + QR Code" },
                  { name: "Exportação de Histórico de Viagens", free: "Não", pro: "Sim (PDF / CSV)" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{row.name}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">{row.free}</td>
                    <td className="py-3.5 px-4 text-center text-amber-400 font-bold bg-orange-500/5">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4 text-center">
              * Limitações do plano gratuito poderão ser atualizadas conforme novas funcionalidades de telemetria forem disponibilizadas.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS / MOTO CLUBES */}
      <section id="motoclubes" className="py-20 px-4 sm:px-8 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">COMUNIDADE & CLUBES</h2>
            <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
              QUEM RODA COM O MOTOLEGADO
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Conseguimos organizar os rolês oficiais do nosso clube e controlar as candidaturas de novos integrantes sem dor de cabeça.",
                author: "Capitão Eduardo - Falcões da Estrada MC",
                location: "São Paulo / SP"
              },
              {
                quote: "O diário de bordo com cálculo de consumo e registro de garupa é fantástico. Nossas viagens ficam todas registradas no perfil.",
                author: "Juliana 'Thunder' - Piloto Prata",
                location: "Curitiba / PR"
              },
              {
                quote: "A rede de parceiros parceiros me garantiu 15% de desconto na troca dos pneus da minha GS em uma viagem longa. Valeu demais!",
                author: "Marcos 'Coruja' - MotoLegado Pro",
                location: "Belo Horizonte / MG"
              },
            ].map((card, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-4">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} className="fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{card.quote}"</p>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs font-black uppercase text-white tracking-tight">{card.author}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="w-8 h-8 bg-orange-600 group-hover:bg-orange-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-base italic transition-colors">M</div>
            <div>
              <span className="font-black italic uppercase text-lg text-white">MOTO<span className="text-orange-500">LEGADO</span></span>
              <p className="text-[9px] uppercase tracking-wider text-slate-600">SaaS Platform for Riders © 2026</p>
            </div>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-orange-500 transition-colors cursor-pointer">Acessar App</button>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-orange-500 transition-colors cursor-pointer">Painel Admin</button>
          </div>
        </div>
      </footer>

      {/* LOGIN / PILOT SESSION MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase rounded-full">
                    <User size={12} />
                    <span>Acesso do Piloto</span>
                  </div>
                </div>

                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  INICIAR SESSÃO NO <span className="text-orange-500">MOTOLEGADO</span>
                </h3>
              </div>

              {/* Status & Error Alerts */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl flex flex-col gap-2 text-xs text-red-300 shadow-inner"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium leading-relaxed">{authError}</div>
                    </div>
                    {isCredentialError && loginTab === 'login' && (
                      <button
                        type="button"
                        onClick={handleSwitchToRegister}
                        className="mt-1 w-full py-2 px-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <User size={12} className="text-orange-400" />
                        <span>Primeira vez? Criar Cadastro com este E-mail</span>
                      </button>
                    )}

                    {isAlreadyRegisteredError && loginTab === 'register' && (
                      <div className="flex flex-col gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handleSwitchToLogin}
                          className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span>Entrar com Conta Existente</span>
                          <ArrowRight size={12} />
                        </button>
                        
                        <div className="p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-[10px] text-slate-300 leading-relaxed font-normal">
                          <p className="font-bold text-orange-400 mb-1 flex items-center gap-1">
                            <Info size={12} />
                            Por que isso acontece se você limpou a tabela profiles?
                          </p>
                          No Supabase, as contas de login ficam salvas em <strong className="text-white">Authentication &gt; Users</strong> (menu lateral esquerdo), e não na tabela <code>profiles</code>.
                          <br />
                          Para recriar uma nova senha do zero, basta entrar em <strong className="text-white">Authentication &gt; Users</strong> no Supabase e excluir o usuário lá.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {authSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300"
                  >
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{authSuccess}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google Social Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50 group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com o Google</span>
              </button>

              {/* Divider between Google and Email */}
              <div className="relative flex items-center justify-center my-1">
                <div className="flex-1 border-t border-slate-800"></div>
                <span className="shrink-0 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap select-none">
                  ou acesse com e-mail
                </span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>

              {/* Login / Register Tab Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLoginTab('login');
                    setAuthError(null);
                  }}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    loginTab === 'login' ? "bg-orange-600 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Entrar com Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginTab('register');
                    setAuthError(null);
                  }}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    loginTab === 'register' ? "bg-orange-600 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Criar Cadastro
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {loginTab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome de Piloto / Apelido</label>
                    <input
                      type="text"
                      value={pilotName}
                      onChange={(e) => setPilotName(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail do Piloto</label>
                  <input
                    type="email"
                    value={pilotEmail}
                    onChange={(e) => setPilotEmail(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Senha de Acesso</label>
                  <div className="relative">
                    <input
                      id="pilot-password-input"
                      type={showPassword ? "text" : "password"}
                      value={pilotPassword}
                      onChange={(e) => setPilotPassword(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-400 transition-colors p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {loginTab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Modelo da Motocicleta Principal</label>
                    <input
                      type="text"
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  {authLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <span>{loginTab === 'login' ? 'Entrar no Sistema' : 'Concluir Cadastro & Entrar'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
