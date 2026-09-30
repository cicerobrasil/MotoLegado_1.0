import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, 
  Settings, 
  MapPin, 
  Bike, 
  ArrowRight, 
  X, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function FirstAccessSetupModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Não exibir na landing page pública nem se já estiver dentro da própria tela de configurações
    if (location.pathname === '/' || location.pathname === '/profile/settings') {
      setIsOpen(false);
      return;
    }

    // Só exibe se houver usuário autenticado
    if (!user && !profile) {
      return;
    }

    const userId = profile?.id || user?.id || profile?.email || 'pilot';
    const storageKey = `motolegado_first_access_popup_seen_${userId}`;
    const alreadySeen = localStorage.getItem(storageKey);

    // Se já viu anteriormente, não exibe novamente
    if (alreadySeen) {
      return;
    }

    // Verifica se é novo cadastro ou se o perfil está incompleto (sem moto ou sem cidade ou sem telefone)
    const isNewSignup = localStorage.getItem('motolegado_is_new_signup') === 'true';
    const isIncomplete = !profile?.motorcycle || !profile?.city || !profile?.phone;

    if (isNewSignup || isIncomplete) {
      // Pequeno timeout suave para dar tempo de carregar a tela inicial após login
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, user, profile]);

  const handleDismiss = () => {
    const userId = profile?.id || user?.id || profile?.email || 'pilot';
    localStorage.setItem(`motolegado_first_access_popup_seen_${userId}`, 'true');
    localStorage.removeItem('motolegado_is_new_signup');
    setIsOpen(false);
  };

  const handleGoToSettings = () => {
    handleDismiss();
    navigate('/profile/settings');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Efeitos de iluminação de fundo */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Botão Fechar no canto superior */}
            <button
              onClick={handleDismiss}
              aria-label="Fechar aviso"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-wider">
                <Sparkles size={12} />
                <span>Primeiro Acesso ao MotoLegado</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                Bem-vindo ao MotoLegado! 🏍️
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Olá, <strong className="text-white">{profile?.name || 'Piloto'}</strong>! Para liberar seu <strong>Passaporte Digital</strong>, telemetria de viagens e acesso aos Moto Clubes, vamos começar completando o seu perfil.
              </p>
            </div>

            {/* Benefícios de Configurar Agora */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Identidade & Apelido de Piloto</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Defina seu nome de estrada, foto e biografia oficial para o ranking e mural.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Bike size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Sua Motocicleta Principal</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Cadastre o modelo, ano e placa para telemetria no Diário de Bordo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Cidade & Ponto de Partida</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Configure sua base para cálculos automáticos de rotas e comboios.</p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGoToSettings}
                className="flex-1 py-3.5 px-4 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
              >
                <Settings size={15} />
                <span>Configurar Meu Perfil Agora</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Explorar Primeiro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
