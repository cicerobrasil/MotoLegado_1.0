import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getPilotLiveGamification, 
  PILOT_RANKS
} from '../lib/gamification';
import { MotorcyclistBadge, BadgeCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles, 
  Route, 
  Calendar, 
  BookOpen, 
  Lock, 
  CheckCircle2, 
  Zap, 
  Filter, 
  Trophy,
  X,
  Share2,
  Check,
  Crown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Achievements() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Load live gamification stats
  const [gamificationData, setGamificationData] = useState(() => getPilotLiveGamification());
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<MotorcyclistBadge | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Reload when storage changes or custom event fires
  const refreshGamification = () => {
    setGamificationData(getPilotLiveGamification());
  };

  useEffect(() => {
    refreshGamification();

    const handleStorageChange = () => refreshGamification();
    const handleCustomUpdate = () => refreshGamification();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('motolegado_gamification_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('motolegado_gamification_updated', handleCustomUpdate);
    };
  }, []);

  const { stats, badges, pointsBreakdown, rankInfo } = gamificationData;
  const { currentTier, nextTier, progressPercent, pointsRemaining } = rankInfo;

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      // Category filter
      if (activeCategory !== 'all' && badge.category !== activeCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unlocked' && !badge.unlocked) {
        return false;
      }
      if (statusFilter === 'locked' && badge.unlocked) {
        return false;
      }
      return true;
    });
  }, [badges, activeCategory, statusFilter]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;
  const overallBadgesPercent = Math.round((unlockedCount / totalBadges) * 100);

  // Copy shareable summary for WhatsApp or social media
  const handleShareAchievements = async () => {
    const text = `🏍️ *CONQUISTAS MOTOLEGADO - ${profile?.name || 'PILOTO'}*\n` +
      `🏆 Patente: *${currentTier.title}* (${pointsBreakdown.totalPoints} PTS)\n` +
      `🛣️ Rodagem: *${stats.totalKm.toLocaleString()} KM* rodados\n` +
      `🎪 Eventos: *${stats.eventsCount} encontros* participados\n` +
      `🏅 Medalhas: *${unlockedCount}/${totalBadges} badges* desbloqueadas (${overallBadgesPercent}%)\n\n` +
      `Acompanhe a telemetria oficial no MotoLegado!`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 min-h-screen text-slate-100">
      
      {/* =========================================================================
          1. HEADER & TOP LIVE SCORECARD
          ========================================================================= */}
      <header className="border-b border-slate-800/80 pb-6 sm:pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-widest mb-3">
            <Sparkles size={12} />
            <span>Sistema Oficial de Badges & Pontos por KM e Eventos</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            CONQUISTAS & <span className="text-orange-500">PONTOS</span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 max-w-2xl">
            Cada quilômetro de asfalto percorrido (1 KM = 1 Ponto) e cada evento participado (150 Pontos) acumulam prestígio, desbloqueiam insígnias raras e elevam sua patente no MotoLegado.
          </p>
        </div>

        {/* Action Buttons: Ranking & Share */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/ranking')}
            className="btn-primary py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <Crown size={15} className="text-amber-300" />
            <span>Ver Ranking Global</span>
          </button>

          <button
            onClick={handleShareAchievements}
            className="btn-secondary py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            {copiedShare ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Copiado para o Zap!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Compartilhar Score</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. PILOT TELEMETRY & POINTS BREAKDOWN BANNER
          ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Current Rank Badge */}
          <div className="lg:col-span-4 flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-6 lg:pb-0 lg:pr-6">
            <div className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shrink-0 transition-transform hover:scale-105",
              currentTier.badgeStyle
            )}>
              {currentTier.icon}
            </div>

            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Patente Atual do Piloto
              </span>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white truncate">
                {currentTier.title}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black">
                <Zap size={12} className="fill-orange-400" />
                <span>{pointsBreakdown.totalPoints.toLocaleString()} PONTOS TOTAIS</span>
              </div>
            </div>
          </div>

          {/* Right: Core Metrics & Progress to Next Tier */}
          <div className="lg:col-span-8 space-y-5">
            {/* 3 Main Stat Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              
              {/* Mileage */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-400">
                  <Route size={12} />
                  <span>Quilometragem</span>
                </div>
                <div className="text-lg sm:text-2xl font-black italic text-white font-mono">
                  {stats.totalKm.toLocaleString()} <span className="text-xs text-slate-500 font-sans">KM</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  +{pointsBreakdown.kmPoints} pts no asfalto
                </div>
              </div>

              {/* Events Attended */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-400">
                  <Calendar size={12} />
                  <span>Eventos</span>
                </div>
                <div className="text-lg sm:text-2xl font-black italic text-white font-mono">
                  {stats.eventsCount} <span className="text-xs text-slate-500 font-sans">CHECK-INS</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  +{pointsBreakdown.eventPoints} pts em encontros
                </div>
              </div>

              {/* Badges Unlocked */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  <Trophy size={12} />
                  <span>Badges</span>
                </div>
                <div className="text-lg sm:text-2xl font-black italic text-white font-mono">
                  {unlockedCount}/{totalBadges}
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  +{pointsBreakdown.badgePoints} pts de medalhas
                </div>
              </div>

            </div>

            {/* Rank Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">
                  {nextTier ? (
                    <>Progresso rumo a <strong className="text-white">{nextTier.title}</strong></>
                  ) : (
                    <strong className="text-amber-400">Patente Máxima Alcançada!</strong>
                  )}
                </span>
                {nextTier && (
                  <span className="text-orange-400 font-mono text-[11px]">
                    Faltam <strong>{pointsRemaining.toLocaleString()} pts</strong>
                  </span>
                )}
              </div>

              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                <span>{currentTier.title} ({currentTier.minPoints} pts)</span>
                <span className="text-orange-400 font-mono">{progressPercent}%</span>
                <span>{nextTier ? `${nextTier.title} (${nextTier.minPoints} pts)` : 'Lenda'}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Points Source Breakdown Pills */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] font-bold text-slate-400">
          <span className="uppercase text-slate-500">Fontes de Pontuação:</span>
          
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Route size={11} className="text-orange-500" />
            <span>Asfalto (1 km = 1 pt): <strong>+{pointsBreakdown.kmPoints}</strong></span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Calendar size={11} className="text-sky-400" />
            <span>Eventos (150 pts/check-in): <strong>+{pointsBreakdown.eventPoints}</strong></span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <BookOpen size={11} className="text-amber-400" />
            <span>Diário (100 pts/viagem): <strong>+{pointsBreakdown.tripPoints}</strong></span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <Trophy size={11} className="text-purple-400" />
            <span>Badges Conquistadas: <strong>+{pointsBreakdown.badgePoints}</strong></span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. RANKS / PATENTES OFICIAIS ROW
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black italic uppercase text-white tracking-tight flex items-center gap-2">
            <Award size={18} className="text-orange-500" />
            <span>Níveis & Patentes MotoLegado</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Evolua sua pontuação para desbloquear novas cores e privilégios
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PILOT_RANKS.map((tier) => {
            const isCurrent = currentTier.level === tier.level;
            const isUnlocked = pointsBreakdown.totalPoints >= tier.minPoints;

            return (
              <div
                key={tier.level}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden",
                  isCurrent
                    ? "bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/15 scale-[1.02]"
                    : isUnlocked
                    ? "bg-slate-900/80 border-slate-800 text-slate-300"
                    : "bg-slate-950/40 border-slate-900/80 opacity-60"
                )}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-orange-500 text-slate-950 text-[8px] font-black uppercase tracking-wider">
                    Atual
                  </span>
                )}

                <div>
                  <div className="text-3xl mb-2">{tier.icon}</div>
                  <div className="text-xs font-black uppercase italic text-white flex items-center justify-between">
                    <span>{tier.title}</span>
                    {isUnlocked && <ShieldCheck size={14} className="text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                    {tier.subtitle}
                  </div>
                </div>

                <div className="text-[10px] font-mono font-bold text-orange-400 mt-3 pt-2 border-t border-slate-800/60">
                  {tier.minPoints.toLocaleString()} a {tier.maxPoints.toLocaleString()} pts
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          4. BADGES GRID WITH FILTER CONTROLS
          ========================================================================= */}
      <section className="space-y-6 pt-4">
        
        {/* Filter Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer border",
                activeCategory === 'all'
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              Todas ({badges.length})
            </button>

            <button
              onClick={() => setActiveCategory('mileage')}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                activeCategory === 'mileage'
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Route size={13} />
              <span>Quilometragem</span>
            </button>

            <button
              onClick={() => setActiveCategory('events')}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                activeCategory === 'events'
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Calendar size={13} />
              <span>Eventos & Encontros</span>
            </button>

            <button
              onClick={() => setActiveCategory('combo')}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                activeCategory === 'combo'
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Zap size={13} />
              <span>Combos</span>
            </button>

            <button
              onClick={() => setActiveCategory('special')}
              className={cn(
                "py-1.5 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                activeCategory === 'special'
                  ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <Star size={13} />
              <span>Especiais</span>
            </button>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={14} className="text-slate-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Todas as Medalhas</option>
              <option value="unlocked">Apenas Desbloqueadas ({unlockedCount})</option>
              <option value="locked">Apenas Em Progresso ({totalBadges - unlockedCount})</option>
            </select>
          </div>

        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredBadges.map((badge, idx) => {
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  "p-5 rounded-3xl border transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden select-none active:scale-[0.99]",
                  badge.unlocked
                    ? "bg-slate-900/90 border-orange-500/40 hover:border-orange-400 shadow-xl shadow-orange-500/5 hover:-translate-y-1"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                )}
              >
                {/* Top Badges Meta */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="relative">
                      <span className={cn(
                        "text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 inline-block",
                        badge.unlocked ? "drop-shadow-[0_0_12px_rgba(234,88,12,0.4)]" : "grayscale opacity-50"
                      )}>
                        {badge.icon}
                      </span>
                      {!badge.unlocked && (
                        <span className="absolute -bottom-1 -right-1 p-1 bg-slate-950 border border-slate-800 text-slate-400 rounded-full">
                          <Lock size={10} />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        badge.unlocked 
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                          : "bg-slate-800/70 border-slate-700 text-slate-400"
                      )}>
                        {badge.unlocked ? 'Conquistado' : `${badge.progressPercent}%`}
                      </span>

                      <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black font-mono">
                        +{badge.points} PTS
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                      {badge.categoryLabel}
                    </span>
                    <h4 className={cn(
                      "text-sm sm:text-base font-black italic uppercase tracking-tight line-clamp-1",
                      badge.unlocked ? "text-white" : "text-slate-300"
                    )}>
                      {badge.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {badge.desc}
                    </p>
                  </div>
                </div>

                {/* Bottom Progress & Action Section */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{badge.requirement}</span>
                      <span className="text-slate-400 font-mono">
                        {badge.category === 'mileage' && `${stats.totalKm.toLocaleString()} / ${badge.targetKm?.toLocaleString()} KM`}
                        {badge.category === 'events' && `${stats.eventsCount} / ${badge.targetEvents} Eventos`}
                        {badge.category === 'combo' && `${badge.progressPercent}%`}
                        {badge.category === 'special' && (badge.unlocked ? '1/1' : '0/1')}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          badge.unlocked ? "bg-emerald-400" : "bg-orange-500"
                        )}
                        style={{ width: `${badge.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {badge.unlocked ? '✓ Desbloqueada' : 'Bloqueada'}
                    </span>

                    {badge.category === 'mileage' && !badge.unlocked && (
                      <Link
                        to="/logbook"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-black uppercase text-orange-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Registrar KM <ChevronRight size={12} />
                      </Link>
                    )}

                    {badge.category === 'events' && !badge.unlocked && (
                      <Link
                        to="/events"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-black uppercase text-sky-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Ver Eventos <ChevronRight size={12} />
                      </Link>
                    )}

                    {badge.unlocked && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 size={11} /> Conquistada
                      </span>
                    )}
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          5. MODAL: DETALHES DA BADGE SELECIONADA
          ========================================================================= */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="absolute inset-0"
              onClick={() => setSelectedBadge(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3">
                <div className={cn(
                  "w-24 h-24 mx-auto rounded-3xl border flex items-center justify-center text-5xl shadow-2xl",
                  selectedBadge.unlocked 
                    ? "bg-orange-500/10 border-orange-500/50 shadow-orange-500/20" 
                    : "bg-slate-950 border-slate-800 grayscale opacity-60"
                )}>
                  {selectedBadge.icon}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block mb-1">
                    {selectedBadge.categoryLabel}
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-white">
                    {selectedBadge.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {selectedBadge.subtitle}
                  </p>
                </div>
              </div>

              {/* Requirement & Lore */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Requisito de Conquista
                </span>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  {selectedBadge.requirement}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                  {selectedBadge.desc}
                </p>
              </div>

              {/* Progress & Reward */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Recompensa</span>
                  <span className="text-sm font-black text-orange-400 font-mono">+{selectedBadge.points} PTS</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Progresso</span>
                  <span className={cn(
                    "text-sm font-black font-mono",
                    selectedBadge.unlocked ? "text-emerald-400" : "text-white"
                  )}>
                    {selectedBadge.progressPercent}%
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                {selectedBadge.category === 'mileage' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      navigate('/logbook');
                    }}
                    className="w-full btn-primary py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <BookOpen size={14} />
                    <span>Registrar Viagem no Diário</span>
                  </button>
                )}

                {selectedBadge.category === 'events' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      navigate('/events');
                    }}
                    className="w-full btn-primary py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} />
                    <span>Explorar e Fazer Check-in em Eventos</span>
                  </button>
                )}

                {(selectedBadge.category === 'combo' || selectedBadge.category === 'special') && (
                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="w-full btn-secondary py-3 text-xs font-black uppercase tracking-wider"
                  >
                    Fechar
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
