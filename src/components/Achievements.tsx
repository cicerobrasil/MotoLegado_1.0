import { useAuth } from '../context/AuthContext';
import { calculatePilotRank, PILOT_RANKS } from '../lib/gamification';
import { motion } from 'motion/react';
import { Award, Star, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface AchievementItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  points: number;
  category: 'estrada' | 'comunidade' | 'resistencia' | 'prestigio';
  requiredPoints?: number;
}

export const ACHIEVEMENTS_LIST: AchievementItem[] = [
  { id: 'intl_trip', icon: "🌎", title: "Viagem Internacional", desc: "Expedição cruzando fronteiras da América do Sul", points: 500, category: 'estrada', requiredPoints: 3000 },
  { id: 'state_trip', icon: "🛣️", title: "Viagem Interestadual", desc: "Pilotagem cruzando divisas estaduais no Brasil", points: 250, category: 'estrada', requiredPoints: 1000 },
  { id: 'mountain_alpha', icon: "🏔️", title: "Alfa da Montanha", desc: "Subidas de serra e pilotagem em altitude superior a 1.200m", points: 250, category: 'estrada', requiredPoints: 1500 },
  { id: 'steady_pace', icon: "🏎️", title: "Velocidade Constante", desc: "Viagem com pilotagem fluida e paradas pontuais", points: 100, category: 'resistencia', requiredPoints: 500 },
  { id: 'brotherhood', icon: "🤝", title: "Irmão de Estrada", desc: "Solidariedade e apoio a motociclistas na rodovia", points: 500, category: 'comunidade', requiredPoints: 2000 },
  { id: 'rain_rider', icon: "🌧️", title: "Chuva é Só Água", desc: "Mais de 200km rodados com segurança sob chuva", points: 300, category: 'resistencia', requiredPoints: 1200 },
  { id: 'night_owl', icon: "🌃", title: "Coruja Noturna", desc: "Expedições e retorno noturno com iluminação segura", points: 200, category: 'resistencia', requiredPoints: 800 },
  { id: 'fuel_master', icon: "⛽", title: "Piloto Econômico", desc: "Alta eficiência e autonomia em longos trajetos", points: 150, category: 'resistencia', requiredPoints: 600 },
  { id: 'club_founder', icon: "🛡️", title: "Líder de Esquadrão", desc: "Fundador ou oficial ativo em Moto Clube registrado", points: 400, category: 'prestigio', requiredPoints: 2500 },
  { id: 'legend_road', icon: "👑", title: "Lenda Viva do Asfalto", desc: "Alcançou o prestígio máximo na rede MotoLegado", points: 1000, category: 'prestigio', requiredPoints: 5000 },
];

export function Achievements() {
  const { profile } = useAuth();
  const pilotPoints = profile?.points || 0;
  const rank = calculatePilotRank(pilotPoints);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="border-b border-slate-800 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-widest mb-3">
            <Sparkles size={12} />
            <span>Sistema Oficial de Conquistas & Patentes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            CONQUISTAS <span className="text-orange-500">MOTOLEGADO</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Ganhe pontos registrando viagens no diário de bordo, avaliando roteiros e participando de eventos.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 px-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
            {rank.currentTier.icon}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Seu Nível Atual</div>
            <div className="text-sm font-black italic uppercase text-white flex items-center gap-1.5">
              <span>{rank.currentTier.title}</span>
              <span className="text-orange-500">({pilotPoints} pts)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Current Rank Banner & Progress */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">Progresso de Patente</span>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white">
                Rumo a {rank.nextTier ? rank.nextTier.title : 'Nível Máximo Alcançado'}
              </h2>
            </div>
            {rank.nextTier && (
              <span className="text-xs font-bold text-slate-400">
                Faltam <strong className="text-orange-400 font-black">{rank.pointsRemaining} pts</strong> para o próximo nível
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rank.progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(234,88,12,0.5)]"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
            <span>{rank.currentTier.title} ({rank.currentTier.minPoints} pts)</span>
            <span>{rank.progressPercent}% completo</span>
            <span>{rank.nextTier ? `${rank.nextTier.title} (${rank.nextTier.minPoints} pts)` : 'Patente Máxima'}</span>
          </div>
        </div>
      </div>

      {/* Grid of Ranks */}
      <div>
        <h3 className="text-lg font-black italic uppercase text-white tracking-tight mb-4 flex items-center gap-2">
          <Award size={18} className="text-orange-500" />
          <span>Patentes Oficiais do Motociclista</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {PILOT_RANKS.map((tier) => {
            const isCurrent = rank.currentTier.level === tier.level;
            const isUnlocked = pilotPoints >= tier.minPoints;

            return (
              <div
                key={tier.level}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/15 scale-[1.02]'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{tier.icon}</div>
                <div className="text-xs font-black uppercase italic text-white flex items-center justify-between">
                  <span>{tier.title}</span>
                  {isUnlocked && <ShieldCheck size={14} className="text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{tier.subtitle}</div>
                <div className="text-[10px] font-bold text-orange-400 mt-3">
                  {tier.minPoints} a {tier.maxPoints} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div>
        <h3 className="text-lg font-black italic uppercase text-white tracking-tight mb-4 flex items-center gap-2">
          <Star size={18} className="text-orange-500" />
          <span>Medalhas & Missões de Estrada</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ACHIEVEMENTS_LIST.map((badge, i) => {
            const isUnlocked = (badge.requiredPoints && pilotPoints >= badge.requiredPoints);

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                key={badge.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between group ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-orange-500/40 hover:border-orange-500 shadow-lg shadow-orange-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 ${isUnlocked ? '' : 'grayscale opacity-60'}`}>
                      {badge.icon}
                    </span>
                    {isUnlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase flex items-center gap-1">
                        <ShieldCheck size={10} /> Conquistado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 text-[9px] font-bold uppercase tracking-wider">
                        Em Progresso
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black italic uppercase tracking-tight text-white mb-1.5">
                    {badge.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4">
                    {badge.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-orange-400">
                    +{badge.points} PTS
                  </span>
                  <Link
                    to="/logbook"
                    className="text-[10px] font-bold uppercase text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Registrar <ChevronRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
