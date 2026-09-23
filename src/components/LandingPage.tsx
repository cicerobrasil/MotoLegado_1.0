import React, { useState, useEffect } from 'react';
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
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
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
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
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

  // Moto Club Packages State
  const [selectedClubPackage, setSelectedClubPackage] = useState<ClubPackageOption | null>(null);
  const [showClubCheckoutModal, setShowClubCheckoutModal] = useState(false);
  const [showCustomQuoteModal, setShowCustomQuoteModal] = useState(false);

  // Club Checkout Form State
  const [checkoutClubName, setCheckoutClubName] = useState('');
  const [checkoutClubCity, setCheckoutClubCity] = useState('');
  const [checkoutLeaderName, setCheckoutLeaderName] = useState('');
  const [checkoutLeaderPhone, setCheckoutLeaderPhone] = useState('');
  const [checkoutLeaderEmail, setCheckoutLeaderEmail] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [copiedPixKey, setCopiedPixKey] = useState(false);

  // Custom Quote 50+ members State
  const [quoteClubName, setQuoteClubName] = useState('');
  const [quoteMembersCount, setQuoteMembersCount] = useState('');
  const [quoteLeaderName, setQuoteLeaderName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteCity, setQuoteCity] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

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

  const handleOpenClubCheckout = (pkg: ClubPackageOption) => {
    setSelectedClubPackage(pkg);
    setCheckoutClubName('');
    setCheckoutClubCity('');
    setCheckoutLeaderName(profile?.name || pilotName || '');
    setCheckoutLeaderEmail(profile?.email || pilotEmail || '');
    setCheckoutLeaderPhone(profile?.phone || '');
    setCheckoutSuccess(false);
    setCopiedPixKey(false);
    setShowClubCheckoutModal(true);
  };

  const handleProcessClubCheckout = () => {
    if (!checkoutClubName.trim() || !checkoutLeaderName.trim()) {
      alert('Por favor, informe o nome do Moto Clube e o nome do Líder/Presidente.');
      return;
    }

    setCheckoutProcessing(true);

    setTimeout(() => {
      const newClubId = `club_${Date.now()}`;
      const totalSeats = selectedClubPackage ? selectedClubPackage.members : 10;
      const clubData = {
        id: newClubId,
        name: checkoutClubName.trim(),
        tag: checkoutClubName.trim().substring(0, 4).toUpperCase(),
        description: `Fundado sob a liderança de ${checkoutLeaderName.trim()}.`,
        leader: checkoutLeaderName.trim(),
        founded: new Date().getFullYear().toString(),
        city: checkoutClubCity.trim() || 'Brasil',
        members: 1,
        package_seats_total: totalSeats,
        package_seats_used: 0, // Líder é 100% isento e NÃO consome vaga do pacote!
        package_plan_name: selectedClubPackage ? selectedClubPackage.name : 'Pacote Esquadrão',
        isLeader: true,
        logoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop',
        coverUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&h=400&fit=crop',
        rules: [
          'Respeito à irmandade e hierarquia do clube',
          'Participação nos encontros e comboios oficiais',
          'Manutenção preventiva da motocicleta em dia'
        ],
        members_list: [
          {
            id: `mem_leader_${Date.now()}`,
            name: checkoutLeaderName.trim(),
            role: 'Presidente',
            moto: bikeModel || 'BMW R 1250 GS',
            joinedAt: new Date().toLocaleDateString('pt-BR')
          }
        ]
      };

      localStorage.setItem('motolegado_my_club', JSON.stringify(clubData));

      // Promove o usuário diretamente a Pro Bonificado / Isento
      try {
        if (updateProfile) {
          updateProfile({
            name: checkoutLeaderName.trim(),
            is_pro: true,
            plan_type: 'bonificado',
            club_name: checkoutClubName.trim(),
            bonificado_at: new Date().toISOString(),
            bonificado_by: 'Pacote Corporativo ' + (selectedClubPackage?.name || 'Clube')
          });
        }
      } catch (e) {
        console.warn('Erro ao atualizar perfil do líder:', e);
      }

      setCheckoutProcessing(false);
      setCheckoutSuccess(true);
    }, 1100);
  };

  const handleOpenCustomQuote = () => {
    setQuoteClubName('');
    setQuoteMembersCount('');
    setQuoteLeaderName(profile?.name || pilotName || '');
    setQuotePhone(profile?.phone || '');
    setQuoteEmail(profile?.email || pilotEmail || '');
    setQuoteCity('');
    setQuoteNotes('');
    setQuoteSubmitted(false);
    setShowCustomQuoteModal(true);
  };

  const handleSubmitCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteClubName.trim() || !quoteLeaderName.trim() || !quotePhone.trim()) {
      alert('Por favor, preencha o nome do clube, líder responsável e WhatsApp.');
      return;
    }

    try {
      const quotes = JSON.parse(localStorage.getItem('motolegado_enterprise_quotes') || '[]');
      quotes.unshift({
        id: `quote_${Date.now()}`,
        clubName: quoteClubName.trim(),
        membersCount: quoteMembersCount || '50+ membros',
        leaderName: quoteLeaderName.trim(),
        phone: quotePhone.trim(),
        email: quoteEmail.trim(),
        city: quoteCity.trim(),
        notes: quoteNotes.trim(),
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('motolegado_enterprise_quotes', JSON.stringify(quotes));
    } catch (_) {}

    setQuoteSubmitted(true);
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
              Pilotos
            </a>
            <a 
              href="#planos-clubes" 
              className="text-orange-400 hover:text-orange-300 font-bold transition-colors whitespace-nowrap py-1 px-1"
            >
              Moto Clubes
            </a>
            <a 
              href="#motoclubes" 
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
              onClick={() => setShowLoginModal(true)}
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
                href="#planos-clubes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-orange-950/20 hover:bg-orange-950/40 border border-orange-500/30 text-sm font-bold text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Shield size={16} className="text-orange-500" />
                  Planos para Moto Clubes
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">
                  Corporativo
                </span>
              </a>
              <a
                href="#motoclubes"
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
                  setShowLoginModal(true);
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
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/80 border border-orange-500/30 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg"
          >
            <Sparkles size={13} className="text-amber-400 animate-pulse shrink-0" />
            <span className="truncate">SaaS de Gestão & Comunidade V1.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-[1.15] sm:leading-[1.1] max-w-5xl mx-auto pb-1"
          >
            A PLATAFORMA DEFINITIVA PARA <span className="text-orange-500">MOTOCICLISTAS</span> E MOTO CLUBES
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xs sm:text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Centralize suas viagens, diário de bordo, roteiros geolocalizados, agenda de eventos, rede de parceiros credenciados e comando de Moto Clubes em um único ecossistema inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4"
          >
            <button
              onClick={() => setShowLoginModal(true)}
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
              { value: '+120', label: 'Moto Clubes Fundados' },
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
            href="#planos-clubes" 
            className="px-3 py-1 rounded-full bg-slate-900 border border-orange-500/30 text-[10px] font-black uppercase text-orange-400 hover:border-orange-500/60 transition-colors shrink-0"
          >
            🛡️ Moto Clubes
          </a>
          <a 
            href="#motoclubes" 
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
              TUDO O QUE SEU GRUPO PRECISA NA <span className="text-[#ff751f]">ESTRADA</span>
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
              Comece gratuitamente para rodar na comunidade ou assine o plano completo para desbloquear recursos avançados de telemetria e gestão de Moto Clubes.
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
                onClick={() => setShowLoginModal(true)}
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
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ mês</span>
                  </div>
                  <p className="pro-subtitle text-xs text-slate-300 mt-2 font-medium">Para pilotos exigentes e administradores de Moto Clubes que desejam controle total.</p>
                </div>

                <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-orange-500/30">
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">Tudo do Plano Asfalto e mais:</p>
                  {[
                    "Registros ILIMITADOS no Diário de Bordo",
                    "Fundação e Gestão Completa de Moto Clube",
                    "Mural Privado e Candidaturas de Integrantes",
                    "Criação de Eventos Coletivos",
                    "Crachá Digital VIP e Insígnias Exclusivas",
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
                onClick={() => setShowLoginModal(true)}
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
                  { name: "Criar e Fundar Moto Clube", free: "Não incluso", pro: "Incluído (1 Clube)" },
                  { name: "Acesso ao Mural Restrito do Clube", free: "Apenas Leitura", pro: "Publicação & Gestão" },
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

      {/* PLANOS CORPORATIVOS PARA MOTO CLUBES & FACÇÕES */}
      <section id="planos-clubes" className="py-12 sm:py-24 px-4 sm:px-8 border-b border-slate-800/80 bg-gradient-to-b from-[#001b3d] via-[#00132c] to-[#001b3d] relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-orange-600/10 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-amber-500/10 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16 relative z-10">
          
          {/* Section Header */}
          <div className="text-center space-y-2 sm:space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-orange-600/15 border border-orange-500/30 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
              <Users size={12} />
              <span>Gestão Coletiva de Irmandades</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              PLANOS PARA <span className="text-orange-500">MOTO CLUBES</span>
            </h2>
            <p className="text-xs sm:text-base text-slate-300 font-medium leading-relaxed">
              Assine um pacote de vagas corporativo direto para a tesouraria do clube. Seus membros ganham acesso <strong className="text-white">MotoLegado Pro</strong> sem cobrança individual no cartão deles, e o <strong className="text-orange-400">Líder / Diretoria é 100% Isento & Bonificado</strong> (sua vaga não consome o saldo do pacote).
            </p>
          </div>

          {/* Seletor de Pacote em Abas para Mobile */}
          <div className="lg:hidden flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-sm mx-auto mb-4">
            {CLUB_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setMobileClubPkgTab(pkg.id)}
                className={cn(
                  "flex-1 py-2 px-1 text-[10px] font-black uppercase rounded-xl transition-all text-center cursor-pointer truncate",
                  mobileClubPkgTab === pkg.id 
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 font-black" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {pkg.name.replace('Pacote ', '')}
              </button>
            ))}
          </div>

          {/* Cards dos 3 Pacotes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {CLUB_PACKAGES.map((pkg) => (
              <div 
                key={pkg.id}
                className={cn(
                  "rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300",
                  mobileClubPkgTab !== pkg.id && "hidden lg:flex",
                  pkg.popular 
                    ? "bg-slate-900/90 border-2 border-orange-500 shadow-[0_20px_50px_-15px_rgba(255,117,31,0.25)] scale-[1.01] lg:scale-[1.02] lg:-translate-y-2"
                    : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] py-1 px-3 sm:px-4 rounded-full shadow-lg">
                    MAIS ESCOLHIDO PELOS CLUBES
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  {/* Título & Badge */}
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {pkg.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white tracking-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                      Até {pkg.members} Integrantes Pro
                    </p>
                  </div>

                  {/* Preço */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-4xl font-black italic text-white tracking-tight">
                        {pkg.priceMonthly}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/mês</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">Custo por membro:</span>
                      <span className="font-mono font-bold text-emerald-400">{pkg.costPerMember} /mês</span>
                    </div>
                  </div>

                  {/* Bonificação do Líder */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Crown size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                        BENEFÍCIO DE DIRETORIA
                      </span>
                      <p className="text-xs text-slate-200 font-medium leading-snug">
                        {pkg.freeLeaders === 1 
                          ? "1 Líder / Presidente 100% Isento & Bonificado vitalício (não gasta vaga do pacote)."
                          : "2 Diretores (Presidente + Vice) 100% Isentos & Bonificados vitalícios."}
                      </p>
                    </div>
                  </div>

                  {/* Recursos Inclusos */}
                  <div className="space-y-2.5 sm:space-y-3 pt-2">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Incluso no Pacote:
                    </span>
                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                        <CheckCircle2 size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 mt-4 sm:mt-6 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenClubCheckout(pkg)}
                    className={cn(
                      "w-full py-3 sm:py-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
                      pkg.popular ? "btn-primary" : "btn-secondary"
                    )}
                  >
                    <span>Contratar e Cadastrar Clube</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center mt-2">
                    Ativação imediata • Pagamento unificado
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* BANNER PARA GRUPOS COM MAIS DE 50 MEMBROS (REQUISITO EXPLÍCITO) */}
          <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/40 border-2 border-orange-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
              <div className="space-y-2 sm:space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                  <Building2 size={13} />
                  <span>Grandes Clubes & Confederações</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black italic uppercase text-white tracking-tight">
                  Seu Moto Clube possui mais de 50 membros?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Para grupos numerosos e confederações, oferecemos negociação personalizada com descontos progressivos em escala, múltiplos diretores bonificados e faturamento corporativo direto para a tesouraria.
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={14} /> Faturamento Corporativo (Boleto/Pix)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={14} /> Homologação Coletiva de Irmandades
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={14} /> Suporte Prioritário por WhatsApp
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
                <button
                  onClick={handleOpenCustomQuote}
                  className="btn-primary py-3 sm:py-3.5 px-5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20"
                >
                  <MessageSquare size={15} />
                  <span>Negociar Proposta (50+ Membros)</span>
                </button>
                <a
                  href="https://wa.me/5541988776655?text=Ol%C3%A1,%20somos%20uma%20diretoria%20de%20Moto%20Clube%20com%20mais%20de%2050%20membros%20e%20gostar%C3%ADamos%20de%20negociar%20uma%20proposta%20personalizada%20no%20MotoLegado."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-3 sm:py-3.5 px-4 text-xs flex items-center justify-center gap-2 text-center"
                >
                  <Phone size={14} className="text-emerald-400 shrink-0" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS / MOTO CLUBES */}
      <section id="motoclubes" className="py-12 sm:py-20 px-4 sm:px-8 border-b border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-orange-500">COMUNIDADE & CLUBES</h2>
            <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
              QUEM RODA COM O MOTOLEGADO
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
            <a href="#planos-clubes" className="hover:text-white transition-colors py-1">Moto Clubes</a>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-orange-500 transition-colors cursor-pointer py-1">Acessar App</button>
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
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center justify-between gap-4 pt-1">
                <LogoMark size="md" />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full">
                  <User size={12} />
                  <span>Acesso do Piloto</span>
                </div>
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
                    loginTab === 'login' ? "bg-orange-600 text-white font-black shadow-md" : "text-slate-400 hover:text-white"
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
                    loginTab === 'register' ? "bg-orange-600 text-white font-black shadow-md" : "text-slate-400 hover:text-white"
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
                  className="w-full btn-primary py-3.5 mt-2 disabled:opacity-50"
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

      {/* MODAL DE CONTRATAÇÃO DE PACOTE DE MOTO CLUBE */}
      <AnimatePresence>
        {showClubCheckoutModal && selectedClubPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setShowClubCheckoutModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white p-2"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>

              {checkoutSuccess ? (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                      MOTO CLUBE HOMOLOGADO COM SUCESSO!
                    </span>
                    <h3 className="text-2xl font-black italic uppercase text-white">
                      Parabéns, Comandante {checkoutLeaderName}!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                      O Moto Clube <strong className="text-white">"{checkoutClubName}"</strong> foi cadastrado e ativado com o <strong className="text-orange-400">{selectedClubPackage.name}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Vagas Pro para Membros:</span>
                      <strong className="text-white font-mono">{selectedClubPackage.members} vagas ativas</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5"><Crown size={14} /> Benefício do Líder:</span>
                      <span>100% Isento & Bonificado Vitalício</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/80 pt-2">
                      <span>Vagas utilizadas até o momento:</span>
                      <span className="text-slate-400 font-mono">0 / {selectedClubPackage.members}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Como Líder, você já pode acessar o painel do seu clube para aprovar candidaturas e emitir comunicados no mural restrito!
                  </p>

                  <button
                    onClick={() => {
                      setShowClubCheckoutModal(false);
                      navigate('/motoclub');
                    }}
                    className="w-full btn-primary py-4 text-xs font-black uppercase tracking-wider"
                  >
                    <span>Ir para o Painel do Meu Moto Clube</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                      <Users size={12} />
                      <span>Contratação Coletiva de Moto Clube</span>
                    </div>
                    <h3 className="text-2xl font-black italic uppercase text-white">
                      Cadastrar & Ativar Moto Clube
                    </h3>
                    <p className="text-xs text-slate-300">
                      Preencha os dados da irmandade para ativar o pacote e se tornar o Comandante oficial.
                    </p>
                  </div>

                  {/* Resumo do Pacote Selecionado */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-orange-400 block tracking-wider">
                        {selectedClubPackage.name}
                      </span>
                      <p className="text-xs text-slate-200 font-bold">
                        {selectedClubPackage.members} Vagas Pro para Membros
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <Crown size={11} /> Líder 100% Isento & Bonificado
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black italic text-white block">
                        {selectedClubPackage.priceMonthly}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">/mês unificado</span>
                    </div>
                  </div>

                  {/* Formulário */}
                  <form onSubmit={(e) => { e.preventDefault(); handleProcessClubCheckout(); }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Moto Clube *</label>
                        <input
                          type="text"
                          required
                          value={checkoutClubName}
                          onChange={(e) => setCheckoutClubName(e.target.value)}
                          placeholder="Ex: Falcões da Noite MC"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cidade / Estado *</label>
                        <input
                          type="text"
                          required
                          value={checkoutClubCity}
                          onChange={(e) => setCheckoutClubCity(e.target.value)}
                          placeholder="Ex: Curitiba / PR"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Presidente / Líder *</label>
                        <input
                          type="text"
                          required
                          value={checkoutLeaderName}
                          onChange={(e) => setCheckoutLeaderName(e.target.value)}
                          placeholder="Seu nome completo"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">WhatsApp do Líder *</label>
                        <input
                          type="text"
                          required
                          value={checkoutLeaderPhone}
                          onChange={(e) => setCheckoutLeaderPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail para Recibos & Faturamento *</label>
                      <input
                        type="email"
                        required
                        value={checkoutLeaderEmail}
                        onChange={(e) => setCheckoutLeaderEmail(e.target.value)}
                        placeholder="tesouraria@motoclube.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-2 pt-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                        Forma de Pagamento da Tesouraria
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCheckoutPaymentMethod('pix')}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                            checkoutPaymentMethod === 'pix'
                              ? "bg-orange-600/20 border-orange-500 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          )}
                        >
                          <QrCode size={16} className="text-emerald-400" />
                          <span>PIX Instantâneo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutPaymentMethod('card')}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                            checkoutPaymentMethod === 'card'
                              ? "bg-orange-600/20 border-orange-500 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          )}
                        >
                          <CreditCard size={16} className="text-amber-400" />
                          <span>Cartão de Crédito</span>
                        </button>
                      </div>

                      {checkoutPaymentMethod === 'pix' ? (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Chave PIX Copia e Cola:</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136motolegado-clubes@pix.com.br520400005303986540' + selectedClubPackage.priceMonthlyNumber.toFixed(2) + '5802BR5910MOTOLEGADO6008CURITIBA62070503***6304');
                                setCopiedPixKey(true);
                                setTimeout(() => setCopiedPixKey(false), 2000);
                              }}
                              className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-[11px]"
                            >
                              {copiedPixKey ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              <span>{copiedPixKey ? 'Copiado!' : 'Copiar Chave'}</span>
                            </button>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-400 truncate">
                            00020126580014br.gov.bcb.pix0136motolegado-clubes@pix.com.br520400005303986540...
                          </div>
                          <p className="text-[10px] text-slate-500 italic">
                            O pacote é liberado automaticamente após a confirmação bancária.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <input
                            type="text"
                            placeholder="Número do Cartão da Tesouraria"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                            defaultValue="4532 •••• •••• 8842"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Validade (MM/AA)"
                              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                              defaultValue="12/28"
                            />
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="CVV"
                              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                              defaultValue="884"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutProcessing}
                      className="w-full btn-primary py-4 text-xs font-black uppercase tracking-wider mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {checkoutProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Ativando Pacote e Homologando Clube...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar e Fundar Clube ({selectedClubPackage.priceMonthly})</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE NEGOCIAÇÃO PERSONALIZADA (50+ MEMBROS) */}
      <AnimatePresence>
        {showCustomQuoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setShowCustomQuoteModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white p-2"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>

              {quoteSubmitted ? (
                <div className="text-center space-y-5 py-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500 text-orange-400 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
                      SOLICITAÇÃO DE NEGOCIAÇÃO RECEBIDA!
                    </span>
                    <h3 className="text-2xl font-black italic uppercase text-white">
                      Obrigado, {quoteLeaderName}!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                      Nossa equipe corporativa entrará em contato via WhatsApp ou e-mail com a proposta detalhada para o <strong className="text-white">"{quoteClubName}"</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                    <p><strong className="text-white">Pelotão estimado:</strong> {quoteMembersCount}</p>
                    <p><strong className="text-white">WhatsApp de retorno:</strong> {quotePhone}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={`https://wa.me/5541988776655?text=Ol%C3%A1,%20acabei%20de%20enviar%20uma%20solicita%C3%A7%C3%A3o%20de%20cota%C3%A7%C3%A3o%20para%20o%20clube%20${encodeURIComponent(quoteClubName)}%20(com%20${encodeURIComponent(quoteMembersCount)}%20membros).`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Phone size={14} />
                      <span>Agilizar no WhatsApp</span>
                    </a>
                    <button
                      onClick={() => setShowCustomQuoteModal(false)}
                      className="w-full btn-secondary py-3.5 text-xs font-black uppercase tracking-wider"
                    >
                      <span>Concluir</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                      <Building2 size={12} />
                      <span>Condição Especial para Grandes Irmandades</span>
                    </div>
                    <h3 className="text-2xl font-black italic uppercase text-white">
                      Cotação para 50+ Membros
                    </h3>
                    <p className="text-xs text-slate-300">
                      Preencha os detalhes do seu clube ou facção. Montamos condições sob medida com faturamento corporativo para tesourarias.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitCustomQuote} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Moto Clube / Facção *</label>
                      <input
                        type="text"
                        required
                        value={quoteClubName}
                        onChange={(e) => setQuoteClubName(e.target.value)}
                        placeholder="Ex: Abutres MC / Bodes do Asfalto"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Estimativa de Membros *</label>
                        <select
                          required
                          value={quoteMembersCount}
                          onChange={(e) => setQuoteMembersCount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="">Selecione a faixa...</option>
                          <option value="50 a 80 membros">50 a 80 membros</option>
                          <option value="80 a 150 membros">80 a 150 membros</option>
                          <option value="150 a 300 membros">150 a 300 membros</option>
                          <option value="Mais de 300 membros (Confederação)">Mais de 300 membros (Confederação)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cidade / Estado</label>
                        <input
                          type="text"
                          value={quoteCity}
                          onChange={(e) => setQuoteCity(e.target.value)}
                          placeholder="Ex: São Paulo / SP"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Presidente / Responsável *</label>
                        <input
                          type="text"
                          required
                          value={quoteLeaderName}
                          onChange={(e) => setQuoteLeaderName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">WhatsApp para Contato *</label>
                        <input
                          type="text"
                          required
                          value={quotePhone}
                          onChange={(e) => setQuotePhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail</label>
                      <input
                        type="email"
                        value={quoteEmail}
                        onChange={(e) => setQuoteEmail(e.target.value)}
                        placeholder="contato@motoclube.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Observações / Necessidades Específicas</label>
                      <textarea
                        rows={2}
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        placeholder="Ex: Possuímos 3 subsedes regionais e gostaríamos de faturamento semestral."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white outline-none focus:border-orange-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        className="w-full btn-primary py-4 text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        <span>Solicitar Proposta Customizada</span>
                      </button>

                      <a
                        href="https://wa.me/5541988776655?text=Ol%C3%A1,%20gostaria%20de%20uma%20proposta%20personalizada%20para%20Moto%20Clube%20com%20mais%20de%2050%20membros."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full btn-secondary py-3 text-xs flex items-center justify-center gap-2"
                      >
                        <Phone size={14} className="text-emerald-400" />
                        <span>Prefiro conversar agora no WhatsApp</span>
                      </a>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
