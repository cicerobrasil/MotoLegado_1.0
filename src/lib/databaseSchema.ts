/**
 * ============================================================================
 * ESQUEMA DE BANCO DE DADOS HOSTINGER MYSQL (MotoLegado)
 * ============================================================================
 * 
 * Arquivo de tipagem estrita para todos os modelos de dados da aplicação.
 * Mapeia com precisão:
 * 1. Linhas brutas do MySQL retornadas pelo driver 'mysql2' (snake_case).
 * 2. Modelos de domínio consumidos pelo frontend e serviços (camelCase).
 * 3. Mapeadores de conversão bidirecionais seguros e sanitizados.
 */

// ============================================================================
// 1. USUÁRIOS E PILOTOS (Tabela: `pilots`)
// ============================================================================

export type UserRole = 'admin' | 'pilot' | 'partner' | 'organizer';
export type UserPlan = 'gratuito' | 'pago' | 'bonificado';
export type PilotTier = 'Iniciante' | 'Explorador' | 'Veterano' | 'Lenda do Asfalto' | 'Mestre da Estrada';

/**
 * Representação direta da linha retornada da tabela `pilots` via mysql2.
 */
export interface DbPilotRow {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  phone?: string | null;
  blood_type?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  motorcycle?: string | null;
  motorcycle_year?: string | null;
  motorcycle_plate?: string | null;
  motorcycle_nickname?: string | null;
  motorcycle_photos?: string | string[] | null;
  bio?: string | null;
  avatar_url?: string | null;
  personal_logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  street?: string | null;
  street_number?: string | null;
  neighborhood?: string | null;
  default_start_point?: number | boolean | null;
  club_name?: string | null;
  role?: UserRole | null;
  plan?: UserPlan | null;
  points?: number | null;
  tier?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

/**
 * Modelo de Usuário / Piloto utilizado no ecossistema e estado do aplicativo.
 */
export interface UserProfileModel {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  motorcycle?: string;
  motorcycleYear?: string;
  motorcyclePlate?: string;
  motorcycleNickname?: string;
  motorcyclePhotos: string[];
  bio?: string;
  avatarUrl?: string;
  personalLogoUrl?: string;
  city?: string;
  state?: string;
  cep?: string;
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  defaultStartPoint?: boolean;
  clubName?: string;
  role: UserRole;
  plan: UserPlan;
  points: number;
  tier: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Converte DbPilotRow (MySQL) em UserProfileModel tipado.
 */
export function mapDbPilotToModel(row: DbPilotRow): UserProfileModel {
  let photos: string[] = [];
  if (Array.isArray(row.motorcycle_photos)) {
    photos = row.motorcycle_photos;
  } else if (typeof row.motorcycle_photos === 'string' && row.motorcycle_photos.trim()) {
    try {
      const parsed = JSON.parse(row.motorcycle_photos);
      if (Array.isArray(parsed)) photos = parsed;
    } catch {
      photos = [row.motorcycle_photos];
    }
  }

  return {
    id: String(row.id),
    email: String(row.email || ''),
    name: String(row.name || ''),
    phone: row.phone || undefined,
    bloodType: row.blood_type || undefined,
    emergencyContact: row.emergency_contact || undefined,
    emergencyPhone: row.emergency_phone || undefined,
    motorcycle: row.motorcycle || undefined,
    motorcycleYear: row.motorcycle_year || undefined,
    motorcyclePlate: row.motorcycle_plate || undefined,
    motorcycleNickname: row.motorcycle_nickname || undefined,
    motorcyclePhotos: photos,
    bio: row.bio || undefined,
    avatarUrl: row.avatar_url || undefined,
    personalLogoUrl: row.personal_logo_url || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    cep: row.cep || undefined,
    street: row.street || undefined,
    streetNumber: row.street_number || undefined,
    neighborhood: row.neighborhood || undefined,
    defaultStartPoint: Boolean(row.default_start_point),
    clubName: row.club_name || undefined,
    role: (row.role as UserRole) || 'pilot',
    plan: (row.plan as UserPlan) || 'gratuito',
    points: Number(row.points || 0),
    tier: row.tier || 'Iniciante',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}


// ============================================================================
// 2. MOTOCLUBES (Tabela: `clubs`)
// ============================================================================

export type ClubCategory = 'Cruiser' | 'Custom' | 'Esportiva' | 'Big Trail' | 'Clássica' | 'Mista' | 'Geral';
export type ClubMemberRole = 'Presidente' | 'Vice-Presidente' | 'Tesoureiro(a)' | 'Secretário(a)' | 'Road Captain' | 'Sargento-de-Armas' | 'Membro' | 'Próspero';

/**
 * Representação direta da linha retornada da tabela `clubs` via mysql2.
 */
export interface DbClubRow {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  members_count?: number | null;
  rating?: number | null;
  image_url?: string | null;
  logo_url?: string | null;
  description?: string | null;
  category?: string | null;
  foundation_date?: string | null;
  president_name?: string | null;
  president_id?: string | null;
  regulations_file?: string | null;
  status?: 'ativo' | 'pendente' | 'inativo' | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

/**
 * Modelo de Motoclube na aplicação.
 */
export interface MotoClubModel {
  id: string;
  name: string;
  city: string;
  state?: string;
  members: number;
  rating: number;
  image: string;
  logo: string;
  description: string;
  category: string;
  foundationDate?: string;
  presidentName?: string;
  presidentId?: string;
  regulationsFile?: string;
  status: 'ativo' | 'pendente' | 'inativo';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Converte DbClubRow (MySQL) em MotoClubModel tipado.
 */
export function mapDbClubToModel(row: DbClubRow): MotoClubModel {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    city: String(row.city || 'Brasil'),
    state: row.state || undefined,
    members: Number(row.members_count || 1),
    rating: Number(row.rating || 5.0),
    image: row.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200',
    logo: row.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
    description: String(row.description || ''),
    category: String(row.category || 'Mista'),
    foundationDate: row.foundation_date || undefined,
    presidentName: row.president_name || undefined,
    presidentId: row.president_id || undefined,
    regulationsFile: row.regulations_file || undefined,
    status: row.status || 'ativo',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}


// ============================================================================
// 3. ROTAS E ROTEIROS (Tabela: `routes`)
// ============================================================================

export type RouteDifficulty = 'Fácil' | 'Médio' | 'Difícil' | 'Especialista';
export type ModerationStatus = 'aprovado' | 'pendente' | 'rejeitado';

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

/**
 * Representação direta da linha retornada da tabela `routes` via mysql2.
 */
export interface DbRouteRow {
  id: string;
  name: string;
  maps_address: string;
  maps_url?: string | null;
  description: string;
  rider_tips?: string | null;
  ai_tourist_info?: string | null;
  distance?: number | null;
  duration?: string | null;
  difficulty?: string | null;
  image_url?: string | null;
  start_point?: string | null;
  end_point?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  rating?: number | null;
  total_ratings_count?: number | null;
  rating_metrics?: string | RouteRatingMetrics | null;
  reviews?: string | RouteReview[] | null;
  status?: ModerationStatus | null;
  rejection_reason?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

/**
 * Modelo de Rota utilizado no frontend da aplicação.
 */
export interface RouteModel {
  id: string;
  name: string;
  mapsAddress: string;
  mapsUrl?: string;
  description: string;
  riderTips: string;
  aiTouristInfo?: string;
  distance?: number;
  duration?: string;
  difficulty: RouteDifficulty;
  image?: string;
  startPoint?: string;
  endPoint?: string;
  author?: {
    name: string;
    avatar: string;
  };
  rating: number;
  totalRatingsCount: number;
  ratingMetrics: RouteRatingMetrics;
  reviews?: RouteReview[];
  createdAt?: string;
  isFavorite?: boolean;
  status?: ModerationStatus;
  rejectionReason?: string;
}

/**
 * Converte DbRouteRow (MySQL) em RouteModel tipado.
 */
export function mapDbRouteToModel(row: DbRouteRow): RouteModel {
  let metrics: RouteRatingMetrics = { paisagem: 5, asfalto: 5, curvas: 5, seguranca: 5, infraestrutura: 5 };
  if (typeof row.rating_metrics === 'string' && row.rating_metrics.trim()) {
    try {
      const parsed = JSON.parse(row.rating_metrics);
      if (parsed && typeof parsed === 'object') metrics = { ...metrics, ...parsed };
    } catch {}
  } else if (row.rating_metrics && typeof row.rating_metrics === 'object') {
    metrics = { ...metrics, ...row.rating_metrics };
  }

  let reviewsList: RouteReview[] = [];
  if (typeof row.reviews === 'string' && row.reviews.trim()) {
    try {
      const parsed = JSON.parse(row.reviews);
      if (Array.isArray(parsed)) reviewsList = parsed;
    } catch {}
  } else if (Array.isArray(row.reviews)) {
    reviewsList = row.reviews;
  }

  return {
    id: String(row.id),
    name: String(row.name || ''),
    mapsAddress: String(row.maps_address || ''),
    mapsUrl: row.maps_url || undefined,
    description: String(row.description || ''),
    riderTips: String(row.rider_tips || ''),
    aiTouristInfo: row.ai_tourist_info || undefined,
    distance: row.distance ? Number(row.distance) : undefined,
    duration: row.duration || undefined,
    difficulty: (row.difficulty as RouteDifficulty) || 'Médio',
    image: row.image_url || undefined,
    startPoint: row.start_point || undefined,
    endPoint: row.end_point || undefined,
    author: row.author_name ? {
      name: row.author_name,
      avatar: row.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    } : undefined,
    rating: Number(row.rating || 5.0),
    totalRatingsCount: Number(row.total_ratings_count || 0),
    ratingMetrics: metrics,
    reviews: reviewsList,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    status: (row.status as ModerationStatus) || 'aprovado',
    rejectionReason: row.rejection_reason || undefined,
  };
}


// ============================================================================
// 4. DIÁRIO DE BORDO E VIAGENS (Tabela: `trips`)
// ============================================================================

/**
 * Representação direta da linha retornada da tabela `trips` via mysql2.
 */
export interface DbTripRow {
  id: string;
  pilot_id: string;
  title: string;
  description?: string | null;
  start_point?: string | null;
  destination?: string | null;
  distance?: number | null;
  duration?: string | null;
  difficulty?: string | null;
  fuel_consumed?: number | null;
  fuel_cost?: number | null;
  date?: string | null;
  rating?: number | null;
  photos?: string | string[] | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

/**
 * Modelo de Viagem no frontend.
 */
export interface TripModel {
  id: string;
  pilotId: string;
  title: string;
  description?: string;
  startPoint?: string;
  destination?: string;
  distance?: number;
  duration?: string;
  difficulty?: string;
  fuelConsumed?: number;
  fuelCost?: number;
  date?: string;
  rating?: number;
  photos?: string[];
  createdAt?: string;
}

/**
 * Converte DbTripRow (MySQL) em TripModel tipado.
 */
export function mapDbTripToModel(row: DbTripRow): TripModel {
  let photoList: string[] = [];
  if (Array.isArray(row.photos)) {
    photoList = row.photos;
  } else if (typeof row.photos === 'string' && row.photos.trim()) {
    try {
      const parsed = JSON.parse(row.photos);
      if (Array.isArray(parsed)) photoList = parsed;
    } catch {
      photoList = [row.photos];
    }
  }

  return {
    id: String(row.id),
    pilotId: String(row.pilot_id),
    title: String(row.title || ''),
    description: row.description || undefined,
    startPoint: row.start_point || undefined,
    destination: row.destination || undefined,
    distance: row.distance ? Number(row.distance) : undefined,
    duration: row.duration || undefined,
    difficulty: row.difficulty || undefined,
    fuelConsumed: row.fuel_consumed ? Number(row.fuel_consumed) : undefined,
    fuelCost: row.fuel_cost ? Number(row.fuel_cost) : undefined,
    date: row.date || undefined,
    rating: row.rating ? Number(row.rating) : 5,
    photos: photoList,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}


// ============================================================================
// 5. EVENTOS (Tabela: `events`)
// ============================================================================

export interface DbEventRow {
  id: string;
  title: string;
  location: string;
  date: string;
  time?: string | null;
  description: string;
  banner_url?: string | null;
  category?: string | null;
  organizer_name?: string | null;
  organizer_id?: string | null;
  organizer_avatar?: string | null;
  attendees_count?: number | null;
  price?: string | null;
  status?: ModerationStatus | null;
  rejection_reason?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface MotoEventModel {
  id: string;
  title: string;
  location: string;
  date: string;
  time?: string;
  description: string;
  bannerUrl: string;
  category: string;
  organizer: {
    name: string;
    avatar: string;
    id?: string;
  };
  attendeesCount: number;
  price?: string;
  status: ModerationStatus;
  rejectionReason?: string;
  createdAt?: string;
}

export function mapDbEventToModel(row: DbEventRow): MotoEventModel {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    location: String(row.location || ''),
    date: String(row.date || ''),
    time: row.time || undefined,
    description: String(row.description || ''),
    bannerUrl: row.banner_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200',
    category: row.category || 'Encontro',
    organizer: {
      name: row.organizer_name || 'MotoLegado',
      avatar: row.organizer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      id: row.organizer_id || undefined,
    },
    attendeesCount: Number(row.attendees_count || 0),
    price: row.price || undefined,
    status: (row.status as ModerationStatus) || 'aprovado',
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}


// ============================================================================
// 6. PARCEIROS (Tabela: `partners`)
// ============================================================================

export interface DbPartnerRow {
  id: string;
  name: string;
  category: string;
  city: string;
  discount: string;
  rating?: number | null;
  image_url?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  description?: string | null;
  status?: ModerationStatus | null;
  rejection_reason?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface PartnerModel {
  id: string;
  name: string;
  category: string;
  city: string;
  discount: string;
  rating: number;
  image: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  status: ModerationStatus;
  rejectionReason?: string;
  createdAt?: string;
}

export function mapDbPartnerToModel(row: DbPartnerRow): PartnerModel {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    category: String(row.category || 'Oficina'),
    city: String(row.city || 'Brasil'),
    discount: String(row.discount || '10% OFF'),
    rating: Number(row.rating || 5.0),
    image: row.image_url || 'https://images.unsplash.com/photo-1589148938909-4d241c91ee52?auto=format&fit=crop&q=80&w=600',
    address: row.address || undefined,
    phone: row.phone || undefined,
    whatsapp: row.whatsapp || undefined,
    description: row.description || undefined,
    status: (row.status as ModerationStatus) || 'aprovado',
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}


// ============================================================================
// 7. MURAL DA COMUNIDADE (Tabela: `community_posts`)
// ============================================================================

export interface DbCommunityPostRow {
  id: string;
  author_id?: string | null;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  image_url?: string | null;
  likes_count?: number | null;
  liked_by?: string | string[] | null;
  status?: ModerationStatus | null;
  rejection_reason?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface CommunityPostModel {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  likes: number;
  isLiked?: boolean;
  status?: ModerationStatus;
  createdAt: string;
}

export function mapDbCommunityPostToModel(row: DbCommunityPostRow, currentUserId?: string): CommunityPostModel {
  let likedUsers: string[] = [];
  if (Array.isArray(row.liked_by)) {
    likedUsers = row.liked_by;
  } else if (typeof row.liked_by === 'string' && row.liked_by.trim()) {
    try {
      const parsed = JSON.parse(row.liked_by);
      if (Array.isArray(parsed)) likedUsers = parsed;
    } catch {
      likedUsers = [row.liked_by];
    }
  }

  const isLiked = currentUserId ? likedUsers.includes(currentUserId) : false;

  return {
    id: String(row.id),
    authorId: row.author_id || undefined,
    authorName: String(row.author_name || 'Piloto'),
    authorAvatar: row.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    content: String(row.content || ''),
    image: row.image_url || undefined,
    likes: Number(row.likes_count || 0),
    isLiked,
    status: (row.status as ModerationStatus) || 'aprovado',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}


// ============================================================================
// 8. TIPAGEM DE RESPOSTA E COMUNICAÇÃO MYSQL2
// ============================================================================

export interface DatabaseConnectionStatus {
  connected: boolean;
  source: 'mysql' | 'in-memory-fallback';
  database?: string;
  host?: string;
  error?: string;
  tables?: string[];
  timestamp: string;
}

export interface MySqlOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  affectedRows?: number;
  insertId?: number | string;
}
