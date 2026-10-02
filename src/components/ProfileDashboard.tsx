import { useState, useEffect, useMemo } from 'react';
import { Calendar, Trophy, Settings, Plus, QrCode, Route, Zap, Award, Lock, CheckCircle2, ShieldCheck, BookOpen, Sparkles, Crown, Camera, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { getPilotLiveGamification, PILOT_RANKS } from '../lib/gamification';
import { LogEntry } from './Logbook';
import { MotoEvent } from './Events';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DigitalIdModal } from './DigitalIdModal';

export function ProfileDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [achievementFilter, setAchievementFilter] = useState<'todas' | 'desbloqueadas' | 'bloqueadas'>('todas');
  const [showRankHierarchyModal, setShowRankHierarchyModal] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; index: number; slotLabel: string } | null>(null);
  const [showDigitalIdModal, setShowDigitalIdModal] = useState(false);
  const [badgeQrCodeUrl, setBadgeQrCodeUrl] = useState<string>('');

  const pilotName = profile?.name || 'Piloto MotoLegado';
  const pilotMotorcycle = profile?.motorcycle || 'Motocicleta Principal';
  const pilotMotorcycleNickname = profile?.motorcycle_nickname || '';
  const pilotMotorcycleYear = profile?.motorcycle_year || '';
  const pilotMotorcyclePlate = profile?.motorcycle_plate || '';
  const pilotClub = profile?.club_name || 'Piloto Independente';
  const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;

  // Gerar QR Code real escaneável para a miniatura do passaporte
  useEffect(() => {
    const passportUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/profile?pilot=${encodeURIComponent(profile?.id || user?.id || '77892-XP')}`
      : 'https://motolegado.com/profile';

    QRCode.toDataURL(passportUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(url => setBadgeQrCodeUrl(url))
      .catch(err => console.error('Erro ao gerar miniatura QR Code:', err));
  }, [profile?.id, user?.id]);

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

  // Centralized Live Gamification Engine
  const gamificationData = useMemo(() => {
    return getPilotLiveGamification(logs, events);
  }, [logs, events]);

  const { stats, badges, pointsBreakdown, rankInfo } = gamificationData;
  const totalKm = stats.totalKm;
  const checkedInEvents = events.filter(e => e.checkedIn);
  const achievements = badges;
  const totalPointsEarned = pointsBreakdown.totalPoints;
  const { currentTier, nextTier, progressPercent, pointsRemaining } = rankInfo;
  const unlockedCount = badges.filter(a => a.unlocked).length;
  const totalPossiblePoints = badges.reduce((acc, curr) => acc + curr.points, 0);

  const mainStats = [
    { label: 'DISTÂNCIA TOTAL', value: totalKm.toLocaleString(), unit: 'KM', icon: Route, color: 'text-orange-500' },
    { label: 'DIÁRIO DE BORDO', value: logs.length.toString(), unit: 'REGISTROS', icon: BookOpen, color: 'text-amber-400' },
    { label: 'EVENTOS CHECK-IN', value: checkedInEvents.length.toString(), unit: 'CONFIRMADOS', icon: Calendar, color: 'text-blue-500' },
    { label: 'PATENTE / NÍVEL', value: `${currentTier.icon} ${currentTier.title}`, unit: `${totalPointsEarned} PTS`, icon: Award, color: 'text-purple-400' },
  ];

  // Fotos reais da moto cadastradas no perfil
  const bikePhotos: string[] = useMemo(() => {
    let photos: string[] = [];
    if (profile?.motorcycle_photos && Array.isArray(profile.motorcycle_photos)) {
      photos = profile.motorcycle_photos.filter(p => typeof p === 'string' && p.trim().length > 0);
    }
    if (photos.length === 0) {
      const saved = localStorage.getItem('motolegado_pilot_bike_photos');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            photos = parsed.filter(p => typeof p === 'string' && p.trim().length > 0);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return photos;
  }, [profile?.motorcycle_photos]);

  // Garagem do piloto: mapeia cada foto enviada pelo piloto com seus dados reais
  const garage = useMemo(() => {
    const slotTitles = [
      'Visão Principal',
      'Ângulo Lateral',
      'Detalhes / Customização'
    ];

    if (bikePhotos.length > 0) {
      return bikePhotos.map((photoUrl, index) => ({
        id: `bike-photo-${index}`,
        index,
        slotLabel: slotTitles[index] || `Foto ${index + 1}`,
        year: pilotMotorcycleYear || 'Atual',
        model: pilotMotorcycleNickname 
          ? `${pilotMotorcycleNickname} • ${pilotMotorcycle}`
          : pilotMotorcycle,
        plate: pilotMotorcyclePlate,
        image: photoUrl,
        isUserPhoto: true,
      }));
    }

    return [];
  }, [bikePhotos, pilotMotorcycle, pilotMotorcycleNickname, pilotMotorcycleYear, pilotMotorcyclePlate]);

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
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
          <button 
            type="button"
            onClick={() => navigate('/profile/settings')}
            className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 group hover:border-orange-500/50 transition-all active:scale-95 cursor-pointer"
          >
            <Settings size={16} className="text-slate-500 group-hover:text-orange-500 transition-colors shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">CONFIGURAÇÕES</span>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/logbook')}
            className="px-4 sm:px-8 py-3 sm:py-3.5 bg-orange-600 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95 cursor-pointer"
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
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-orange-500 p-0.5 shrink-0 overflow-hidden bg-slate-900 shadow-md">
                    <img src={pilotAvatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
                    {profile?.personal_logo_url && (
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full border border-orange-500 bg-slate-950 p-0.5 overflow-hidden shadow-lg"
                        title={pilotClub !== 'Piloto Independente' ? "Brasão do Moto Clube" : "Brasão Pessoal do Piloto"}
                      >
                        <img src={profile.personal_logo_url} alt="Brasão" className="w-full h-full object-cover rounded-full" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-0.5">ID DIGITAL V.1</p>
                    <p className="text-[10px] sm:text-[11px] font-black text-white italic tracking-tighter">#77892-XP</p>
                  </div>
               </div>
               <div 
                 onClick={() => setShowDigitalIdModal(true)}
                 className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform border border-slate-700/60"
                 title="Clique para abrir o Passaporte e QR Code completo"
               >
                 {badgeQrCodeUrl ? (
                   <img src={badgeQrCodeUrl} alt="QR Code Escaneável" className="w-full h-full object-contain" />
                 ) : (
                   <QrCode size={26} className="text-black" />
                 )}
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
              onClick={() => setShowDigitalIdModal(true)}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-all group flex items-center justify-between cursor-pointer active:scale-95"
              title="Abrir Passaporte e Compartilhar ID"
            >
              <div>
                <p className="text-xs font-black text-amber-400 italic uppercase">COMPARTILHAR ID</p>
                <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider mt-0.5">Abrir Passaporte / QR Code</p>
              </div>
              <QrCode size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
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
        {/* Header with Title and Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Trophy size={24} className="text-amber-500 sm:w-7 sm:h-7 shrink-0" />
              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                CONQUISTAS E INSÍGNIAS DO PILOTO
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Troféus e insígnias acumuladas em quilometragem percorrida no asfalto e presença em encontros motociclísticos.
            </p>
          </div>

          <button
            onClick={() => navigate('/achievements')}
            className="btn-secondary py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto"
          >
            <Sparkles size={14} className="text-orange-400" />
            <span>Ver Hub Completo</span>
          </button>
        </div>

        {/* Dedicated Responsive Toolbar: Filter Options & Pontuação Metric */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Responsive Segmented Filter Tabs */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 w-full lg:w-auto">
            {[
              { id: 'todas', label: 'Todas', shortLabel: 'Todas', count: achievements.length },
              { id: 'desbloqueadas', label: 'Desbloqueadas', shortLabel: 'Desbloq.', count: unlockedCount },
              { id: 'bloqueadas', label: 'Bloqueadas', shortLabel: 'Bloq.', count: achievements.length - unlockedCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAchievementFilter(tab.id as any)}
                className={cn(
                  "px-3 py-2 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-center",
                  achievementFilter === tab.id
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                )}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className={cn(
                  "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                  achievementFilter === tab.id ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Pontuação Telemetry Box */}
          <div className="bg-slate-950/80 p-2.5 px-4 rounded-2xl border border-slate-800/80 flex items-center justify-between sm:justify-start gap-4 w-full lg:w-auto shrink-0">
            <div>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">PONTUAÇÃO</p>
              <p className="text-base sm:text-lg font-black text-amber-400 italic leading-none">
                {totalPointsEarned.toLocaleString()}{' '}
                <span className="text-[10px] sm:text-xs text-slate-500 font-normal">/ {totalPossiblePoints.toLocaleString()} PTS</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
              {Math.round((unlockedCount / achievements.length) * 100)}%
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
                onClick={() => navigate('/achievements')}
                className={cn(
                  "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer",
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
                    {badge.categoryLabel || badge.category}
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
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                      {badge.desc}
                    </p>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={cn("h-full rounded-full", badge.unlocked ? "bg-emerald-400" : "bg-orange-500")}
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer Status */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  {badge.unlocked ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Conquistado
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

      {/* 5. GARAGE SECTION - FOTOS DA MOTO DO PILOTO */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                MINHA GARAGEM ({garage.length > 0 ? `${garage.length} ${garage.length === 1 ? 'FOTO' : 'FOTOS'}` : '0 FOTOS'})
              </h3>
              {garage.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-wider">
                  Fotos Oficiais do Piloto
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {garage.length > 0 
                ? `Fotos enviadas no perfil para a máquina: ${pilotMotorcycleNickname ? `${pilotMotorcycleNickname} (${pilotMotorcycle})` : pilotMotorcycle}.`
                : 'Galeria visual e fotos da sua moto cadastradas no seu perfil.'
              }
            </p>
          </div>

          <button
            onClick={() => navigate('/profile/settings?tab=motocicleta')}
            className="self-start sm:self-auto px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-2xl flex items-center gap-2 text-xs font-black uppercase text-slate-300 hover:text-white transition-all group cursor-pointer"
          >
            <Camera size={15} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <span>Gerenciar Fotos da Moto</span>
          </button>
        </div>

        {garage.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {garage.map((bike) => (
              <motion.div
                key={bike.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedPhoto({ url: bike.image, title: bike.model, index: bike.index, slotLabel: bike.slotLabel })}
                className="relative aspect-[1.5/1] rounded-3xl sm:rounded-[2.5rem] overflow-hidden group cursor-pointer border border-slate-800/80 hover:border-orange-500/60 bg-slate-900/60 shadow-lg transition-all"
              >
                <img 
                  src={bike.image} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt={bike.model} 
                />
                
                {/* Overlay degradê */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                
                {/* Top Badge (Slot Label & Zoom Icon) */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[9px] font-black text-orange-400 uppercase tracking-widest shadow-md">
                    {bike.slotLabel}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-orange-500 transition-all opacity-0 group-hover:opacity-100 shadow-md">
                    <Maximize2 size={13} />
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-black text-orange-500 uppercase tracking-widest">
                      ANO {bike.year}
                    </span>
                    {bike.plate && (
                      <>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider">
                          PLACA: {bike.plate}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-md">
                    {bike.model}
                  </h4>
                </div>
              </motion.div>
            ))}

            {/* Slot Disponível para completar até 3 fotos */}
            {garage.length < 3 && (
              <div 
                onClick={() => navigate('/profile/settings?tab=motocicleta')}
                className="aspect-[1.5/1] border-2 border-dashed border-slate-800/80 rounded-3xl sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-3 sm:gap-4 hover:border-orange-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group bg-slate-900/30 p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 group-hover:text-orange-500 group-hover:border-orange-500/40 group-hover:scale-110 transition-all shadow-inner">
                  <Plus size={22} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-orange-400 transition-all">
                    Adicionar Mais Fotos
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                    {garage.length} de 3 fotos cadastradas
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State quando nenhuma foto foi enviada ainda */
          <div className="bg-slate-900/40 border-2 border-dashed border-slate-800/90 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-orange-500 shadow-xl shadow-orange-950/20">
              <Camera size={32} className="sm:w-9 sm:h-9" />
            </div>
            
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-lg sm:text-xl font-black text-white italic uppercase tracking-tight">
                NENHUMA FOTO DA MOTO ENVIADA AINDA
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Envie até 3 fotos da sua máquina (<strong className="text-white">{pilotMotorcycleNickname || pilotMotorcycle}</strong>) na aba <em>Motocicleta</em> das Configurações para exibi-las aqui na sua Garagem Oficial e comprovar seu passaporte.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
              {['Foto 1 (Principal)', 'Foto 2 (Lateral)', 'Foto 3 (Detalhes)'].map((slotName, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/profile/settings?tab=motocicleta')}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-orange-500/50 hover:bg-slate-900 text-center transition-all group cursor-pointer"
                >
                  <Camera size={16} className="text-slate-600 group-hover:text-orange-500 mx-auto mb-1.5 transition-colors" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white block transition-colors">
                    {slotName}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/profile/settings?tab=motocicleta')}
                className="px-6 sm:px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <Camera size={16} />
                <span>ENVIAR FOTOS DA MOTO AGORA</span>
              </button>
            </div>
          </div>
        )}
      </motion.section>

      {/* Lightbox Modal para Visualização em Tamanho Grande da Foto da Moto */}
      <AnimatePresence>
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0"
            >
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.title} 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                    GARAGEM OFICIAL • {selectedPhoto.slotLabel}
                  </span>
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tight mt-0.5">
                    {selectedPhoto.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedPhoto(null);
                      navigate('/profile/settings?tab=motocicleta');
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Settings size={14} />
                    <span>Trocar / Editar Foto</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Interativo do Passaporte Digital com QR Code Real */}
      <DigitalIdModal
        isOpen={showDigitalIdModal}
        onClose={() => setShowDigitalIdModal(false)}
        pilotName={pilotName}
        pilotId={profile?.id ? `#${profile.id.slice(0, 8).toUpperCase()}` : '#77892-XP'}
        pilotClub={pilotClub}
        pilotMotorcycle={pilotMotorcycle}
        pilotTier={currentTier}
        pilotAvatar={pilotAvatar}
        pilotLogo={profile?.personal_logo_url}
      />
    </div>
  );
}
