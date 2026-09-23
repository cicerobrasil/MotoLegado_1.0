import { LeaderboardPilot, RankingSortBy, RankingPeriod } from '../types';

export const SEEDED_COMMUNITY_PILOTS: Omit<LeaderboardPilot, 'rank'>[] = [
  {
    id: 'pilot-carlos-trovao',
    name: "Carlos 'Trovão' Silveira",
    handle: '@carlos_trovao',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Abutres MC',
    clubRole: 'Diretor de Estrada',
    motorcycle: 'BMW R1250 GS Adventure',
    city: 'São Paulo',
    state: 'SP',
    totalPoints: 28450,
    totalKm: 24500,
    eventsCount: 22,
    tripsCount: 38,
    badgesCount: 12,
    tierTitle: 'Globetrotter Supremo',
    tierIcon: '🔮',
    tierAccent: '#a855f7',
    highlightBadge: 'Centurião da Estrada (10.000 km)',
    isVerified: true,
    isPro: true,
    bio: 'Mais de 15 anos cortando as rodovias do Brasil e América do Sul. A estrada é meu templo e o ronco do boxer é a oração.',
    joinedYear: 2021,
    pointsTrend: 'up',
    rankChange: 0,
  },
  {
    id: 'pilot-marcos-sombra',
    name: "Marcos 'Sombra' Albuquerque",
    handle: '@sombra_sc',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Bodes do Asfalto',
    clubRole: 'Irmão Veterano',
    motorcycle: 'Harley-Davidson Ultra Limited',
    city: 'Florianópolis',
    state: 'SC',
    totalPoints: 22100,
    totalKm: 19800,
    eventsCount: 18,
    tripsCount: 29,
    badgesCount: 11,
    tierTitle: 'Globetrotter Supremo',
    tierIcon: '🔮',
    tierAccent: '#a855f7',
    highlightBadge: 'Cavaleiro de Ferro (20.000 km)',
    isVerified: true,
    isPro: true,
    bio: 'Cruiser raiz. Faço da BR-101 e da Serra do Rio do Rastro o meu quintal de fim de semana.',
    joinedYear: 2022,
    pointsTrend: 'same',
    rankChange: 0,
  },
  {
    id: 'pilot-renata-valquiria',
    name: "Renata 'Valquíria' Duarte",
    handle: '@renata_valquiria',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Asfalto Livre MC',
    clubRole: 'Capitã de Rota',
    motorcycle: 'Triumph Tiger 900 Rally Pro',
    city: 'Belo Horizonte',
    state: 'MG',
    totalPoints: 18900,
    totalKm: 17200,
    eventsCount: 15,
    tripsCount: 24,
    badgesCount: 10,
    tierTitle: 'Globetrotter Supremo',
    tierIcon: '🔮',
    tierAccent: '#a855f7',
    highlightBadge: 'Devorador de Rodovias (2.500 km)',
    isVerified: true,
    isPro: true,
    bio: 'Big Trail apaixonada por estradas de terra, serras mineiras e expedições até a Patagônia.',
    joinedYear: 2022,
    pointsTrend: 'up',
    rankChange: 1,
  },
  {
    id: 'pilot-eduardo-barba',
    name: "Eduardo 'Barba' Castilho",
    handle: '@barba_curitiba',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Insanos MC',
    clubRole: 'Membro Efetivo',
    motorcycle: 'Indian Challenger Dark Horse',
    city: 'Curitiba',
    state: 'PR',
    totalPoints: 15600,
    totalKm: 14100,
    eventsCount: 14,
    tripsCount: 21,
    badgesCount: 9,
    tierTitle: 'Globetrotter Supremo',
    tierIcon: '🔮',
    tierAccent: '#a855f7',
    highlightBadge: 'Presença Lendária (10 Eventos)',
    isVerified: true,
    isPro: false,
    bio: 'Heavy metal no fone, motor V-Twin roncando e a Graciosa descendo no ponto.',
    joinedYear: 2023,
    pointsTrend: 'down',
    rankChange: -1,
  },
  {
    id: 'pilot-rodrigo-gaviao',
    name: "Rodrigo 'Gavião' Mendes",
    handle: '@gaviao_mendes',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Rota 101 MC',
    clubRole: 'Fundador',
    motorcycle: 'Yamaha Super Ténéré 1200',
    city: 'Joinville',
    state: 'SC',
    totalPoints: 12800,
    totalKm: 11500,
    eventsCount: 12,
    tripsCount: 19,
    badgesCount: 9,
    tierTitle: 'Lenda da Estrada',
    tierIcon: '👑',
    tierAccent: '#ea580c',
    highlightBadge: 'Transcontinental (5.000 km)',
    isVerified: true,
    isPro: true,
    bio: 'Piloto de longas distâncias sem parada. Navegação precisa e relatos no diário de bordo.',
    joinedYear: 2023,
    pointsTrend: 'up',
    rankChange: 2,
  },
  {
    id: 'pilot-vanessa-pantera',
    name: "Vanessa 'Pantera' Lima",
    handle: '@pantera_rio',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Mulheres do Asfalto',
    clubRole: 'Vice-Presidente',
    motorcycle: 'Ducati Multistrada V4S',
    city: 'Rio de Janeiro',
    state: 'RJ',
    totalPoints: 10450,
    totalKm: 9600,
    eventsCount: 11,
    tripsCount: 16,
    badgesCount: 8,
    tierTitle: 'Lenda da Estrada',
    tierIcon: '👑',
    tierAccent: '#ea580c',
    highlightBadge: 'Embaixador dos Encontros',
    isVerified: true,
    isPro: true,
    bio: 'Velocidade com responsabilidade. Rio x Santos todo primeiro sábado do mês.',
    joinedYear: 2023,
    pointsTrend: 'same',
    rankChange: 0,
  },
  {
    id: 'pilot-sergio-coyote',
    name: "Sérgio 'Coyote' Antunes",
    handle: '@coyote_antunes',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Independente',
    clubRole: 'Lobo Solitário',
    motorcycle: 'Honda Africa Twin 1100',
    city: 'Campinas',
    state: 'SP',
    totalPoints: 8920,
    totalKm: 8200,
    eventsCount: 9,
    tripsCount: 14,
    badgesCount: 7,
    tierTitle: 'Lenda da Estrada',
    tierIcon: '👑',
    tierAccent: '#ea580c',
    highlightBadge: 'Milheiro do Asfalto (1.000 km)',
    isVerified: false,
    isPro: false,
    bio: 'Sem brasão no colete, mas com o coração cheio de poeira e respeito por todos os irmãos.',
    joinedYear: 2024,
    pointsTrend: 'up',
    rankChange: 1,
  },
  {
    id: 'pilot-felipe-centauro',
    name: "Felipe 'Centauro' Nogueira",
    handle: '@centauro_sul',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Custom Brotherhood',
    clubRole: 'Integrante',
    motorcycle: 'Royal Enfield Continental GT 650',
    city: 'Porto Alegre',
    state: 'RS',
    totalPoints: 6750,
    totalKm: 6100,
    eventsCount: 7,
    tripsCount: 11,
    badgesCount: 6,
    tierTitle: 'Lenda da Estrada',
    tierIcon: '👑',
    tierAccent: '#ea580c',
    highlightBadge: 'Roda Presa Jamais (500 km)',
    isVerified: false,
    isPro: true,
    bio: 'Café racer, jaqueta de couro e estradas da serra gaúcha. O clássico nunca morre.',
    joinedYear: 2024,
    pointsTrend: 'down',
    rankChange: -1,
  },
  {
    id: 'pilot-juliano-machado',
    name: "Juliano 'Machado' Ribeiro",
    handle: '@machado_go',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Guardiões da Estrada',
    clubRole: 'Sargento de Armas',
    motorcycle: 'Kawasaki Versys 1000',
    city: 'Goiânia',
    state: 'GO',
    totalPoints: 5400,
    totalKm: 4800,
    eventsCount: 6,
    tripsCount: 9,
    badgesCount: 5,
    tierTitle: 'Piloto Ouro',
    tierIcon: '🥇',
    tierAccent: '#f59e0b',
    highlightBadge: 'Irmandade Ativa (3 Eventos)',
    isVerified: true,
    isPro: false,
    bio: 'Asfalto do Centro-Oeste ao litoral. Respeito, disciplina e lealdade na rodovia.',
    joinedYear: 2024,
    pointsTrend: 'same',
    rankChange: 0,
  },
  {
    id: 'pilot-patricia-tempestade',
    name: "Patrícia 'Tempestade' Rocha",
    handle: '@paty_tempestade',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Rota do Sol MC',
    clubRole: 'Tesoureira',
    motorcycle: 'BMW F850 GS',
    city: 'Salvador',
    state: 'BA',
    totalPoints: 4150,
    totalKm: 3600,
    eventsCount: 5,
    tripsCount: 7,
    badgesCount: 5,
    tierTitle: 'Piloto Ouro',
    tierIcon: '🥇',
    tierAccent: '#f59e0b',
    highlightBadge: 'Batismo de Pista',
    isVerified: true,
    isPro: true,
    bio: 'Linha Verde até Sergipe é meu trajeto sagrado. Sempre pronta para acelerar.',
    joinedYear: 2024,
    pointsTrend: 'up',
    rankChange: 2,
  },
  {
    id: 'pilot-alexandre-braga',
    name: "Alexandre 'Vagabundo' Braga",
    handle: '@braga_fatboy',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Caveiras do Asfalto',
    clubRole: 'Integrante',
    motorcycle: 'Harley-Davidson Fat Boy 114',
    city: 'Santos',
    state: 'SP',
    totalPoints: 3200,
    totalKm: 2750,
    eventsCount: 4,
    tripsCount: 5,
    badgesCount: 4,
    tierTitle: 'Piloto Ouro',
    tierIcon: '🥇',
    tierAccent: '#f59e0b',
    highlightBadge: 'Primeira Partida (100 km)',
    isVerified: false,
    isPro: false,
    bio: 'Subida e descida da Imigrantes na madrugada. Puro metal e escape esportivo.',
    joinedYear: 2025,
    pointsTrend: 'same',
    rankChange: 0,
  },
  {
    id: 'pilot-diego-mattos',
    name: "Diego 'Falcão' Mattos",
    handle: '@falcao_mattos',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Rota das Serras',
    clubRole: 'Próspero',
    motorcycle: 'Suzuki V-Strom 1050',
    city: 'Caxias do Sul',
    state: 'RS',
    totalPoints: 2100,
    totalKm: 1800,
    eventsCount: 3,
    tripsCount: 4,
    badgesCount: 3,
    tierTitle: 'Piloto Prata',
    tierIcon: '🥈',
    tierAccent: '#94a3b8',
    highlightBadge: 'Irmandade Ativa',
    isVerified: false,
    isPro: false,
    bio: 'Curvas da Serra e frio no peito. O melhor da vida é estar sobre duas rodas.',
    joinedYear: 2025,
    pointsTrend: 'up',
    rankChange: 1,
  },
  {
    id: 'pilot-tiago-pires',
    name: "Tiago 'Lobo Guará' Pires",
    handle: '@lobo_pires',
    avatar: 'https://images.unsplash.com/photo-1520409364224-63400afe26e5?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Cerrado Moto Clube',
    clubRole: 'Integrante',
    motorcycle: 'Triumph Bonneville T120',
    city: 'Brasília',
    state: 'DF',
    totalPoints: 1450,
    totalKm: 1200,
    eventsCount: 2,
    tripsCount: 3,
    badgesCount: 2,
    tierTitle: 'Piloto Prata',
    tierIcon: '🥈',
    tierAccent: '#94a3b8',
    highlightBadge: 'Diário de Bordo Ativo',
    isVerified: false,
    isPro: false,
    bio: 'Eixo Monumental ao entardecer e viagens de fim de semana para Pirenópolis e Chapada.',
    joinedYear: 2025,
    pointsTrend: 'same',
    rankChange: 0,
  },
  {
    id: 'pilot-luciana-souza',
    name: "Luciana 'Gaivota' Souza",
    handle: '@gaivota_es',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=250',
    motoClub: 'Ases do Asfalto',
    clubRole: 'Integrante',
    motorcycle: 'Honda CB 500X',
    city: 'Vitória',
    state: 'ES',
    totalPoints: 850,
    totalKm: 700,
    eventsCount: 1,
    tripsCount: 2,
    badgesCount: 2,
    tierTitle: 'Piloto Prata',
    tierIcon: '🥈',
    tierAccent: '#94a3b8',
    highlightBadge: 'Primeira Partida',
    isVerified: false,
    isPro: false,
    bio: 'Começando a rodar firme agora! Cada quilômetro é uma conquista libertadora.',
    joinedYear: 2026,
    pointsTrend: 'up',
    rankChange: 3,
  }
];

export interface BuildRankingOptions {
  currentPilot?: {
    name?: string;
    handle?: string;
    avatar?: string;
    motoClub?: string;
    motorcycle?: string;
    city?: string;
    state?: string;
    totalPoints: number;
    totalKm: number;
    eventsCount: number;
    tripsCount: number;
    badgesCount: number;
    tierTitle: string;
    tierIcon: string;
    tierAccent: string;
    isPro?: boolean;
    bio?: string;
  };
  sortBy?: RankingSortBy;
  period?: RankingPeriod;
  stateFilter?: string;
  clubFilter?: string;
  searchQuery?: string;
}

export function buildGlobalRanking(options: BuildRankingOptions): {
  leaderboard: LeaderboardPilot[];
  currentUserPosition: number | null;
  currentUserPilot: LeaderboardPilot | null;
  totalPilotsCount: number;
} {
  const {
    currentPilot,
    sortBy = 'points',
    period = 'all',
    stateFilter = 'todos',
    clubFilter = 'todos',
    searchQuery = ''
  } = options;

  // Clone community pilots
  let pilotsList: Omit<LeaderboardPilot, 'rank'>[] = [...SEEDED_COMMUNITY_PILOTS];

  // Insert or update current user
  if (currentPilot) {
    const userPilot: Omit<LeaderboardPilot, 'rank'> = {
      id: 'current-user-pilot',
      name: currentPilot.name || 'Você (Piloto MotoLegado)',
      handle: currentPilot.handle || '@meupiloto',
      avatar: currentPilot.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=250',
      motoClub: currentPilot.motoClub || 'Independente',
      clubRole: 'Piloto Oficial',
      motorcycle: currentPilot.motorcycle || 'Minha Moto',
      city: currentPilot.city || 'Joinville',
      state: currentPilot.state || 'SC',
      totalPoints: currentPilot.totalPoints,
      totalKm: currentPilot.totalKm,
      eventsCount: currentPilot.eventsCount,
      tripsCount: currentPilot.tripsCount,
      badgesCount: currentPilot.badgesCount,
      tierTitle: currentPilot.tierTitle,
      tierIcon: currentPilot.tierIcon,
      tierAccent: currentPilot.tierAccent,
      isCurrentUser: true,
      highlightBadge: currentPilot.badgesCount > 0 ? `${currentPilot.badgesCount} Badges Ativas` : 'Em Jornada',
      isVerified: true,
      isPro: currentPilot.isPro,
      bio: currentPilot.bio || 'Piloto cadastrado no MotoLegado acumulando quilômetros e histórias no asfalto.',
      joinedYear: 2026,
      pointsTrend: 'up',
      rankChange: 0,
    };

    // Remove any existing user pilot and push fresh
    pilotsList = pilotsList.filter(p => p.id !== 'current-user-pilot');
    pilotsList.push(userPilot);
  }

  // Adjust metrics based on period filter if applicable
  const periodMultiplier = period === 'month' ? 0.25 : period === 'season2026' ? 0.65 : 1.0;
  
  const processedList = pilotsList.map(p => {
    if (period === 'all' || p.isCurrentUser) return p;
    return {
      ...p,
      totalPoints: Math.round(p.totalPoints * periodMultiplier),
      totalKm: Math.round(p.totalKm * periodMultiplier),
      eventsCount: Math.max(0, Math.round(p.eventsCount * periodMultiplier)),
      tripsCount: Math.max(0, Math.round(p.tripsCount * periodMultiplier)),
    };
  });

  // Sort list according to active sortBy criteria
  processedList.sort((a, b) => {
    if (sortBy === 'km') {
      return b.totalKm - a.totalKm;
    }
    if (sortBy === 'events') {
      return b.eventsCount - a.eventsCount;
    }
    if (sortBy === 'trips') {
      return b.tripsCount - a.tripsCount;
    }
    if (sortBy === 'badges') {
      return b.badgesCount - a.badgesCount;
    }
    // Default: totalPoints
    return b.totalPoints - a.totalPoints;
  });

  // Assign global ranks before search/state filtering so user knows their absolute ranking
  const rankedList: LeaderboardPilot[] = processedList.map((pilot, idx) => ({
    ...pilot,
    rank: idx + 1,
  }));

  const currentUserPilot = rankedList.find(p => p.isCurrentUser) || null;
  const currentUserPosition = currentUserPilot ? currentUserPilot.rank : null;
  const totalPilotsCount = rankedList.length;

  // Apply filters for display
  let filteredList = rankedList;

  if (stateFilter && stateFilter !== 'todos') {
    filteredList = filteredList.filter(p => p.state.toUpperCase() === stateFilter.toUpperCase());
  }

  if (clubFilter && clubFilter !== 'todos') {
    if (clubFilter === 'independente') {
      filteredList = filteredList.filter(p => !p.motoClub || p.motoClub.toLowerCase().includes('independente'));
    } else {
      filteredList = filteredList.filter(p => p.motoClub?.toLowerCase().includes(clubFilter.toLowerCase()));
    }
  }

  if (searchQuery.trim()) {
    const normalize = (str: string) => 
      str.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .replace(/[@'"]/g, "")
         .trim();

    const q = normalize(searchQuery);

    filteredList = filteredList.filter(p => {
      const name = normalize(p.name);
      const handle = normalize(p.handle);
      const motorcycle = normalize(p.motorcycle);
      const club = normalize(p.motoClub || '');
      const city = normalize(p.city);
      const state = normalize(p.state);

      return (
        name.includes(q) ||
        handle.includes(q) ||
        motorcycle.includes(q) ||
        club.includes(q) ||
        city.includes(q) ||
        state.includes(q)
      );
    });
  }

  return {
    leaderboard: filteredList,
    currentUserPosition,
    currentUserPilot,
    totalPilotsCount
  };
}
