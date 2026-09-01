export interface RankTier {
  level: number;
  title: string;
  subtitle: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  badgeStyle: string;
  cardGradient: string;
  accentColor: string;
}

export const PILOT_RANKS: RankTier[] = [
  {
    level: 1,
    title: 'Piloto Bronze',
    subtitle: 'Iniciante',
    minPoints: 0,
    maxPoints: 500,
    icon: '🥉',
    badgeStyle: 'bg-amber-950/40 text-amber-500 border-amber-800/60',
    cardGradient: 'from-amber-950/30 to-slate-900 border-amber-800/40',
    accentColor: '#d97706'
  },
  {
    level: 2,
    title: 'Piloto Prata',
    subtitle: 'Estradeiro',
    minPoints: 501,
    maxPoints: 2500,
    icon: '🥈',
    badgeStyle: 'bg-slate-800/80 text-slate-200 border-slate-600',
    cardGradient: 'from-slate-800/40 to-slate-900 border-slate-700/60',
    accentColor: '#94a3b8'
  },
  {
    level: 3,
    title: 'Piloto Ouro',
    subtitle: 'Alfa do Asfalto',
    minPoints: 2501,
    maxPoints: 5000,
    icon: '🥇',
    badgeStyle: 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10',
    cardGradient: 'from-amber-500/10 to-slate-900 border-amber-500/30',
    accentColor: '#f59e0b'
  },
  {
    level: 4,
    title: 'Lenda da Estrada',
    subtitle: 'MOTOLEGADO V.I.P',
    minPoints: 5001,
    maxPoints: 10000,
    icon: '👑',
    badgeStyle: 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20',
    cardGradient: 'from-orange-600/20 to-slate-900 border-orange-500/40',
    accentColor: '#ea580c'
  },
  {
    level: 5,
    title: 'Globetrotter',
    subtitle: 'Mestre dos Magos',
    minPoints: 10001,
    maxPoints: 20000,
    icon: '🔮',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/20',
    cardGradient: 'from-purple-900/30 to-slate-900 border-purple-500/40',
    accentColor: '#a855f7'
  }
];

export function calculatePilotRank(points: number) {
  let currentTier = PILOT_RANKS[0];
  let nextTier: RankTier | null = PILOT_RANKS[1];

  for (let i = 0; i < PILOT_RANKS.length; i++) {
    if (points >= PILOT_RANKS[i].minPoints) {
      currentTier = PILOT_RANKS[i];
      nextTier = PILOT_RANKS[i + 1] || null;
    }
  }

  const rangeStart = currentTier.minPoints === 0 ? 0 : currentTier.minPoints - 1;
  const rangeEnd = currentTier.maxPoints;
  const totalRange = rangeEnd - rangeStart;
  const earnedInRange = points - rangeStart;

  let progressPercent = Math.min(100, Math.max(0, (earnedInRange / totalRange) * 100));
  if (points >= 10000) progressPercent = 100;

  const pointsRemaining = nextTier ? nextTier.minPoints - points : 0;

  return {
    currentTier,
    nextTier,
    points,
    progressPercent: Math.round(progressPercent),
    pointsRemaining,
    targetPointsForNextTier: nextTier ? nextTier.minPoints : currentTier.maxPoints
  };
}
