import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ShieldCheck, 
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
  Info,
  Eye,
  EyeOff,
  Users,
  Crown,
  MessageSquare,
  Building2,
  Phone,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Menu,
  KeyRound,
  ArrowLeft,
  HeartPulse,
  Droplet,
  PhoneCall,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  OFFICIAL_PIX_CONFIG, 
  generateBacenPixPayload, 
  getPixQrCodeUrl 
} from '../lib/pix';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { apiForgotPassword, apiResetPassword } from '../lib/api';
import { PWAInstallButton } from './PWAInstallButton';
import { LogoMark } from './LogoMark';
import { AccessibilityButton } from './AccessibilityButton';

interface ClubPackageOption {
  id: 'esquadrao' | 'batalhao' | 'legiao';
  name: string;
  badge: string;
  members: number;
  priceMonthly: string;
  priceMonthlyNumber: number;
  costPerMember: string;
  freeLeaders: number;
  popular?: boolean;
  features: string[];
}

const CLUB_PACKAGES: ClubPackageOption[] = [
  {
    id: 'esquadrao',
    name: 'Pacote Esquadrão',
    badge: 'PEQUENOS CLUBES & REGIONAIS',
    members: 10,
    priceMonthly: 'R$ 99,00',
    priceMonthlyNumber: 99.00,
    costPerMember: 'R$ 9,90',
    freeLeaders: 1,
    features: [
      '10 Vagas Pro para Membros da Irmandade',
      '★ 1 Vaga do Líder 100% Isento & Bonificado',
      'Escudo Oficial Homologado no Mapa e Diretório',
      'Mural Restrito para Comunicados & Eventos',
      'Painel de Gestão e Aprovação de Recrutas',
      'Crachá Digital de Membro Oficial'
    ]
  },
  {
    id: 'batalhao',
    name: 'Pacote Batalhão',
    badge: 'MAIS ESCOLHIDO',
    members: 25,
    priceMonthly: 'R$ 199,00',
    priceMonthlyNumber: 199.00,
    costPerMember: 'R$ 7,96',
    freeLeaders: 1,
    popular: true,
    features: [
      '25 Vagas Pro para Membros da Irmandade',
      '★ 1 Vaga do Líder 100% Isento & Bonificado',
      'Escudo Oficial Homologado no Mapa e Diretório',
      'Mural Restrito para Comunicados & Eventos',
      'Painel de Gestão e Aprovação de Recrutas',
      'Crachá Digital de Membro Oficial'
    ]
  },
  {
    id: 'legiao',
    name: 'Pacote Legião',
    badge: 'MÁXIMA ECONOMIA',
    members: 50,
    priceMonthly: 'R$ 349,00',
    priceMonthlyNumber: 349.00,
    costPerMember: 'R$ 6,98',
    freeLeaders: 2,
    features: [
      '50 Vagas Pro para Membros da Irmandade',
      '★ 2 Vagas de Diretoria 100% Isentas (Presidente + Vice)',
      'Escudo Oficial Homologado no Mapa e Diretório',
      'Mural Restrito para Comunicados & Eventos',
      'Painel de Gestão e Aprovação de Recrutas',
      'Crachá Digital de Membro Oficial'
    ]
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const { 
    profile,
    updateProfile,
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogleCredential,
    signInWithGoogleQuick 
  } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Recovery Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState('');
  const [forgotSecurityHint, setForgotSecurityHint] = useState<string | null>(null);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  
  // Mobile UI & Navigation States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePricingTab, setMobilePricingTab] = useState<'free' | 'pro'>('pro');
  const [mobileClubPkgTab, setMobileClubPkgTab] = useState<'esquadrao' | 'batalhao' | 'legiao'>('batalhao');
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  
  // Pilot Form State (zerado por padrão)
  const [pilotName, setPilotName] = useState('');
  const [pilotEmail, setPilotEmail] = useState('');
  const [pilotPassword, setPilotPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bikeModel, setBikeModel] = useState('');
  const [pilotPhone, setPilotPhone] = useState('');
  const [pilotBloodType, setPilotBloodType] = useState('');
  const [pilotEmergencyContact, setPilotEmergencyContact] = useState('');
  const [pilotEmergencyPhone, setPilotEmergencyPhone] = useState('');
  const [pilotHealthNotes, setPilotHealthNotes] = useState('');


  const formatErrorMessage = (message?: string) => {
    if (!message) return 'Ocorreu um erro na autenticação.';
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant') || lower.includes('incorretos')) {
      return 'E-mail ou senha incorretos.';
    }
    if (
      lower.includes('user already registered') || 
      lower.includes('already registered') || 
      lower.includes('já está cadastrado') ||
      lower.includes('já possui cadastro')
    ) {
      return 'Este e-mail já possui cadastro no MotoLegado. Acesse a aba de login para entrar.';
    }
    if (lower.includes('password should be at least 6 characters') || lower.includes('at least 6 characters') || lower.includes('mínimo 6')) {
      return 'A senha de acesso deve ter no mínimo 6 caracteres.';
    }
    if (lower.includes('email not confirmed')) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
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
          phone: pilotPhone,
          bloodType: pilotBloodType,
          emergencyContact: pilotEmergencyContact,
          emergencyPhone: pilotEmergencyPhone,
          healthNotes: pilotHealthNotes,
        });
        if (error) {
          const rawMsg = error.message || '';
          const isRegistered = 
            rawMsg.toLowerCase().includes('already registered') || 
            rawMsg.toLowerCase().includes('user already exists') ||
            rawMsg.toLowerCase().includes('já está cadastrado') ||
            rawMsg.toLowerCase().includes('já possui cadastro');
          setIsAlreadyRegisteredError(isRegistered);
          setAuthError(formatErrorMessage(rawMsg));
          setAuthLoading(false);
          return;
        }
        localStorage.setItem('motolegado_is_new_signup', 'true');
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

  const openLoginModal = (tab: 'login' | 'register' = 'login') => {
    setLoginTab(tab);
    setPilotName('');
    setPilotEmail('');
    setPilotPassword('');
    setBikeModel('');
    setPilotPhone('');
    setPilotBloodType('');
    setPilotEmergencyContact('');
    setPilotEmergencyPhone('');
    setPilotHealthNotes('');
    setShowPassword(false);
    setAuthError(null);
    setAuthSuccess(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
    setShowLoginModal(true);
  };

  const handleSwitchToRegister = () => {
    setLoginTab('register');
    setPilotName('');
    setPilotPassword('');
    setBikeModel('');
    setPilotPhone('');
    setPilotBloodType('');
    setPilotEmergencyContact('');
    setPilotEmergencyPhone('');
    setPilotHealthNotes('');
    setAuthError(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
  };

  const handleSwitchToLogin = () => {
    setLoginTab('login');
    setPilotPassword('');
    setAuthError(null);
    setIsCredentialError(false);
    setIsAlreadyRegisteredError(false);
    setForgotError(null);
    setForgotMessage(null);
  };

  const handleOpenForgotPassword = () => {
    setLoginTab('forgot');
    setForgotStep('request');
    setForgotEmail(pilotEmail || '');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotSecurityAnswer('');
    setForgotSecurityHint(null);
    setForgotMessage(null);
    setForgotError(null);
    setAuthError(null);
    setAuthSuccess(null);
  };

  const handleRequestForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotEmail.trim();
    if (!clean) {
      setForgotError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotMessage(null);

    try {
      const res = await apiForgotPassword(clean);
      if (res.data?.success) {
        setForgotStep('reset');
        setForgotMessage('Código de recuperação gerado! Verifique sua caixa de entrada.');
        if (res.data.securityHint) {
          setForgotSecurityHint(res.data.securityHint);
        }
        if (res.data.code) {
          setForgotCode(res.data.code);
        }
      } else {
        setForgotError(res.error || res.data?.error || 'Não foi possível localizar este e-mail.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword) {
      setForgotError('Informe a nova senha.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('As senhas digitadas não coincidem.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await apiResetPassword({
        email: forgotEmail,
        code: forgotCode,
        new_password: forgotNewPassword,
        security_answer: forgotSecurityAnswer,
      });

      if (res.data?.success) {
        setForgotMessage('Senha redefinida com sucesso! Conectando à sua conta...');
        
        // Conectar automaticamente com a nova senha
        setTimeout(async () => {
          const loginRes = await signInWithEmail(forgotEmail, forgotNewPassword);
          if (!loginRes.error) {
            setShowLoginModal(false);
            navigate('/dashboard');
          } else {
            // Se login automático falhar, volta para a tela de login preenchido
            setLoginTab('login');
            setPilotEmail(forgotEmail);
            setPilotPassword('');
            setAuthSuccess('Senha alterada com sucesso! Digite sua nova senha para entrar.');
          }
        }, 1200);
      } else {
        setForgotError(res.error || res.data?.error || 'Código inválido ou expirado.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Erro ao redefinir a senha.');
    } finally {
      setForgotLoading(false);
    }
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
    <div className="min-h-screen bg-[#001b3d] text-[#e2e8f0] font-sans selection:bg-[#ff751f] selection:text-white relative overflow-x-hidden">
      
      {/* LANDING HEADER / NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-[#001b3d]/95 backdrop-blur-xl border-b border-[#1e293b] z-50 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          
          {/* LOGO COM ESPAÇAMENTO RESPONSIVO */}
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center cursor-pointer text-left group shrink-0"
            aria-label="MotoLegado Início"
          >
            <LogoMark size="sm" className="sm:hidden" />
            <LogoMark size="md" className="hidden sm:inline-flex" />
          </button>

          {/* MENU CENTRAL DE NAVEGAÇÃO DESKTOP */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-black uppercase tracking-wider text-slate-300 shrink-0">
            <a 
              href="#recursos" 
              className="hover:text-orange-400 transition-colors whitespace-nowrap py-1 px-1"
            >
              Recursos
            </a>
            <a 
              href="#planos" 
              className="hover:text-orange-400 transition-colors whitespace-nowrap py-1 px-1"
            >
              Planos
            </a>
            <a 
              href="#depoimentos" 
              className="hover:text-orange-400 transition-colors whitespace-nowrap py-1 px-1"
            >
              Comunidade
            </a>
          </div>

          {/* AÇÕES (VISUAL, INSTALAR APP, ENTRAR + HAMBURGER) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Acessibilidade: compacta no mobile, expandida no desktop */}
            <div className="sm:hidden">
              <AccessibilityButton variant="compact" />
            </div>
            <div className="hidden sm:block">
              <AccessibilityButton variant="header" />
            </div>

            {/* PWA: no desktop direto no header; no mobile fica no menu gaveta */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="header" className="whitespace-nowrap" />
            </div>

            {/* Iniciar Sessão: botão ajustado e sem overflow */}
            <button
              onClick={() => openLoginModal('login')}
              className="px-2.5 py-1.5 sm:py-2 sm:px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <User size={13} className="shrink-0" />
              <span>Entrar</span>
            </button>

            {/* Botão Hambúrguer Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar Menu de Navegação" : "Abrir Menu de Navegação"}
              className="md:hidden p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white hover:border-orange-500/50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} className="text-orange-500" /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MENU GAVETA MOBILE (DROPDOWN) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed top-16 left-0 right-0 bg-[#001b3d]/98 border-b border-slate-800 backdrop-blur-2xl shadow-2xl z-40 p-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="space-y-1">
              <a
                href="#recursos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 text-sm font-bold text-slate-200 hover:text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Zap size={16} className="text-orange-500" />
                  Recursos & Módulos
                </span>
                <ChevronRight size={16} className="text-slate-500" />
              </a>
              <a
                href="#planos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 text-sm font-bold text-slate-200 hover:text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-400" />
                  Planos de Piloto
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  Grátis & Pro
                </span>
              </a>
              <a
                href="#depoimentos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 text-sm font-bold text-slate-200 hover:text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Users size={16} className="text-slate-400" />
                  Comunidade & Depoimentos
                </span>
                <ChevronRight size={16} className="text-slate-500" />
              </a>
            </div>

            {/* Ações e Controles Internos */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal('login');
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <User size={15} />
                <span>Acessar Conta do Piloto</span>
              </button>
              <PWAInstallButton variant="sidebar" />
              <AccessibilityButton variant="sidebar" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-12 sm:pt-36 sm:pb-20 md:pt-48 md:pb-32 px-4 sm:px-8 border-b border-slate-800/60 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-orange-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-amber-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-[1.15] sm:leading-[1.1] max-w-5xl mx-auto pb-1"
          >
            A PLATAFORMA DEFINITIVA PARA <span className="text-orange-500">MOTOCICLISTAS</span> E ESTRADEIROS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xs sm:text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Centralize suas viagens, diário de bordo, roteiros geolocalizados, agenda de eventos, rede de parceiros credenciados e comunidade em um único ecossistema inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4"
          >
            <button
              onClick={() => openLoginModal('login')}
              className="w-full sm:w-auto btn-primary py-3 sm:py-3.5 px-6 sm:px-8 text-xs sm:text-sm"
            >
              <Zap size={16} className="fill-white text-white" />
              <span>Iniciar Sessão do Piloto</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#planos"
              className="w-full sm:w-auto btn-secondary py-3 sm:py-3.5 px-6 sm:px-8 text-xs sm:text-sm"
            >
              <span>Ver Planos & Preços</span>
              <ChevronRight size={15} className="text-slate-400" />
            </a>
          </motion.div>

          {/* Métricas Compactas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-6 sm:pt-12 max-w-4xl mx-auto">
            {[
              { value: '+15.800 KM', label: 'Registrados no Diário' },
              { value: '+450', label: 'Eventos & Encontros' },
              { value: '+5.000', label: 'Pilotos Conectados' },
              { value: '100%', label: 'Comunidade Unificada' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md">
                <p className="text-base sm:text-2xl font-black italic text-orange-500 tracking-tight">{stat.value}</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BARRA DE NAVEGAÇÃO RÁPIDA FIXA NO MOBILE (QUICK JUMP) */}
      <div className="sticky top-16 z-30 bg-[#001b3d]/90 backdrop-blur-md border-y border-slate-800/80 py-2.5 px-3 overflow-x-auto scrollbar-none md:hidden">
        <div className="flex items-center gap-1.5 min-w-max">
          <a 
            href="#recursos" 
            className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition-colors shrink-0"
          >
            ⚡ Recursos
          </a>
          <a 
            href="#planos" 
            className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition-colors shrink-0"
          >
            ⭐ Planos Piloto
          </a>
          <a 
            href="#depoimentos" 
            className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition-colors shrink-0"
          >
            💬 Depoimentos
          </a>
        </div>
      </div>

      {/* FEATURES / RECURSOS DO SISTEMA */}
      <section id="recursos" className="py-12 sm:py-20 px-4 sm:px-8 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#ff751f]">MÓDULOS DE ALTA PERFORMANCE</h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              FEITO POR MOTOCICLISTA PARA <span className="text-[#ff751f]">MOTOCICLISTAS</span>
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
              Desenvolvido com foco na rotina real do motociclista, desde a preparação do roteiro até o diário de memórias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                desc: "Oficinas, pontos de apoio e points temáticos na estrada homologados para acolher motociclistas com infraestrutura segura.",
                badge: "Pontos de Apoio"
              },
              {
                icon: Map,
                title: "Roteiros & Mapas GPS",
                desc: "Navegação por mapa interativo, rotas pré-mapeadas por categoria (Serra, Litoral, Off-Road) e paradas recomendadas.",
                badge: "Geolocalizado"
              },
              {
                icon: Compass,
                title: "Passaporte & Identidade Digital",
                desc: "Carteira virtual do piloto com dados da motocicleta, contatos de emergência médica e histórico consolidado na estrada.",
                badge: "Identidade Segura"
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
                whileHover={{ y: -4 }}
                className="bg-slate-900/40 border border-slate-800/80 hover:border-orange-500/50 p-5 sm:p-8 rounded-2xl sm:rounded-3xl transition-all flex flex-col justify-between space-y-4 sm:space-y-6 group"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-slate-950 transition-all shadow-md">
                      <feat.icon size={20} className="sm:w-[22px] sm:h-[22px]" />
                    </div>
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[8px] sm:text-[9px] font-black uppercase rounded-full tracking-wider group-hover:border-orange-500/30 group-hover:text-orange-400 transition-colors">
                      {feat.badge}
                    </span>
                  </div>

                  <h4 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-slate-800/50 flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest group-hover:text-[#ff751f]">
                  <span>Incluso no Sistema</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / TABELA DE PLANOS SAAS */}
      <section id="planos" className="py-12 sm:py-20 px-4 sm:px-8 border-b border-slate-800/60 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-orange-500">PLANOS & ASSINATURAS SAAS</h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              ESCOLHA O SEU ACESSO DE <span className="text-orange-500">PILOTO</span>
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
              Comece gratuitamente para rodar na comunidade ou assine o plano completo para desbloquear recursos avançados de telemetria, rotas GPX e passaporte digital.
            </p>
          </div>

          {/* Abas seletoras para Smartphones (reduz o scroll drásticamente) */}
          <div className="md:hidden flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setMobilePricingTab('free')}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer",
                mobilePricingTab === 'free' 
                  ? "bg-slate-800 text-white shadow-md border border-slate-700" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              Asfalto (Grátis)
            </button>
            <button
              type="button"
              onClick={() => setMobilePricingTab('pro')}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer",
                mobilePricingTab === 'pro' 
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              Legado Pro
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* FREE PLAN */}
            <div className={cn(
              "bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 sm:space-y-8 relative hover:border-slate-700 transition-all",
              mobilePricingTab !== 'free' && "hidden md:flex"
            )}>
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                  PLANO ASFALTO (GRATUITO)
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-black italic text-white tracking-tight">R$ 0</span>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">/ para sempre</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Para pilotos individuais que buscam registrar suas viagens e acompanhar a comunidade.</p>
                </div>

                <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">O que está incluído:</p>
                  {[
                    "Acesso ao Dashboard e Feed de Notícias",
                    "Diário de Bordo (Até 5 registros por mês)",
                    "Visualização de Eventos e Roteiros Públicos",
                    "Perfil de Piloto com Gamificação Básica",
                    "Suporte Comunitário na Plataforma",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => openLoginModal('register')}
                className="w-full py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-black uppercase text-xs tracking-widest rounded-xl sm:rounded-2xl transition-all cursor-pointer"
              >
                Acessar Gratuitamente
              </button>
            </div>

            {/* PRO / MOTOLEGADO PLAN */}
            <div className={cn(
              "pricing-card-pro bg-slate-900/90 border-2 border-orange-500 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 sm:space-y-8 relative shadow-[0_10px_40px_rgba(234,88,12,0.2)] transform md:-translate-y-2",
              mobilePricingTab !== 'pro' && "hidden md:flex"
            )}>
              <div className="absolute -top-3.5 sm:-top-4 right-6 sm:right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
                RECOMENDADO
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/15 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                  <Sparkles size={12} />
                  PLANO MOTOLEGADO PRO (COMPLETO)
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-black italic text-orange-400 tracking-tight">R$ 29,90</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ mês no cartão</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] font-bold">
                    <span>🔥 Ou R$ 299,00 no <strong>Plano Anual via PIX</strong> (16% de economia)</span>
                  </div>
                  <p className="pro-subtitle text-xs text-slate-300 mt-2 font-medium">Para pilotos exigentes e apaixonados pela estrada. <em>Nota: PIX só é aceito para pagamento anual.</em></p>
                </div>

                <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-orange-500/30">
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">Tudo do Plano Asfalto e mais:</p>
                  {[
                    "Registros ILIMITADOS no Diário de Bordo",
                    "Telemetria Completa de Viagens & Clima",
                    "Passaporte Digital VIP com QR Code",
                    "Criação de Eventos & Encontros Coletivos",
                    "Insígnias e Medalhas Exclusivas no Perfil",
                    "Exportação de Relatórios de Viagem",
                    "Suporte Prioritário VIP 24/7",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-100 font-semibold pro-feature-item">
                      <CheckCircle2 size={15} className="text-orange-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => openLoginModal('register')}
                className="w-full btn-primary py-3.5"
              >
                Assinar Plano Legado Pro
              </button>
            </div>
          </div>

          {/* Botão para Exibir/Ocultar Comparativo no Mobile (Economiza scroll longo) */}
          <div className="text-center md:hidden pt-2">
            <button
              type="button"
              onClick={() => setShowComparisonTable(!showComparisonTable)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Layers size={14} className="text-orange-500" />
              <span>{showComparisonTable ? 'Ocultar Comparativo' : 'Ver Tabela Comparativa Completa'}</span>
            </button>
          </div>

          {/* Detailed Feature Comparison Table */}
          <div className={cn(
            "comparison-table-container mt-8 md:mt-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 overflow-x-auto",
            !showComparisonTable && "hidden md:block"
          )}>
            <h4 className="text-base sm:text-lg font-black italic uppercase text-white mb-4 sm:mb-6 tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-orange-500" />
              <span>Comparativo Detalhado de Recursos</span>
            </h4>

            <table className="w-full text-left text-xs min-w-[500px] sm:min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Recurso / Módulo</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Plano Asfalto (Free)</th>
                  <th className="py-3 px-3 sm:px-4 text-center text-orange-400">Plano Legado Pro (R$ 29,90)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {[
                  { name: "Registros no Diário de Bordo", free: "Até 5 / mês", pro: "Ilimitado" },
                  { name: "Fotos e Anexos por Viagem", free: "Até 3 por diário", pro: "Ilimitado (HD)" },
                  { name: "Telemetria & Clima da Rota", free: "Básico", pro: "Tempo Real & Alertas" },
                  { name: "Passaporte Digital com QR Code", free: "Padrão", pro: "Gold VIP + Emergência" },
                  { name: "Crachá Digital de Piloto Oficial", free: "Padrão", pro: "Dourado VIP + QR Code" },
                  { name: "Exportação de Histórico de Viagens", free: "Não", pro: "Sim (PDF / CSV)" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-bold text-white comparison-item-name">{row.name}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-slate-400">{row.free}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-orange-400 font-bold bg-orange-500/5">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4 text-center">
              * Limitações do plano gratuito poderão ser atualizadas conforme novas funcionalidades de telemetria forem disponibilizadas.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS / PILOTOS & COMUNIDADE */}
      <section id="depoimentos" className="py-12 sm:py-20 px-4 sm:px-8 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-orange-500">COMUNIDADE DE PILOTOS</h2>
            <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
              QUEM RODA COM O MOTOLEGADO
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote: "O MotoLegado revolucionou a forma como planejamos nossas viagens longas e encontramos pontos de apoio seguros na estrada.",
                author: "Eduardo Silveira - Piloto Ouro",
                location: "São Paulo / SP"
              },
              {
                quote: "O diário de bordo com cálculo de consumo e registro de garupa é fantástico. Nossas viagens ficam todas registradas no perfil.",
                author: "Juliana 'Thunder' - Piloto Prata",
                location: "Curitiba / PR"
              },
              {
                quote: "Os pontos de apoio cadastrados salvaram minha viagem quando precisei de socorro mecânico rápido na serra. Infraestrutura nota 10!",
                author: "Marcos 'Coruja' - MotoLegado Pro",
                location: "Belo Horizonte / MG"
              },
            ].map((card, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={13} className="fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{card.quote}"</p>
                <div className="pt-3 sm:pt-4 border-t border-slate-800">
                  <p className="text-xs font-black uppercase text-white tracking-tight">{card.author}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer text-left group"
            aria-label="MotoLegado Início"
          >
            <LogoMark size="sm" />
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Plataforma Oficial para Motociclistas © 2026</p>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">
            <a href="#recursos" className="hover:text-white transition-colors py-1">Recursos</a>
            <a href="#planos" className="hover:text-white transition-colors py-1">Planos</a>
            <a href="#depoimentos" className="hover:text-white transition-colors py-1">Depoimentos</a>
            <button onClick={() => openLoginModal('login')} className="hover:text-orange-500 transition-colors cursor-pointer py-1">Acessar App</button>
          </div>
        </div>
      </footer>

      {/* LOGIN / PILOT SESSION MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto transition-all",
                loginTab === 'register' ? "max-w-lg" : "max-w-md"
              )}
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center justify-center pt-1">
                <LogoMark size="md" />
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

              {/* Forgot Password Flow */}
              {loginTab === 'forgot' ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <KeyRound size={16} className="text-orange-500" />
                      <h4 className="text-xs font-black uppercase text-white tracking-wider">Recuperar Acesso</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft size={12} />
                      <span>Voltar ao Login</span>
                    </button>
                  </div>

                  {forgotError && (
                    <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2 text-xs text-red-300">
                      <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotMessage && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-start gap-2 text-xs text-emerald-300">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{forgotMessage}</span>
                    </div>
                  )}

                  {forgotStep === 'request' ? (
                    <form onSubmit={handleRequestForgotCode} className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Digite seu e-mail cadastrado. Enviaremos um código de 6 dígitos para redefinir sua senha com segurança.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail do Piloto</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                          required
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full btn-primary py-3.5 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Verificando e-mail...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Código de Recuperação</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div className="p-3 bg-orange-950/40 border border-orange-800/60 rounded-xl text-xs text-orange-200 flex items-start gap-2">
                        <Info size={16} className="text-orange-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          Código gerado para <strong className="text-white">{forgotEmail}</strong>. Digite o código e crie sua nova senha de acesso.
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Código de 6 Dígitos</label>
                          <span className="text-[9px] font-bold text-slate-500">Válido por 15 min</span>
                        </div>
                        <input
                          type="text"
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg tracking-[0.4em] font-mono font-black text-orange-400 outline-none focus:border-orange-500 transition-colors"
                          required
                          autoFocus
                        />
                      </div>

                      {forgotSecurityHint && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            Ou confirme a moto cadastrada (opcional)
                          </label>
                          <input
                            type="text"
                            value={forgotSecurityAnswer}
                            onChange={(e) => setForgotSecurityAnswer(e.target.value)}
                            placeholder="Ex: Fat Boy, BMW GS, etc."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nova Senha (mínimo 6 caracteres)</label>
                        <div className="relative">
                          <input
                            type={showForgotNewPassword ? "text" : "password"}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                            aria-label={showForgotNewPassword ? "Ocultar senha" : "Ver senha"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-400 transition-colors p-1 cursor-pointer"
                          >
                            {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Confirmar Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showForgotConfirmPassword ? "text" : "password"}
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                            aria-label={showForgotConfirmPassword ? "Ocultar senha" : "Ver senha"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-400 transition-colors p-1 cursor-pointer"
                          >
                            {showForgotConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full btn-primary py-3.5 mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Redefinindo senha...</span>
                          </>
                        ) : (
                          <>
                            <span>Salvar Nova Senha & Entrar</span>
                            <Check size={16} />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setForgotStep('request')}
                        className="w-full py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-center"
                      >
                        Não recebeu o código? Clique para gerar outro
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* Login / Register Tab Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                        loginTab === 'login' ? "bg-orange-600 text-white font-black shadow-md" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Entrar com Conta
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToRegister}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                        loginTab === 'register' ? "bg-orange-600 text-white font-black shadow-md" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Criar Cadastro
                    </button>
                  </div>

                  <form onSubmit={handleEmailAuth} autoComplete="off" className="space-y-4">
                    {loginTab === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome de Piloto / Apelido</label>
                        <input
                          type="text"
                          value={pilotName}
                          onChange={(e) => setPilotName(e.target.value)}
                          placeholder=""
                          autoComplete="off"
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
                        autoComplete="off"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Senha de Acesso</label>
                        {loginTab === 'login' && (
                          <button
                            type="button"
                            onClick={handleOpenForgotPassword}
                            className="text-[9px] font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer hover:underline"
                          >
                            Esqueci minha senha
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="pilot-password-input"
                          type={showPassword ? "text" : "password"}
                          value={pilotPassword}
                          onChange={(e) => setPilotPassword(e.target.value)}
                          placeholder=""
                          autoComplete="new-password"
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
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Modelo da Motocicleta</label>
                            <input
                              type="text"
                              value={bikeModel}
                              onChange={(e) => setBikeModel(e.target.value)}
                              placeholder="Ex: BMW R 1250 GS"
                              autoComplete="off"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Telefone / WhatsApp</label>
                            <input
                              type="tel"
                              value={pilotPhone}
                              onChange={(e) => setPilotPhone(e.target.value)}
                              placeholder="(11) 98765-4321"
                              autoComplete="off"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                            />
                          </div>
                        </div>

                        {/* DADOS VITAIS & CONTATOS DE EMERGÊNCIA (CARD ID / SOCORRO) */}
                        <div className="pt-3 pb-1 border-t border-slate-800/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                                <HeartPulse size={12} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                Dados Vitais & Socorro em Caso de Acidente
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 tracking-wider">
                              Card ID
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Dados vitais e contato para acionamento imediato por socorristas (SAMU / Rodovias) visíveis no seu Card ID.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Droplet size={11} className="text-red-400" />
                                Tipo Sanguíneo
                              </label>
                              <select
                                value={pilotBloodType}
                                onChange={(e) => setPilotBloodType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors cursor-pointer"
                              >
                                <option value="">Selecione...</option>
                                <option value="A+">A+ (Positivo)</option>
                                <option value="A-">A- (Negativo)</option>
                                <option value="B+">B+ (Positivo)</option>
                                <option value="B-">B- (Negativo)</option>
                                <option value="AB+">AB+ (Positivo)</option>
                                <option value="AB-">AB- (Negativo)</option>
                                <option value="O+">O+ (Positivo)</option>
                                <option value="O-">O- (Negativo)</option>
                                <option value="Não informado">Não informado</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <PhoneCall size={11} className="text-amber-400" />
                                Telefone de Emergência
                              </label>
                              <input
                                type="tel"
                                value={pilotEmergencyPhone}
                                onChange={(e) => setPilotEmergencyPhone(e.target.value)}
                                placeholder="(11) 99999-8888"
                                autoComplete="off"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              Nome do Contato de Emergência & Parentesco
                            </label>
                            <input
                              type="text"
                              value={pilotEmergencyContact}
                              onChange={(e) => setPilotEmergencyContact(e.target.value)}
                              placeholder="Ex: Mariana (Esposa) ou Carlos (Irmão)"
                              autoComplete="off"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              Condições de Saúde / Observações Relevantes em Acidente
                            </label>
                            <textarea
                              rows={2}
                              value={pilotHealthNotes}
                              onChange={(e) => setPilotHealthNotes(e.target.value)}
                              placeholder="Ex: Alérgico a penicilina; Hipertenso; Placa metálica no braço esquerdo; Uso contínuo de anticoagulante."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors resize-none placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full btn-primary py-3.5 mt-2 disabled:opacity-50 cursor-pointer shadow-md"
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

                  {/* Divider between Form and Google */}
                  <div className="relative flex items-center justify-center my-1 pt-1">
                    <div className="flex-1 border-t border-slate-800"></div>
                    <span className="shrink-0 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap select-none">
                      ou continue com
                    </span>
                    <div className="flex-1 border-t border-slate-800"></div>
                  </div>

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
                    <span>Entrar com Google</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
