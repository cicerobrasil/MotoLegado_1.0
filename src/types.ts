
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface FeedItem {
  id: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
  };
  content: string;
  image?: string;
  category?: string;
  likes: number;
  comments: number;
  timestamp: string;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  createdAt?: string;
  rejectionReason?: string;
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

export interface UserStats {
  totalKm: number;
  totalTrips: number;
  reputationPoints: number;
  rank: string;
}
