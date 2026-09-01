import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Map, 
  Calendar, 
  Store, 
  BookOpen, 
  Trophy, 
  Users, 
  Zap, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ChevronRight, 
  Lock, 
  User, 
  Check, 
  Sparkles,
  Compass,
  Star,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function LandingPage() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  
  // Pilot Form State
  const [pilotName, setPilotName] = useState('Piloto de Testes');
  const [pilotEmail, setPilotEmail] = useState('piloto@motolegado.com');
  const [pilotPassword, setPilotPassword] = useState('••••••••');
  const [bikeModel, setBikeModel] = useState('BMW R 1250 GS Adventure');

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('motolegado_demo_mode', 'false');
    localStorage.setItem('motolegado_pilot_name', pilotName || 'Piloto de Testes');
    setShowLoginModal(false);
    navigate('/dashboard');
  };

  const handleDemoAccess = () => {
    localStorage.setItem('motolegado_demo_mode', 'true');
    localStorage.setItem('motolegado_pilot_name', 'Piloto de Testes');
    setShowLoginModal(false);
    navigate('/dashboard');
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

          <div className="flex items-center gap-3 sm:gap-4">
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
            className="text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-none max-w-5xl mx-auto"
          >
            A PLATAFORMA DEFINITIVA PARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600">MOTOCICLISTAS</span> E MOTO CLUBES
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
                    "Diário de Bordo (Até 10 registros por mês)",
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
                  { name: "Registros no Diário de Bordo", free: "Até 10 / mês", pro: "Ilimitado" },
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
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase rounded-full">
                  <User size={12} />
                  <span>Acesso do Piloto</span>
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  INICIAR SESSÃO NO <span className="text-orange-500">MOTOLEGADO</span>
                </h3>
              </div>

              {/* Login / Register Tab Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLoginTab('login')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                    loginTab === 'login' ? "bg-orange-600 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Entrar com Conta
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('register')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                    loginTab === 'register' ? "bg-orange-600 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Criar Cadastro
                </button>
              </div>

              <form onSubmit={handleStartSession} className="space-y-4">
                {loginTab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome de Piloto / Apelido</label>
                    <input
                      type="text"
                      value={pilotName}
                      onChange={(e) => setPilotName(e.target.value)}
                      placeholder="Ex: Alex Rider"
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
                    placeholder="piloto@motolegado.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Senha de Acesso</label>
                  <input
                    type="password"
                    value={pilotPassword}
                    onChange={(e) => setPilotPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                {loginTab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Modelo da Motocicleta Principal</label>
                    <input
                      type="text"
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      placeholder="Ex: BMW R 1250 GS"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>{loginTab === 'login' ? 'Entrar no Sistema' : 'Concluir Cadastro & Entrar'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Demo Login Option */}
              <div className="pt-4 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ⚡ Entrar com Conta Demo de Teste (Piloto de Testes)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
