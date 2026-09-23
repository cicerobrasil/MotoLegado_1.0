
export enum RouteDifficulty {
  EASY = "Fácil",
  MEDIUM = "Médio",
  HARD = "Difícil",
  EXPERT = "Especialista"
}

export interface RouteRatingMetrics {
  paisagem: number; // 1-5
  asfalto: number; // 1-5
  curvas: number; // 1-5
  seguranca: number; // 1-5
  infraestrutura: number; // 1-5
}

export interface RouteReview {
  id: string;
  pilotName: string;
  pilotAvatar: string;
  date: string;
  overallRating: number;
  comment: string;
  metrics?: Partial<RouteRatingMetrics>;
}

export interface Route {
  id: string;
  name: string; // Título do Roteiro
  mapsAddress: string; // Endereço ou Query do Google Maps
  mapsUrl?: string; // Link direto do Google Maps
  description: string; // Descrição do local
  riderTips: string; // Maiores informações e dicas do local
  aiTouristInfo?: string; // Informações turísticas geradas por IA
  distance?: number; // em km (opcional, calculado no diário de bordo)
  duration?: string; // tempo estimado (opcional, calculado no diário de bordo)
  difficulty: RouteDifficulty;
  image?: string;
  startPoint?: string;
  endPoint?: string;
  author?: {
    name: string;
    avatar: string;
  };
  rating: number; // Média de avaliação
  totalRatingsCount: number;
  ratingMetrics: RouteRatingMetrics;
  reviews?: RouteReview[];
  createdAt?: string;
  isFavorite?: boolean;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  rejectionReason?: string;
}

export type BadgeCategory = 'all' | 'mileage' | 'events' | 'combo' | 'special';

export interface MotorcyclistBadge {
  id: string;
  category: 'mileage' | 'events' | 'combo' | 'special';
  categoryLabel: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  targetKm?: number;
  targetEvents?: number;
  targetTrips?: number;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  requirement: string;
  unit?: string;
  accentColor?: string;
}

export interface PointsBreakdown {
  kmPoints: number;
  eventPoints: number;
  tripPoints: number;
  badgePoints: number;
  bonusPoints: number;
  totalPoints: number;
  totalKm: number;
  eventsCount: number;
  tripsCount: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
}

export interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
  };
  content: string;
  image?: string;
  category: string;
  likes: number;
  comments: number;
  timestamp: string;
  status: 'aprovado' | 'pendente' | 'rejeitado';
  createdAt: string;
  rejectionReason?: string;
  commentsList?: Array<{
    id: string;
    author: string;
    avatar: string;
    text: string;
    createdAt: string;
  }>;
}

export type PlanType = 'gratuito' | 'pago' | 'bonificado';

export const FREE_PLAN_FEATURES = [
  "Acesso ao Dashboard e Feed de Notícias",
  "Diário de Bordo (Até 5 registros por mês)",
  "Visualização de Eventos e Roteiros Públicos",
  "Perfil de Piloto com Gamificação Básica",
  "Suporte Comunitário na Plataforma"
] as const;

export type ChecklistCategory = 'documents' | 'parts' | 'tools' | 'safety' | 'logistics';

export interface TripChecklistItem {
  id: string;
  category: ChecklistCategory;
  label: string;
  description?: string;
  isRequired: boolean;
  completed: boolean;
  isCustom?: boolean;
}

export type RankingSortBy = 'points' | 'km' | 'events' | 'trips' | 'badges';
export type RankingPeriod = 'all' | 'season2026' | 'month';

export interface LeaderboardPilot {
  id: string;
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  motoClub?: string;
  clubRole?: string;
  motorcycle: string;
  city: string;
  state: string;
  totalPoints: number;
  totalKm: number;
  eventsCount: number;
  tripsCount: number;
  badgesCount: number;
  tierTitle: string;
  tierIcon: string;
  tierAccent: string;
  isCurrentUser?: boolean;
  highlightBadge?: string;
  isVerified?: boolean;
  isPro?: boolean;
  bio?: string;
  joinedYear?: number;
  pointsTrend?: 'up' | 'down' | 'same';
  rankChange?: number; // e.g. +2, -1, 0
}
