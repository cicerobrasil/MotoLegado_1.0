import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Settings, Plus, QrCode, Route, Zap, Award, FileText, Lock, CheckCircle2, ShieldCheck, BookOpen, Sparkles, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { calculatePilotRank, PILOT_RANKS } from '../lib/gamification';
import { LogEntry } from './Logbook';
import { MotoEvent } from './Events';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function ProfileDashboard() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [achievementFilter, setAchievementFilter] = useState<'todas' | 'desbloqueadas' | 'bloqueadas'>('todas');
  const [showRankHierarchyModal, setShowRankHierarchyModal] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<MotoEvent[]>([]);

  const pilotName = profile?.name || 'Piloto MotoLegado';
  const pilotMotorcycle = profile?.motorcycle || 'Motocicleta Principal';
  const pilotClub = profile?.club_name || localStorage.getItem('motolegado_pilot_club') || 'Piloto Independente';
  const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;

  useEffect(() => {
    // 1. Carregar diários de bordo reais do Supabase se logado
    if (isSupabaseConfigured && user) {
      supabase
        .from('logbook_trips')
        .select('*')
        .eq('pilot_id', user.id)
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mappedLogs: LogEntry[] = data.map((t: any) => ({
              id: t.id,
              date: t.date || new Date().toISOString().split('T')[0],
              title: t.title || 'Viagem Registrada',
              distance: String(t.distance_km || 0),
              bike: t.bike_model || pilotMotorcycle,
              origin: t.origin || 'Origem',
              destination: t.destination || 'Destino',
              duration: '2h 30min',
              climate: 'sun',
              road: 'Tapete (Perfeita)',
              content: t.notes || '',
              rating: t.rating || 5,
              image: t.photos?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'
            }));
            setLogs(mappedLogs);
          } else {
            setLogs([]);
          }
        });
    } else {
      const savedLogs = localStorage.getItem('motolegado_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error(e);
        }
      } else {
        setLogs([]);
      }
    }

    // Load events
    const savedEvents = localStorage.getItem('motolegado_events');
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        const cleaned = parsed.map((evt: any) => ({
          ...evt,
          checkedIn: !!evt.checkedIn
        }));
        setEvents(cleaned);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user, isSupabaseConfigured]);

  const loggedKm = logs.reduce((acc, curr) => {
    const val = parseInt(curr.distance, 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalKm = loggedKm;
  const checkedInEvents = events.filter(e => e.checkedIn);

  const achievements = [
    { id: '1', icon: "🌎", title: "Viagem Internacional", desc: "Expedição cruzando fronteiras internacionais", points: 500, unlocked: (totalKm >= 5000 && logs.length > 0), date: (totalKm >= 5000 && logs.length > 0) ? "Desbloqueado" : undefined, requirement: "Registrar 5.000km em viagens", category: "Expedição" },
    { id: '2', icon: "🛣️", title: "Viagem Interestadual", desc: "Pilotagem cruzando divisas estaduais", points: 250, unlocked: logs.length >= 2, date: logs.length >= 2 ? "Desbloqueado" : undefined, requirement: "Registrar pelo menos 2 viagens no diário", category: "Navegação" },
    { id: '3', icon: "🏔️", title: "Alfa da Montanha", desc: "1.000km em trechos de altitude acumulada", points: 250, unlocked: (totalKm >= 1000 && logs.length > 0), date: (totalKm >= 1000 && logs.length > 0) ? "Desbloqueado" : undefined, requirement: "Acumular 1.000km rodados", category: "Desafio" },
    { id: '4', icon: "🏎️", title: "Primeiro Roteiro", desc: "Primeira viagem de moto gravada no diário de bordo", points: 100, unlocked: logs.length >= 1, date: logs.length >= 1 ? "Desbloqueado" : undefined, requirement: "Registrar 1ª viagem no diário", category: "Iniciação" },
    { id: '5', icon: "🤝", title: "Irmão de Estrada", desc: "Prestou suporte e ajudou motociclistas", points: 500, unlocked: false, requirement: "Ajudar motociclistas em emergências", category: "Comunidade" },
    { id: '6', icon: "🌃", title: "Coruja Noturna", desc: "500km rodados em pilotagem noturna contínua", points: 200, unlocked: false, requirement: "Registrar viagens noturnas", category: "Especial" },
    { id: '7', icon: "⛽", title: "Econômico", desc: "Média superior a 30km/L em viagem oficial", points: 150, unlocked: false, requirement: "Registrar média de consumo", category: "Eficiência" },
    { id: '8', icon: "🏕️", title: "Acampamento Motociclista", desc: "Pernoite em evento ou área de camping oficial", points: 300, unlocked: false, requirement: "Registrar 1 pernoite em evento oficial", category: "Estilo de Vida" }
  ];

  const earnedAchievementPoints = achievements.filter(a => a.unlocked).reduce((acc, curr) => acc + curr.points, 0);
  const checkInPoints = checkedInEvents.length * 50;
  const calculatedRealPoints = earnedAchievementPoints + checkInPoints;

  // Pontuação real calculada do piloto
  const totalPointsEarned = calculatedRealPoints;

  // Pilot Rank & Gamification Calculation
  const rankInfo = calculatePilotRank(totalPointsEarned);
  const { currentTier, nextTier, progressPercent, pointsRemaining } = rankInfo;

  const mainStats = [
    { label: 'DISTÂNCIA TOTAL', value: totalKm.toLocaleString(), unit: 'KM', icon: Route, color: 'text-orange-500' },
    { label: 'DIÁRIO DE BORDO', value: logs.length.toString(), unit: 'REGISTROS', icon: BookOpen, color: 'text-amber-400' },
    { label: 'EVENTOS CHECK-IN', value: checkedInEvents.length.toString(), unit: 'CONFIRMADOS', icon: Calendar, color: 'text-blue-500' },
    { label: 'PATENTE / NÍVEL', value: `${currentTier.icon} ${currentTier.title}`, unit: `${totalPointsEarned} PTS`, icon: Award, color: 'text-purple-400' },
  ];

  // Garagem do piloto (usa a moto cadastrada no perfil)
  const garage = [
    { 
      year: 'Atual', 
      model: pilotMotorcycle, 
      image: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=400' 
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPossiblePoints = achievements.reduce((acc, curr) => acc + curr.points, 0);

  // Histórico mensal de consumo de asfalto (baseado nos registros reais de viagens)
  const chartData = [
    { month: 'JAN', value: logs.length > 0 ? Math.round(totalKm * 0.2) : 0 },
    { month: 'FEV', value: logs.length > 0 ? Math.round(totalKm * 0.3) : 0 },
    { month: 'MAR', value: logs.length > 0 ? Math.round(totalKm * 0.5) : 0, active: logs.length > 0 },
    { month: 'ABR', value: 0 },
    { month: 'MAI', value: 0 },
    { month: 'JUN', value: 0 },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-12 bg-slate-950 min-h-screen">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">MEU <span className="text-orange-500">PERFIL</span></h1>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             Status e Performance do Piloto em Tempo Real
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 group hover:border-orange-500/50 transition-all">
            <FileText size={16} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">PDF</span>
          </button>
          <button 
            onClick={() => navigate('/profile/settings')}
            className="flex-1 md:flex-none px-4 sm:px-6 py-2.5 sm:py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 group hover:border-orange-500/50 transition-all active:scale-95"
          >
            <Settings size={16} className="text-slate-500 group-hover:text-orange-500 transition-colors" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">CONFIGURAÇÕES</span>
          </button>
          <button 
            onClick={() => navigate('/logbook')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-orange-600 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95"
          >
            <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest">DIÁRIO DE BORDO</span>
          </button>
        </div>
      </div>

      {/* PLAN STATUS BANNER */}
      {profile?.plan_type === 'bonificado' ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-amber-950/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="text-amber-400" size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  ⭐ MODO BONIFICADO ATIVO
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest">
                  VIP SEM CUSTO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Seu acesso completo ao <strong>Plano Pro</strong> foi bonificado pela Diretoria MotoLegado. Você desfruta de todos os recursos pagos (Diário ilimitado, gestão de Moto Clubes, telemetria e descontos) sem nenhuma cobrança.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest shrink-0">
            <Crown size={14} className="text-amber-400" />
            <span>Acesso Pro 100% Liberado</span>
          </div>
        </motion.div>
      ) : (profile?.plan_type === 'pago' || profile?.is_pro) ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-950/40 via-slate-900/80 to-slate-950 border border-orange-500/40 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-orange-950/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
              <Zap className="text-orange-400" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  🔥 PLANO MOTOLEGADO PRO ATIVO
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-widest">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Sua assinatura Pro está ativa com todos os recursos de telemetria, viagens ilimitadas e gestão completa de sedes e clubes.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-slate-400" size={20} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                  🟢 PLANO ASFALTO (MODO GRATUITO)
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acesso comunitário padrão. Pilotos associados ou membros de moto clubes parceiros podem receber o <strong>Modo Bonificado</strong> da Administração.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2.5">
              Itens liberados no Modo Gratuito:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                "Acesso ao Dashboard e Feed de Notícias",
                "Diário de Bordo (Até 5 registros por mês)",
                "Visualização de Eventos e Roteiros Públicos",
                "Perfil de Piloto com Gamificação Básica",
                "Suporte Comunitário na Plataforma"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 1. TOP ROW STATS (High Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {mainStats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 relative overflow-hidden group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-slate-800/20 rounded-full w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform">
               <stat.icon size={24} className={cn("opacity-20", stat.color)} />
            </div>
            <div className="relative">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter italic">{stat.value}</span>
                <span className={cn("text-[11px] font-black uppercase tracking-widest", stat.color)}>{stat.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. COMMAND CENTER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: PILOT LEVEL (33%) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 bg-slate-900/40 border border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 flex flex-col justify-between space-y-6 sm:space-y-8"
        >
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-black text-white italic uppercase tracking-tighter">
                NÍVEL & PATENTE DO PILOTO
              </h3>
              <span className={cn("px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5", currentTier.badgeStyle)}>
                <span>{currentTier.icon}</span> {currentTier.title}
              </span>
            </div>
            
            {/* XP Level Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">PATENTE ATIVA</p>
                  <p className="text-base sm:text-lg font-black text-white italic uppercase">{currentTier.title} <span className="text-amber-500 text-xs sm:text-sm">/ {currentTier.subtitle}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">NÍVEL {currentTier.level}</p>
                  <p className="text-lg sm:text-xl font-black text-amber-400 italic">{totalPointsEarned} <span className="text-xs text-slate-500 font-normal">/ {currentTier.maxPoints} PTS</span></p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                  />
                </div>
                <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>{progressPercent}% Progresso no Nível</span>
                  {nextTier ? (
                    <span className="text-amber-400/90 font-black">Faltam {pointsRemaining} PTS para {nextTier.title}</span>
                  ) : (
                    <span className="text-emerald-400 font-black">Nível Máximo Alcançado!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy Breakdown Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]">SISTEMA DE HIERARQUIA DE PATENTES</p>
              <button 
                onClick={() => setShowRankHierarchyModal(!showRankHierarchyModal)}
                className="text-[9px] sm:text-[10px] font-black text-amber-400 hover:underline uppercase italic flex items-center gap-1"
              >
                {showRankHierarchyModal ? "Ocultar" : "Ver Todas"}
              </button>
            </div>

            <div className="space-y-2">
              {PILOT_RANKS.map((rank) => {
                const isCurrent = currentTier.level === rank.level;
                const isAchieved = totalPointsEarned >= rank.minPoints;

                return (
                  <div 
                    key={rank.level} 
                    className={cn(
                      "p-3 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between gap-2 sm:gap-3",
                      isCurrent
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5"
                        : isAchieved
                        ? "bg-slate-950/40 border-slate-800/80 text-slate-300"
                        : "bg-slate-950/20 border-slate-900 text-slate-600 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-lg sm:text-xl">{rank.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <p className={cn("text-xs font-black uppercase italic", isCurrent ? "text-amber-400" : isAchieved ? "text-white" : "text-slate-500")}>
                            {rank.title}
                          </p>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[7px] sm:text-[8px] font-black uppercase tracking-wider rounded-full">
                              Sua Patente
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold">{rank.subtitle} • {rank.minPoints} a {rank.maxPoints >= 20000 ? '10.000+' : rank.maxPoints} PTS</p>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                          <Zap size={11} />
                        </span>
                      ) : isAchieved ? (
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 size={11} />
                        </span>
                      ) : (
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                          <Lock size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Col: CHART (66%) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-7 bg-slate-900/40 border border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-2xl font-black text-white italic uppercase tracking-tighter">CONSUMO DE ASFALTO <span className="text-slate-600">(KM MENSAL)</span></h3>
            <div className="flex items-center gap-2 sm:gap-4">
               {['JAN', 'FEV', 'MAR'].map(m => (
                 <span key={m} className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", m === 'FEV' ? 'text-orange-500' : 'text-slate-600')}>{m}</span>
               ))}
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 pb-4 min-h-[220px]">
            {chartData.map((data, i) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-4 sm:gap-6">
                <div className="relative w-full group flex justify-center items-end h-[180px]">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.value / 800) * 160}px` }}
                    transition={{ delay: 0.8 + (i * 0.1), duration: 0.8 }}
                    className={cn(
                      "w-full rounded-xl sm:rounded-2xl transition-all duration-500 max-w-[40px]",
                      data.active 
                        ? "bg-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.3)]" 
                        : "bg-slate-800 group-hover:bg-slate-700"
                    )}
                  />
                  {data.value > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       <span className="text-[9px] font-black text-white">{data.value} KM</span>
                    </div>
                  )}
                </div>
                <span className={cn("text-[9px] sm:text-[10px] font-black tracking-widest", data.active ? 'text-white' : 'text-slate-600')}>
                  {data.month}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 3. IDENTITY AND SETTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Digital Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="relative min-h-[240px] sm:aspect-[2.2/1] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] -mr-32 -mt-32" />
          <div className="relative h-full flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-orange-500 p-0.5 shrink-0 overflow-hidden bg-slate-900">
                    <img src={pilotAvatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-0.5">ID DIGITAL V.1</p>
                    <p className="text-[10px] sm:text-[11px] font-black text-white italic tracking-tighter">#77892-XP</p>
                  </div>
               </div>
               <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                  <QrCode size={28} className="text-black" />
               </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-orange-500 font-bold">{currentTier.icon}</span>
                <p className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{currentTier.title} • {currentTier.subtitle}</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{pilotName}</h2>
               <div className="flex items-center gap-6 sm:gap-12 mt-4 sm:mt-6">
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">CLUBE ATUAL</p>
                    <p className="text-[9px] sm:text-[10px] font-black text-white uppercase italic truncate">{pilotClub}</p>
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">PATENTE MOTOLEGADO</p>
                    <p className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase italic flex items-center gap-1">
                      <span>{currentTier.icon}</span> {currentTier.title}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Pilot Identity Quick Actions & Verification */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-900/40 border border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">AUTENTICAÇÃO & ID DIGITAL</span>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} /> ID VERIFICADO
              </span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-black text-white italic uppercase tracking-tighter mb-2">
              PASSAPORTE DE PILOTO MOTOLEGADO
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Seu ID Digital é utilizado para credenciamento em encontros oficiais, validação de passaporte em sedes de Moto Clubes e descontos em parceiros.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/profile/settings')}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-black text-white italic uppercase group-hover:text-amber-400 transition-colors">EDITAR PERFIL</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Moto, Fotos & Dados</p>
              </div>
              <Settings size={18} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link do Passaporte de Piloto copiado!');
                }
              }}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-black text-amber-400 italic uppercase">COMPARTILHAR ID</p>
                <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider mt-0.5">Copiar Link / QR Code</p>
              </div>
              <QrCode size={18} className="text-amber-400" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 4. CONQUISTAS E INSÍGNIAS DO PILOTO */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="space-y-6 sm:space-y-8 bg-slate-900/40 border border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-amber-500 sm:w-7 sm:h-7" />
              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                CONQUISTAS E INSÍGNIAS DO PILOTO
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Troféus e marcas acumuladas em viagens, eventos e navegações na estrada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="bg-slate-950 p-2.5 sm:p-3 px-4 sm:px-5 rounded-2xl border border-slate-800 flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">PONTUAÇÃO</p>
                <p className="text-lg sm:text-xl font-black text-amber-400 italic">{totalPointsEarned} <span className="text-xs text-slate-500 font-normal">/ {totalPossiblePoints} PTS</span></p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'todas', label: `Todas (${achievements.length})` },
                { id: 'desbloqueadas', label: `Desbloqueadas (${unlockedCount})` },
                { id: 'bloqueadas', label: `Bloqueadas (${achievements.length - unlockedCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAchievementFilter(tab.id as any)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                    achievementFilter === tab.id
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {achievements
            .filter(a => {
              if (achievementFilter === 'desbloqueadas') return a.unlocked;
              if (achievementFilter === 'bloqueadas') return !a.unlocked;
              return true;
            })
            .map(badge => (
              <motion.div
                key={badge.id}
                whileHover={{ y: -4 }}
                className={cn(
                  "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden group",
                  badge.unlocked
                    ? "bg-slate-900/80 border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-500/5"
                    : "bg-slate-950/40 border-slate-800/80 opacity-70 hover:opacity-100"
                )}
              >
                {/* Top Badge Indicators */}
                <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider border",
                    badge.unlocked 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                      : "bg-slate-800/50 text-slate-500 border-slate-800"
                  )}>
                    {badge.category}
                  </span>

                  <span className={cn(
                    "px-2 py-0.5 sm:py-1 rounded-xl text-[9px] sm:text-[10px] font-black italic uppercase tracking-wider border flex items-center gap-1",
                    badge.unlocked 
                      ? "bg-amber-500 text-slate-950 border-amber-400" 
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  )}>
                    +{badge.points} PTS
                  </span>
                </div>

                {/* Badge Icon & Content */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="relative inline-block">
                    <div className={cn(
                      "text-4xl sm:text-5xl transition-all duration-500 transform group-hover:scale-110",
                      badge.unlocked ? "drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "grayscale opacity-50"
                    )}>
                      {badge.icon}
                    </div>

                    {!badge.unlocked && (
                      <span className="absolute -bottom-1 -right-1 p-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-full">
                        <Lock size={12} />
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className={cn(
                      "text-sm sm:text-base font-black italic uppercase tracking-tight",
                      badge.unlocked ? "text-white" : "text-slate-400"
                    )}>
                      {badge.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed mt-1">
                      {badge.desc}
                    </p>
                  </div>
                </div>

                {/* Footer Status */}
                <div className="mt-4 sm:mt-5 pt-3 border-t border-slate-800/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  {badge.unlocked ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Desbloqueado em {badge.date}
                    </span>
                  ) : (
                    <span className="text-amber-500/80 flex items-center gap-1 line-clamp-1" title={badge.requirement}>
                      <Lock size={11} className="shrink-0" /> {badge.requirement}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      </motion.section>

      {/* 5. GARAGE SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="flex items-center justify-between">
           <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">MINHA GARAGEM ({garage.length})</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {garage.map((bike) => (
            <motion.div
              key={bike.model}
              whileHover={{ y: -5 }}
              className="relative aspect-[1.5/1] rounded-3xl sm:rounded-[2.5rem] overflow-hidden group cursor-pointer border border-slate-800/60 bg-slate-900/40"
            >
              <img src={bike.image} className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-100" alt={bike.model} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-end">
                <p className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{bike.year}</p>
                <h4 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tighter leading-tight max-w-[200px]">{bike.model}</h4>
              </div>
            </motion.div>
          ))}

          {/* Empty Slot */}
          <div className="aspect-[1.5/1] border-2 border-dashed border-slate-800/60 rounded-3xl sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-3 sm:gap-4 hover:border-orange-500/30 transition-all cursor-pointer group bg-slate-900/40 p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-800 flex items-center justify-center text-slate-700 group-hover:text-orange-500 transition-all">
              <Plus size={20} className="sm:w-6 sm:h-6" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] group-hover:text-orange-500 transition-all">Slot Disponível</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
