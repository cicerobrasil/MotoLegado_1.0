import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Route, 
  Calendar, 
  BookOpen, 
  Award, 
  Search, 
  Share2, 
  Info, 
  CheckCircle2, 
  Shield, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  MapPin, 
  Bike, 
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPilotLiveGamification } from '../lib/gamification';
import { buildGlobalRanking } from '../lib/rankingData';
import { LeaderboardPilot, RankingSortBy, RankingPeriod } from '../types';
import { cn } from '../lib/utils';
import type { LogEntry } from './Logbook';
import type { MotoEvent } from './Events';

export function GlobalRanking() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Local state for filters
  const [sortBy, setSortBy] = useState<RankingSortBy>('points');
  const [period, setPeriod] = useState<RankingPeriod>('all');
  const [selectedState, setSelectedState] = useState<string>('todos');
  const [selectedClub, setSelectedClub] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input, 'Escape' clears search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Modals state
  const [selectedPilot, setSelectedPilot] = useState<LeaderboardPilot | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Live user gamification stats
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<MotoEvent[]>([]);

  const loadData = () => {
    try {
      const savedLogs = localStorage.getItem('motolegado_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      const savedEvents = localStorage.getItem('motolegado_events');
      if (savedEvents) setEvents(JSON.parse(savedEvents));
    } catch (e) {
      console.error('Error loading gamification storage:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('motolegado_gamification_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('motolegado_gamification_updated', handleUpdate);
    };
  }, []);

  const gamification = useMemo(() => {
    return getPilotLiveGamification(logs, events);
  }, [logs, events]);

  const { pointsBreakdown, rankInfo, badges } = gamification;

  // Pilot details for the user
  const userPilotData = useMemo(() => {
    const pilotName = profile?.name || 'Você (Piloto MotoLegado)';
    const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
      ? profile.avatar_url
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;

    return {
      name: pilotName,
      handle: profile?.email ? `@${profile.email.split('@')[0]}` : '@meupiloto',
      avatar: pilotAvatar,
      motoClub: profile?.club_name || (profile as any)?.motoclub || 'Independente',
      motorcycle: profile?.motorcycle || 'Moto Oficial',
      city: profile?.city || 'Joinville',
      state: profile?.state || 'SC',
      totalPoints: pointsBreakdown.totalPoints,
      totalKm: pointsBreakdown.totalKm,
      eventsCount: pointsBreakdown.eventsCount,
      tripsCount: pointsBreakdown.tripsCount,
      badgesCount: badges.filter(b => b.unlocked).length,
      tierTitle: rankInfo.currentTier.title,
      tierIcon: rankInfo.currentTier.icon,
      tierAccent: rankInfo.currentTier.accentColor,
      isPro: profile?.plan_type === 'pago' || profile?.is_pro,
      bio: profile?.bio || 'Piloto na estrada acumulando quilômetros e histórias no asfalto.',
    };
  }, [profile, pointsBreakdown, rankInfo, badges]);

  // Build ranking
  const { leaderboard, currentUserPosition, currentUserPilot, totalPilotsCount } = useMemo(() => {
    return buildGlobalRanking({
      currentPilot: userPilotData,
      sortBy,
      period,
      stateFilter: selectedState,
      clubFilter: selectedClub,
      searchQuery,
    });
  }, [userPilotData, sortBy, period, selectedState, selectedClub, searchQuery]);

  // Top 3 Podium
  const top1 = leaderboard.length > 0 ? leaderboard[0] : null;
  const top2 = leaderboard.length > 1 ? leaderboard[1] : null;
  const top3 = leaderboard.length > 2 ? leaderboard[2] : null;

  // Next pilot ahead of the current user
  const pilotAhead = useMemo(() => {
    if (!currentUserPosition || currentUserPosition <= 1) return null;
    const aheadIndex = currentUserPosition - 2; // rank is 1-based
    return leaderboard[aheadIndex] || null;
  }, [currentUserPosition, leaderboard]);

  const pointsToPassAhead = useMemo(() => {
    if (!pilotAhead || !currentUserPilot) return 0;
    return Math.max(1, (pilotAhead.totalPoints - currentUserPilot.totalPoints) + 1);
  }, [pilotAhead, currentUserPilot]);

  // Share handler
  const handleShare = () => {
    const text = `🏆 Estou na posição #${currentUserPosition || 'X'} no Ranking Global MotoLegado com ${userPilotData.totalPoints.toLocaleString()} pontos de asfalto! Venha acelerar comigo na comunidade: ${window.location.origin}/ranking`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  // Unique states from leaderboard for the filter dropdown
  const availableStates = ['todos', 'SP', 'SC', 'PR', 'MG', 'RJ', 'RS', 'GO', 'BA', 'DF', 'ES'];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 min-h-screen text-slate-200">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/80 pb-6 sm:pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                  RANKING <span className="text-[#ff751f]">GLOBAL</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  TEMPORADA 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Líderes de asfalto, veteranos de encontros e batedores de estradas de todo o Brasil.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="btn-secondary py-2 px-3 sm:px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <Info size={14} className="text-amber-400" />
            <span>Como Pontuar</span>
          </button>

          <button
            onClick={() => navigate('/achievements')}
            className="btn-secondary py-2 px-3 sm:px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <Trophy size={14} className="text-orange-400" />
            <span>Minhas Badges</span>
          </button>

          <button
            onClick={handleShare}
            className="btn-primary py-2 px-3 sm:px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <Share2 size={14} />
            <span>{copiedShare ? 'Copiado!' : 'Compartilhar'}</span>
          </button>
        </div>
      </div>

      {/* 2. USER POSITION HIGHLIGHT CARD */}
      {currentUserPilot && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border-2 border-orange-500/40 p-4 sm:p-6 shadow-xl shadow-orange-950/20"
        >
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* Left: User Pilot Identity */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-orange-500/60 shadow-lg shadow-orange-500/20 bg-slate-950">
                  <img src={currentUserPilot.avatar} alt={currentUserPilot.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-orange-600 text-white font-black text-[10px] uppercase shadow-md">
                  #{currentUserPosition || '-'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1">
                    <Sparkles size={13} /> SEU STATUS DE PILOTO
                  </span>
                  {currentUserPilot.isPro && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase border border-amber-500/40">
                      VIP PRO
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-2xl font-black italic uppercase text-white tracking-tight mt-0.5">
                  {currentUserPilot.name}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="text-white font-bold">{currentUserPilot.tierIcon} {currentUserPilot.tierTitle}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{currentUserPilot.motorcycle}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin size={11} className="text-orange-400" />
                    {currentUserPilot.city}/{currentUserPilot.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Live Points Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800">
              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">PONTUAÇÃO</p>
                <p className="text-base sm:text-xl font-black text-amber-400 italic">
                  {currentUserPilot.totalPoints.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">PTS</span>
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">KM RODADOS</p>
                <p className="text-base sm:text-xl font-black text-white italic">
                  {currentUserPilot.totalKm.toLocaleString()} <span className="text-[10px] text-orange-400 font-normal">KM</span>
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">CHECK-INS</p>
                <p className="text-base sm:text-xl font-black text-sky-400 italic">
                  {currentUserPilot.eventsCount} <span className="text-[10px] text-slate-400 font-normal">EVTS</span>
                </p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">INSÍGNIAS</p>
                <p className="text-base sm:text-xl font-black text-emerald-400 italic">
                  {currentUserPilot.badgesCount} <span className="text-[10px] text-slate-400 font-normal">BADGES</span>
                </p>
              </div>
            </div>

            {/* Right: Gap to Next Pilot */}
            <div className="flex flex-col justify-center sm:min-w-[220px]">
              {pilotAhead ? (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <span>Próximo Alvo</span>
                    <span className="text-orange-400 font-mono">#{pilotAhead.rank}</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    {pilotAhead.name}
                  </p>
                  <p className="text-[10px] text-amber-400 font-medium mt-1">
                    Faltam <strong>+{pointsToPassAhead.toLocaleString()} pts</strong> para assumir o <strong>#{pilotAhead.rank}</strong>!
                  </p>
                </div>
              ) : (
                <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 text-center">
                  <Crown size={20} className="text-amber-400 mx-auto mb-1" />
                  <p className="text-xs font-black text-amber-300 uppercase tracking-wider">LÍDER DO RANKING</p>
                  <p className="text-[10px] text-amber-200/80 mt-0.5">Você está no topo do asfalto!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. PODIUM (TOP 3 PILOTS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={18} />
            <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white">
              PÓDIO DOS LÍDERES
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Top 3 Pilotos da Comunidade</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4">
          
          {/* #2 SILVER (Second Place) */}
          {top2 && (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPilot(top2)}
              className="order-2 md:order-1 bg-gradient-to-b from-slate-800/40 via-slate-900/90 to-slate-950 border border-slate-700/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer group shadow-lg"
            >
              <div className="absolute top-3 left-4 text-3xl font-black text-slate-700 select-none">
                #2
              </div>
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1">
                🥈 PRATA
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-400 shadow-lg bg-slate-900 group-hover:scale-105 transition-transform">
                    <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-2 -right-1 text-2xl">
                    {top2.tierIcon}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black italic uppercase text-white mt-3 group-hover:text-slate-200 transition-colors">
                  {top2.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">{top2.handle}</p>

                <div className="mt-2 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield size={12} className="text-slate-400" />
                  <span>{top2.motoClub || 'Independente'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{top2.motorcycle}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">QUILOMETRAGEM</p>
                  <p className="font-black text-white italic">{top2.totalKm.toLocaleString()} KM</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">PONTOS</p>
                  <p className="font-black text-slate-200 italic text-base">{top2.totalPoints.toLocaleString()} PTS</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* #1 GOLD (Champion - Elevated in center) */}
          {top1 && (
            <motion.div
              whileHover={{ y: -6 }}
              onClick={() => setSelectedPilot(top1)}
              className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden cursor-pointer group shadow-2xl shadow-amber-500/10 md:-translate-y-2"
            >
              <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="absolute top-3 left-4 text-4xl font-black text-amber-500/30 select-none">
                #1
              </div>
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-400 flex items-center gap-1 font-mono shadow-md">
                👑 CAMPEÃO
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-3 border-amber-400 shadow-xl shadow-amber-500/30 bg-slate-900 group-hover:scale-105 transition-transform">
                    <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-2xl drop-shadow-md">
                    👑
                  </span>
                  <span className="absolute -bottom-2 -right-1 text-2xl">
                    {top1.tierIcon}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black italic uppercase text-amber-400 mt-3 group-hover:text-amber-300 transition-colors">
                  {top1.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">{top1.handle}</p>

                <div className="mt-2 text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield size={12} className="text-amber-400" />
                  <span>{top1.motoClub || 'Independente'}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">{top1.motorcycle}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[8px] font-black uppercase text-amber-400/80 tracking-wider">QUILOMETRAGEM</p>
                  <p className="font-black text-white italic">{top1.totalKm.toLocaleString()} KM</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-amber-400/80 tracking-wider">PONTUAÇÃO SUPREMA</p>
                  <p className="font-black text-amber-400 italic text-lg">{top1.totalPoints.toLocaleString()} PTS</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* #3 BRONZE (Third Place) */}
          {top3 && (
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPilot(top3)}
              className="order-3 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 border border-amber-800/50 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer group shadow-lg"
            >
              <div className="absolute top-3 left-4 text-3xl font-black text-amber-900/40 select-none">
                #3
              </div>
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-900/40 text-amber-400 border border-amber-800 flex items-center gap-1">
                🥉 BRONZE
              </div>

              <div className="flex flex-col items-center text-center mt-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-700 shadow-lg bg-slate-900 group-hover:scale-105 transition-transform">
                    <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-2 -right-1 text-2xl">
                    {top3.tierIcon}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black italic uppercase text-white mt-3 group-hover:text-amber-200 transition-colors">
                  {top3.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">{top3.handle}</p>

                <div className="mt-2 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield size={12} className="text-amber-600" />
                  <span>{top3.motoClub || 'Independente'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{top3.motorcycle}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">QUILOMETRAGEM</p>
                  <p className="font-black text-white italic">{top3.totalKm.toLocaleString()} KM</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">PONTOS</p>
                  <p className="font-black text-amber-500 italic text-base">{top3.totalPoints.toLocaleString()} PTS</p>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </section>

      {/* 4. DEDICATED SEARCH BAR & FILTERS SECTION */}
      <section className="bg-slate-900/80 border-2 border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl">
        
        {/* Prominent Search Bar by Name or Nickname */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="pilot-search-input" className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <Search size={15} className="text-orange-500" />
              <span>Buscar Motociclista por Nome ou Nickname</span>
            </label>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-bold">/</kbd> para focar
            </span>
          </div>

          <div className="relative group">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" 
              size={18} 
            />
            <input
              id="pilot-search-input"
              ref={searchInputRef}
              type="text"
              placeholder="Digite o nome (ex: Carlos Trovão) ou @nickname (ex: @carlos_trovao, @sombra_sc, @renata_valquiria)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3 sm:py-3.5 bg-slate-950 border-2 border-slate-800 group-focus-within:border-orange-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Limpar pesquisa (Esc)"
              >
                <X size={13} />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Quick Nickname & Pilot Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider mr-1">
              Sugestões Rápidas:
            </span>
            {[
              '@carlos_trovao',
              '@sombra_sc',
              '@renata_valquiria',
              '@barba_curitiba',
              '@pantera_rio',
              '@coyote_antunes',
              userPilotData.handle
            ].filter(Boolean).map(nick => {
              const isSelected = searchQuery.toLowerCase().trim() === nick.toLowerCase().trim();
              return (
                <button
                  key={nick}
                  type="button"
                  onClick={() => setSearchQuery(isSelected ? '' : nick)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border cursor-pointer",
                    isSelected
                      ? "bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/20"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  )}
                >
                  {nick}
                </button>
              );
            })}
          </div>

          {/* Active Search Results Indicator */}
          {searchQuery.trim() && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-orange-950/40 border border-orange-500/40 rounded-xl px-3.5 py-2 text-xs"
            >
              <span className="text-orange-300 font-medium">
                Filtrando por <strong>"{searchQuery}"</strong> — <strong>{leaderboard.length}</strong> motociclista(s) encontrado(s)
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-orange-400 hover:text-orange-200 text-xs font-bold underline cursor-pointer"
              >
                Limpar busca
              </button>
            </motion.div>
          )}
        </div>

        {/* Secondary Filters Bar (Sorting, Period, State, Club) */}
        <div className="pt-3 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Sort By Segmented Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'points', label: '🏆 Geral (Pontos)' },
                { id: 'km', label: '🛣️ Asfalto (KM)' },
                { id: 'events', label: '🎟️ Encontros' },
                { id: 'trips', label: '📖 Diário' },
                { id: 'badges', label: '🎖️ Badges' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id as RankingSortBy)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                    sortBy === tab.id
                      ? "bg-[#ff751f] text-white shadow-md shadow-orange-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto self-start lg:self-center">
              {[
                { id: 'all', label: 'Histórico Completo' },
                { id: 'season2026', label: 'Temporada 2026' },
                { id: 'month', label: 'Mês Atual' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as RankingPeriod)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                    period === p.id
                      ? "bg-slate-800 text-amber-400 border border-amber-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* State & Club Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
            {/* State Filter */}
            <div>
              <label htmlFor="state-filter-select" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Filtrar por Estado (UF):
              </label>
              <select
                id="state-filter-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                aria-label="Filtrar pilotos por estado"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500 uppercase font-bold"
              >
                <option value="todos">Brasil Todo (Todos os Estados)</option>
                {availableStates.filter(s => s !== 'todos').map(uf => (
                  <option key={uf} value={uf}>Estado: {uf}</option>
                ))}
              </select>
            </div>

            {/* Club Filter */}
            <div>
              <label htmlFor="club-filter-select" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Filtrar por Moto Clube:
              </label>
              <select
                id="club-filter-select"
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                aria-label="Filtrar pilotos por filiação ou moto clube"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500 uppercase font-bold"
              >
                <option value="todos">Todos os Pilotos e Clubes</option>
                <option value="independente">Apenas Motociclistas Independentes</option>
                <option value="Abutres">Abutres MC</option>
                <option value="Bodes">Bodes do Asfalto</option>
                <option value="Insanos">Insanos MC</option>
                <option value="Asfalto Livre">Asfalto Livre MC</option>
                <option value="Rota 101">Rota 101 MC</option>
                <option value="Mulheres do Asfalto">Mulheres do Asfalto</option>
                <option value="Caveiras">Caveiras do Asfalto</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LEADERBOARD LIST / TABLE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>Exibindo <strong>{leaderboard.length}</strong> de {totalPilotsCount} pilotos ranqueados</span>
          <span className="hidden sm:inline text-[11px] text-slate-500">Clique em qualquer piloto para ver a ficha completa</span>
        </div>

        {/* Table Container */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl sm:rounded-3xl overflow-hidden divide-y divide-slate-800/60 shadow-xl">
          
          {/* Header Row (Desktop) */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <div className="col-span-1 text-center">POS</div>
            <div className="col-span-4">PILOTO & CLUBE</div>
            <div className="col-span-2">PATENTE</div>
            <div className="col-span-2 text-right">DISTÂNCIA (KM)</div>
            <div className="col-span-1 text-center">EVENTOS</div>
            <div className="col-span-2 text-right">PONTOS TOTAIS</div>
          </div>

          {/* Rows */}
          {leaderboard.map((pilot) => {
            const isMe = pilot.isCurrentUser;

            return (
              <motion.div
                key={pilot.id}
                whileHover={{ backgroundColor: 'rgba(255, 117, 31, 0.04)' }}
                onClick={() => setSelectedPilot(pilot)}
                className={cn(
                  "p-4 sm:px-6 sm:py-4 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-4 relative",
                  isMe && "bg-orange-500/10 border-l-4 border-l-orange-500"
                )}
              >
                {/* Mobile top bar / Desktop Rank Position */}
                <div className="flex items-center justify-between md:contents">
                  <div className="md:col-span-1 flex items-center md:justify-center gap-2">
                    <span className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs italic border",
                      pilot.rank === 1 && "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20",
                      pilot.rank === 2 && "bg-slate-300 text-slate-950 border-slate-200",
                      pilot.rank === 3 && "bg-amber-900/60 text-amber-300 border-amber-700",
                      pilot.rank > 3 && (isMe ? "bg-orange-600 text-white border-orange-500" : "bg-slate-950 text-slate-400 border-slate-800")
                    )}>
                      #{pilot.rank}
                    </span>

                    {/* Rank change indicator */}
                    <span className="hidden sm:inline-block">
                      {pilot.pointsTrend === 'up' && (
                        <span title="Subindo no ranking">
                          <ArrowUpRight size={14} className="text-emerald-400" />
                        </span>
                      )}
                      {pilot.pointsTrend === 'down' && (
                        <span title="Descendo no ranking">
                          <ArrowDownRight size={14} className="text-rose-400" />
                        </span>
                      )}
                      {pilot.pointsTrend === 'same' && (
                        <span title="Posição estável">
                          <Minus size={12} className="text-slate-600" />
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Points tag on mobile */}
                  <div className="md:hidden flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 italic">
                      {pilot.totalPoints.toLocaleString()} PTS
                    </span>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                </div>

                {/* Pilot Identity */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={pilot.avatar}
                      alt={pilot.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-700 bg-slate-950"
                    />
                    {isMe && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" title="Você" />
                    )}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={cn(
                        "text-sm font-black italic uppercase tracking-tight truncate",
                        isMe ? "text-orange-400" : "text-white"
                      )}>
                        {pilot.name} {isMe && "(VOCÊ)"}
                      </h4>
                      <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {pilot.handle}
                      </span>
                      {pilot.isVerified && (
                        <CheckCircle2 size={13} className="text-sky-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                      <span className="text-slate-300 font-medium truncate">{pilot.motoClub || 'Independente'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500 truncate">{pilot.motorcycle}</span>
                    </div>
                  </div>
                </div>

                {/* Rank Tier */}
                <div className="md:col-span-2 flex items-center gap-2">
                  <span className="text-lg">{pilot.tierIcon}</span>
                  <div className="text-xs font-bold text-slate-300 truncate">
                    {pilot.tierTitle}
                  </div>
                </div>

                {/* Mileage */}
                <div className="md:col-span-2 md:text-right flex items-center justify-between md:block text-xs">
                  <span className="md:hidden text-slate-500 uppercase font-black text-[9px]">Quilometragem:</span>
                  <span className="font-mono font-black text-white italic">
                    {pilot.totalKm.toLocaleString()} <span className="text-[10px] text-orange-400 not-italic font-bold">KM</span>
                  </span>
                </div>

                {/* Events */}
                <div className="md:col-span-1 md:text-center flex items-center justify-between md:block text-xs">
                  <span className="md:hidden text-slate-500 uppercase font-black text-[9px]">Encontros:</span>
                  <span className="font-mono font-black text-sky-400">
                    {pilot.eventsCount}
                  </span>
                </div>

                {/* Total Points */}
                <div className="hidden md:block md:col-span-2 text-right">
                  <div className="text-base font-black italic text-amber-400 tracking-tight">
                    {pilot.totalPoints.toLocaleString()} <span className="text-xs text-slate-500 not-italic font-normal">PTS</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {pilot.badgesCount} badges
                  </div>
                </div>

              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <Trophy size={40} className="mx-auto text-slate-700" />
              <h3 className="text-base font-black uppercase text-white">Nenhum piloto encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar os filtros de estado, moto clube ou limpar o campo de busca.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedState('todos');
                  setSelectedClub('todos');
                }}
                className="btn-secondary text-xs"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 6. PILOT DOSSIER MODAL */}
      <AnimatePresence>
        {selectedPilot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedPilot(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-colors z-10"
              >
                <X size={18} />
              </button>

              {/* Pilot Card Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-800">
                <div className="relative">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-orange-500/80 bg-slate-950 shrink-0">
                    <img src={selectedPilot.avatar} alt={selectedPilot.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-2xl">
                    {selectedPilot.tierIcon}
                  </span>
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 font-mono font-black text-[10px] border border-orange-500/30">
                      RANK #{selectedPilot.rank}
                    </span>
                    {selectedPilot.isPro && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
                        PRO
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black italic uppercase text-white mt-1">
                    {selectedPilot.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedPilot.handle}</p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                    <MapPin size={12} className="text-orange-400" />
                    <span>{selectedPilot.city}, {selectedPilot.state}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedPilot.bio && (
                <div className="my-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{selectedPilot.bio}"
                  </p>
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">PONTOS</p>
                  <p className="text-base font-black text-amber-400 italic mt-0.5">
                    {selectedPilot.totalPoints.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">KM ASFALTO</p>
                  <p className="text-base font-black text-white italic mt-0.5">
                    {selectedPilot.totalKm.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">ENCONTROS</p>
                  <p className="text-base font-black text-sky-400 italic mt-0.5">
                    {selectedPilot.eventsCount}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider">EXPEDIÇÕES</p>
                  <p className="text-base font-black text-purple-400 italic mt-0.5">
                    {selectedPilot.tripsCount}
                  </p>
                </div>
              </div>

              {/* Garage & Club Details */}
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Moto Atual:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Bike size={14} className="text-orange-400" />
                    {selectedPilot.motorcycle}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Moto Clube:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Shield size={14} />
                    {selectedPilot.motoClub || 'Independente'} {selectedPilot.clubRole && `(${selectedPilot.clubRole})`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Patente:</span>
                  <span className="font-bold text-white">
                    {selectedPilot.tierIcon} {selectedPilot.tierTitle}
                  </span>
                </div>

                {selectedPilot.highlightBadge && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Destaque:</span>
                    <span className="font-bold text-emerald-400">
                      🎖️ {selectedPilot.highlightBadge}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedPilot(null)}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Fechar
                </button>

                {selectedPilot.isCurrentUser ? (
                  <button
                    onClick={() => {
                      setSelectedPilot(null);
                      navigate('/profile');
                    }}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Editar Meu Perfil</span>
                    <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPilot(null);
                      navigate('/community');
                    }}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Ver na Comunidade</span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. SCORING RULES MODAL */}
      <AnimatePresence>
        {isRulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <Trophy size={24} className="text-amber-400" />
                <h3 className="text-xl font-black italic uppercase text-white tracking-tight">
                  COMO PONTUAR NO RANKING
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                O Ranking Global do MotoLegado valoriza quem realmente roda no asfalto e vive o motociclismo na prática.
              </p>

              <div className="space-y-3 my-5">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Route size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">1 KM Rodado = 1 Ponto de Asfalto</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cada viagem ou passeio registrado no <strong>Diário de Bordo</strong> com quilometragem válida soma diretamente à sua pontuação geral.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">+150 Pontos por Check-in de Encontro</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Confirme presença nos eventos motociclísticos e encontros de moto clubes oficiais através da aba <strong>Eventos</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">+50 Pontos por Expedição no Diário</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cada relato com fotos, rotas e paradas catalogadas bonifica o piloto pelo registro da memória estradeira.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">De +100 a +1.000 Pontos por Badges</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Desbloqueie conquistas de 100km, 500km, 1.000km, 5.000km, expedições na chuva ou noturnas para receber saltos gigantes de pontuação.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                Entendi, Bora Acelerar!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
