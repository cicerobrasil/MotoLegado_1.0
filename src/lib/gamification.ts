import { MotorcyclistBadge, PointsBreakdown } from '../types';

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
    subtitle: 'Iniciante do Asfalto',
    minPoints: 0,
    maxPoints: 750,
    icon: '🥉',
    badgeStyle: 'bg-amber-950/40 text-amber-500 border-amber-800/60',
    cardGradient: 'from-amber-950/30 to-slate-900 border-amber-800/40',
    accentColor: '#d97706'
  },
  {
    level: 2,
    title: 'Piloto Prata',
    subtitle: 'Estradeiro Ativo',
    minPoints: 751,
    maxPoints: 2500,
    icon: '🥈',
    badgeStyle: 'bg-slate-800/80 text-slate-200 border-slate-600',
    cardGradient: 'from-slate-800/40 to-slate-900 border-slate-700/60',
    accentColor: '#94a3b8'
  },
  {
    level: 3,
    title: 'Piloto Ouro',
    subtitle: 'Alfa das Rodovias',
    minPoints: 2501,
    maxPoints: 6000,
    icon: '🥇',
    badgeStyle: 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10',
    cardGradient: 'from-amber-500/10 to-slate-900 border-amber-500/30',
    accentColor: '#f59e0b'
  },
  {
    level: 4,
    title: 'Lenda da Estrada',
    subtitle: 'Mestre dos Encontros',
    minPoints: 6001,
    maxPoints: 15000,
    icon: '👑',
    badgeStyle: 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20',
    cardGradient: 'from-orange-600/20 to-slate-900 border-orange-500/40',
    accentColor: '#ea580c'
  },
  {
    level: 5,
    title: 'Globetrotter Supremo',
    subtitle: 'Titã MotoLegado V.I.P',
    minPoints: 15001,
    maxPoints: 50000,
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
  const totalRange = Math.max(1, rangeEnd - rangeStart);
  const earnedInRange = Math.max(0, points - rangeStart);

  let progressPercent = Math.min(100, Math.max(0, (earnedInRange / totalRange) * 100));
  if (points >= PILOT_RANKS[PILOT_RANKS.length - 1].minPoints) {
    progressPercent = 100;
  }

  const pointsRemaining = nextTier ? Math.max(0, nextTier.minPoints - points) : 0;

  return {
    currentTier,
    nextTier,
    points,
    progressPercent: Math.round(progressPercent),
    pointsRemaining,
    targetPointsForNextTier: nextTier ? nextTier.minPoints : currentTier.maxPoints
  };
}

/**
 * BADGE DEFINITIONS TEMPLATES
 * Structured specifically around:
 * 1. Mileage (Quilometragem percorrida no asfalto)
 * 2. Events (Eventos e encontros de motociclistas participados)
 * 3. Combo (Quilometragem + Eventos simultâneos)
 * 4. Special (Diário, segurança e condições de pilotagem)
 */
interface BadgeTemplate {
  id: string;
  category: 'mileage' | 'events' | 'combo' | 'special';
  categoryLabel: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: string;
  points: number;
  targetKm?: number;
  targetEvents?: number;
  targetTrips?: number;
  requirement: string;
  unit?: string;
  accentColor?: string;
  specialCheck?: (stats: PilotEvaluationStats) => { unlocked: boolean; current: number; target: number };
}

export const BADGE_TEMPLATES: BadgeTemplate[] = [
  // ==========================================
  // 1. BADGES DE QUILOMETRAGEM (MILEAGE)
  // ==========================================
  {
    id: 'km_100',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Batismo do Asfalto',
    subtitle: '100 KM Rodados',
    desc: 'Primeiros 100km gravados no diário. O asfalto agora corre oficialmente nas veias.',
    icon: '🛵',
    points: 100,
    targetKm: 100,
    requirement: 'Acumular 100 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-amber-600 to-orange-500'
  },
  {
    id: 'km_500',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Desbravador Regional',
    subtitle: '500 KM Rodados',
    desc: '500km rodados cruzando cidades, serras e vales da sua região.',
    icon: '🏍️',
    points: 200,
    targetKm: 500,
    requirement: 'Acumular 500 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-orange-600 to-amber-500'
  },
  {
    id: 'km_1000',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Milheiro do Asfalto',
    subtitle: '1.000 KM Rodados',
    desc: '1.000km de pura estrada. A moto, a mente e o horizonte em perfeita sintonia.',
    icon: '🛣️',
    points: 350,
    targetKm: 1000,
    requirement: 'Acumular 1.000 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-yellow-500 to-amber-600'
  },
  {
    id: 'km_2500',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Cruzador Interestadual',
    subtitle: '2.500 KM Rodados',
    desc: '2.500km rodados cruzando divisas de estados com autonomia e precisão mecânica.',
    icon: '🗺️',
    points: 500,
    targetKm: 2500,
    requirement: 'Acumular 2.500 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-teal-500 to-emerald-600'
  },
  {
    id: 'km_5000',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Guerreiro das Rodovias',
    subtitle: '5.000 KM Rodados',
    desc: '5.000km de expedição e asfalto bruto. Respeito conquistado em qualquer posto ou parada.',
    icon: '🏔️',
    points: 750,
    targetKm: 5000,
    requirement: 'Acumular 5.000 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 'km_10000',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Lenda das Estradas',
    subtitle: '10.000 KM Rodados',
    desc: '10.000km rodados no diário. Quilometragem de veterano que já viu de tudo sobre duas rodas.',
    icon: '👑',
    points: 1200,
    targetKm: 10000,
    requirement: 'Acumular 10.000 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'km_25000',
    category: 'mileage',
    categoryLabel: 'Quilometragem',
    title: 'Globetrotter Supremo',
    subtitle: '25.000 KM Rodados',
    desc: '25.000km de asfalto, serra, terra e litoral. O mais alto patamar de rodagem do MotoLegado.',
    icon: '🌎',
    points: 2500,
    targetKm: 25000,
    requirement: 'Acumular 25.000 km em viagens no diário',
    unit: 'KM',
    accentColor: 'from-amber-400 via-rose-500 to-purple-600'
  },

  // ==========================================
  // 2. BADGES DE EVENTOS (EVENT ATTENDANCE)
  // ==========================================
  {
    id: 'evt_1',
    category: 'events',
    categoryLabel: 'Eventos & Encontros',
    title: 'Presença Confirmada',
    subtitle: '1º Evento Oficial',
    desc: 'Primeiro check-in confirmado em encontro, festival ou rally de motociclistas.',
    icon: '🎟️',
    points: 150,
    targetEvents: 1,
    requirement: 'Fazer check-in em 1 evento oficial',
    unit: 'Evento',
    accentColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 'evt_3',
    category: 'events',
    categoryLabel: 'Eventos & Encontros',
    title: 'Espírito de Comboio',
    subtitle: '3 Eventos Participados',
    desc: '3 encontros no currículo. A irmandade e o ronco coletivo dos motores chamam.',
    icon: '🤝',
    points: 300,
    targetEvents: 3,
    requirement: 'Fazer check-in em 3 eventos oficiais',
    unit: 'Eventos',
    accentColor: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'evt_5',
    category: 'events',
    categoryLabel: 'Eventos & Encontros',
    title: 'Rato de Encontro',
    subtitle: '5 Eventos Participados',
    desc: '5 encontros confirmados. Conhece os melhores palcos de rock, food trucks e barracas de camping.',
    icon: '🎪',
    points: 500,
    targetEvents: 5,
    requirement: 'Fazer check-in em 5 eventos oficiais',
    unit: 'Eventos',
    accentColor: 'from-purple-600 to-pink-600'
  },
  {
    id: 'evt_10',
    category: 'events',
    categoryLabel: 'Eventos & Encontros',
    title: 'Embaixador dos Moto Clubes',
    subtitle: '10 Eventos Participados',
    desc: '10 eventos participados. Figura conhecida e respeitada pelos esquadrões e MCs da região.',
    icon: '🛡️',
    points: 800,
    targetEvents: 10,
    requirement: 'Fazer check-in em 10 eventos oficiais',
    unit: 'Eventos',
    accentColor: 'from-rose-600 to-orange-600'
  },
  {
    id: 'evt_20',
    category: 'events',
    categoryLabel: 'Eventos & Encontros',
    title: 'Mestre dos Festivais & Rallies',
    subtitle: '20 Eventos Participados',
    desc: '20 eventos com check-in. Histórico lendário de presença nos maiores encontros motociclísticos.',
    icon: '🏆',
    points: 1500,
    targetEvents: 20,
    requirement: 'Fazer check-in em 20 eventos oficiais',
    unit: 'Eventos',
    accentColor: 'from-amber-400 via-orange-500 to-rose-600'
  },

  // ==========================================
  // 3. BADGES COMBOS (KM + EVENTOS SIMULTÂNEOS)
  // ==========================================
  {
    id: 'combo_pilgrim',
    category: 'combo',
    categoryLabel: 'Combos de Estrada',
    title: 'Peregrino do Asfalto',
    subtitle: '500 KM + 2 Eventos',
    desc: 'Roda longas distâncias e não perde a oportunidade de confraternizar com a irmandade.',
    icon: '🧭',
    points: 400,
    targetKm: 500,
    targetEvents: 2,
    requirement: '500 km rodados + 2 eventos confirmados',
    unit: 'Desafio',
    accentColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'combo_ironbutt',
    category: 'combo',
    categoryLabel: 'Combos de Estrada',
    title: 'Cavaleiro de Ferro',
    subtitle: '1.500 KM + 3 Eventos',
    desc: 'Resistência de ferro nos trechos de rodovia combinada com presença marcante nos encontros.',
    icon: '⚡',
    points: 650,
    targetKm: 1500,
    targetEvents: 3,
    requirement: '1.500 km rodados + 3 eventos confirmados',
    unit: 'Desafio',
    accentColor: 'from-orange-500 to-amber-500'
  },
  {
    id: 'combo_veteran',
    category: 'combo',
    categoryLabel: 'Combos de Estrada',
    title: 'Alfa da Irmandade',
    subtitle: '5.000 KM + 5 Eventos',
    desc: 'Grande quilometragem acumulada somada a participação assídua nos maiores encontros.',
    icon: '🦅',
    points: 1000,
    targetKm: 5000,
    targetEvents: 5,
    requirement: '5.000 km rodados + 5 eventos confirmados',
    unit: 'Desafio',
    accentColor: 'from-amber-500 via-rose-500 to-purple-600'
  },
  {
    id: 'combo_titan',
    category: 'combo',
    categoryLabel: 'Combos de Estrada',
    title: 'Titã MotoLegado',
    subtitle: '10.000 KM + 10 Eventos',
    desc: 'A síntese do motociclista de verdade: quilometragem imensa e compromisso com a cultura das duas rodas.',
    icon: '🌟',
    points: 2000,
    targetKm: 10000,
    targetEvents: 10,
    requirement: '10.000 km rodados + 10 eventos confirmados',
    unit: 'Desafio',
    accentColor: 'from-yellow-400 via-amber-500 to-red-600'
  },

  // ==========================================
  // 4. BADGES ESPECIAIS & SEGURANÇA
  // ==========================================
  {
    id: 'spec_first_log',
    category: 'special',
    categoryLabel: 'Especial',
    title: 'Primeiro Registro de Bordo',
    subtitle: '1ª Viagem Documentada',
    desc: 'História gravada no diário de bordo com dados mecânicos, fotos e rota detalhada.',
    icon: '📖',
    points: 100,
    targetTrips: 1,
    requirement: 'Registrar pelo menos 1 viagem no diário',
    unit: 'Viagem',
    accentColor: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'spec_checklist_master',
    category: 'special',
    categoryLabel: 'Especial',
    title: 'Guardião do Asfalto',
    subtitle: 'Checklist Pré-Viagem',
    desc: 'Segurança em 1º lugar: conferiu documentos, pneus, relação e ferramentas antes de partir.',
    icon: '🔧',
    points: 150,
    requirement: 'Completar o checklist de segurança pré-viagem',
    unit: 'Segurança',
    accentColor: 'from-emerald-500 to-teal-500',
    specialCheck: (stats) => {
      const isCompleted = stats.checklistCompleted || stats.tripsCount >= 1;
      return {
        unlocked: isCompleted,
        current: isCompleted ? 1 : 0,
        target: 1
      };
    }
  },
  {
    id: 'spec_rain_rider',
    category: 'special',
    categoryLabel: 'Especial',
    title: 'Chuva é Só Água',
    subtitle: 'Pilotagem na Chuva',
    desc: 'Encarou a rodovia sob tempo chuvoso com cautela, capa de chuva e aderência firme.',
    icon: '🌧️',
    points: 250,
    requirement: 'Registrar viagem sob condição de chuva no diário',
    unit: 'Clima',
    accentColor: 'from-cyan-600 to-blue-700',
    specialCheck: (stats) => {
      const hasRainTrip = stats.rainTripsCount > 0;
      return {
        unlocked: hasRainTrip,
        current: stats.rainTripsCount,
        target: 1
      };
    }
  },
  {
    id: 'spec_night_rider',
    category: 'special',
    categoryLabel: 'Especial',
    title: 'Coruja Noturna',
    subtitle: 'Pilotagem Noturna',
    desc: 'Cruzou o asfalto na calada da noite com viseira cristal e faróis cortando a neblina.',
    icon: '🌃',
    points: 200,
    requirement: 'Registrar viagem ou retorno noturno',
    unit: 'Noturno',
    accentColor: 'from-indigo-700 to-purple-800',
    specialCheck: (stats) => {
      const hasNightTrip = stats.nightTripsCount > 0 || stats.totalKm >= 500;
      return {
        unlocked: hasNightTrip,
        current: hasNightTrip ? 1 : 0,
        target: 1
      };
    }
  }
];

export interface PilotEvaluationStats {
  totalKm: number;
  eventsCount: number;
  tripsCount: number;
  rainTripsCount: number;
  nightTripsCount: number;
  checklistCompleted: boolean;
  logs?: any[];
  events?: any[];
}

/**
 * Evaluates all badges against the pilot's live stats
 */
export function evaluateMotorcyclistBadges(stats: PilotEvaluationStats): MotorcyclistBadge[] {
  return BADGE_TEMPLATES.map(template => {
    let unlocked = false;
    let currentValue = 0;
    let targetValue = 1;
    let progressPercent = 0;

    if (template.specialCheck) {
      const res = template.specialCheck(stats);
      unlocked = res.unlocked;
      currentValue = res.current;
      targetValue = res.target;
      progressPercent = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : (unlocked ? 100 : 0);
    } else if (template.category === 'mileage' && template.targetKm) {
      targetValue = template.targetKm;
      currentValue = stats.totalKm;
      unlocked = stats.totalKm >= template.targetKm;
      progressPercent = Math.min(100, Math.round((stats.totalKm / template.targetKm) * 100));
    } else if (template.category === 'events' && template.targetEvents) {
      targetValue = template.targetEvents;
      currentValue = stats.eventsCount;
      unlocked = stats.eventsCount >= template.targetEvents;
      progressPercent = Math.min(100, Math.round((stats.eventsCount / template.targetEvents) * 100));
    } else if (template.category === 'combo') {
      const reqKm = template.targetKm || 0;
      const reqEvt = template.targetEvents || 0;
      const kmRatio = reqKm > 0 ? Math.min(1, stats.totalKm / reqKm) : 1;
      const evtRatio = reqEvt > 0 ? Math.min(1, stats.eventsCount / reqEvt) : 1;
      
      unlocked = stats.totalKm >= reqKm && stats.eventsCount >= reqEvt;
      // Combined progress average
      progressPercent = Math.min(100, Math.round(((kmRatio + evtRatio) / 2) * 100));
      currentValue = stats.eventsCount;
      targetValue = reqEvt;
    } else if (template.targetTrips) {
      targetValue = template.targetTrips;
      currentValue = stats.tripsCount;
      unlocked = stats.tripsCount >= template.targetTrips;
      progressPercent = Math.min(100, Math.round((stats.tripsCount / template.targetTrips) * 100));
    }

    return {
      id: template.id,
      category: template.category,
      categoryLabel: template.categoryLabel,
      title: template.title,
      subtitle: template.subtitle,
      desc: template.desc,
      icon: template.icon,
      points: template.points,
      unlocked,
      unlockedDate: unlocked ? 'Conquistado' : undefined,
      targetKm: template.targetKm,
      targetEvents: template.targetEvents,
      targetTrips: template.targetTrips,
      currentValue,
      targetValue,
      progressPercent,
      requirement: template.requirement,
      unit: template.unit,
      accentColor: template.accentColor
    };
  });
}

/**
 * Calculates official motorcyclist points breakdown
 * 1 KM = 1 Point
 * 1 Event Check-in = 150 Points
 * 1 Logbook Trip = 100 Points
 * Unlocked Badges = + Points awarded by each badge
 */
export function calculateMotorcyclistPoints(
  stats: PilotEvaluationStats, 
  evaluatedBadges: MotorcyclistBadge[]
): PointsBreakdown {
  const kmPoints = Math.round(stats.totalKm * 1);
  const eventPoints = stats.eventsCount * 150;
  const tripPoints = stats.tripsCount * 100;
  
  const unlockedBadges = evaluatedBadges.filter(b => b.unlocked);
  const badgePoints = unlockedBadges.reduce((acc, curr) => acc + curr.points, 0);
  
  const bonusPoints = stats.checklistCompleted ? 50 : 0;
  const totalPoints = kmPoints + eventPoints + tripPoints + badgePoints + bonusPoints;

  return {
    kmPoints,
    eventPoints,
    tripPoints,
    badgePoints,
    bonusPoints,
    totalPoints,
    totalKm: stats.totalKm,
    eventsCount: stats.eventsCount,
    tripsCount: stats.tripsCount,
    unlockedBadgesCount: unlockedBadges.length,
    totalBadgesCount: evaluatedBadges.length
  };
}

/**
 * Central Live Gamification Engine
 * Reads localStorage state (or receives explicit arrays) and evaluates everything.
 */
export function getPilotLiveGamification(customLogs?: any[], customEvents?: any[]) {
  let logs: any[] = [];
  let events: any[] = [];

  if (customLogs && Array.isArray(customLogs)) {
    logs = customLogs;
  } else {
    try {
      const saved = localStorage.getItem('motolegado_logs');
      if (saved) logs = JSON.parse(saved);
    } catch (e) {
      logs = [];
    }
  }

  if (customEvents && Array.isArray(customEvents)) {
    events = customEvents;
  } else {
    try {
      const saved = localStorage.getItem('motolegado_events');
      if (saved) events = JSON.parse(saved);
    } catch (e) {
      events = [];
    }
  }

  // Calculate total KM from trips
  const totalKm = logs.reduce((acc, curr) => {
    const val = parseInt(curr.distance || curr.distance_km || '0', 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  // Filter checked in events
  const checkedInEvents = events.filter(evt => !!evt.checkedIn);
  const eventsCount = checkedInEvents.length;
  const tripsCount = logs.length;

  // Rain trips & night trips count
  const rainTripsCount = logs.filter(l => 
    l.climate === 'rain' || 
    l.climate === 'chuva' || 
    (typeof l.content === 'string' && l.content.toLowerCase().includes('chuva'))
  ).length;

  const nightTripsCount = logs.filter(l => 
    l.climate === 'night' || 
    (typeof l.title === 'string' && l.title.toLowerCase().includes('noturn')) ||
    (typeof l.content === 'string' && l.content.toLowerCase().includes('noite'))
  ).length;

  // Check if checklist has items
  let checklistCompleted = false;
  try {
    const savedChecklist = localStorage.getItem('motolegado_trip_checklist_v1');
    if (savedChecklist) {
      const items = JSON.parse(savedChecklist);
      if (Array.isArray(items) && items.length > 0) {
        checklistCompleted = items.filter((i: any) => i.isRequired).every((i: any) => i.completed);
      }
    }
  } catch (e) {
    checklistCompleted = false;
  }

  const evaluationStats: PilotEvaluationStats = {
    totalKm,
    eventsCount,
    tripsCount,
    rainTripsCount,
    nightTripsCount,
    checklistCompleted,
    logs,
    events
  };

  const badges = evaluateMotorcyclistBadges(evaluationStats);
  const pointsBreakdown = calculateMotorcyclistPoints(evaluationStats, badges);
  const rankInfo = calculatePilotRank(pointsBreakdown.totalPoints);

  // Update cached points in localStorage for instant sync across tabs
  try {
    localStorage.setItem('motolegado_live_points', pointsBreakdown.totalPoints.toString());
    localStorage.setItem('motolegado_live_tier', rankInfo.currentTier.title);
  } catch (e) {
    // Ignore storage quota
  }

  return {
    stats: evaluationStats,
    badges,
    pointsBreakdown,
    rankInfo
  };
}
