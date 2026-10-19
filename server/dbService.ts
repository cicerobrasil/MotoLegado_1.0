import mysql from 'mysql2/promise';
import { getDbPool, safeMySqlQuery, dbConfig, testDbConnection, initDatabaseTables } from './db';
import { 
  storeGetPilotById, 
  storeGetPilotByEmail, 
  storeSavePilot, 
  storeGetAllPilots,
  storeGetTrips, 
  storeSaveTrip,
  storeDeleteTrip,
  storeGetPaymentRequests,
  storeSavePaymentRequest,
  storeApprovePaymentRequest
} from './store';

/**
 * ============================================================================
 * SERVIÇO CENTRALIZADO DE BANCO DE DADOS MYSQL DA HOSTINGER (MotoLegado)
 * ============================================================================
 * 
 * Centraliza todas as operações DML/DQL no MySQL da Hostinger utilizando a
 * biblioteca 'mysql2'. Garante que a aplicação consuma e persista exclusivamente
 * dados autênticos, eliminando dependência de dados mockados ou sementes fictícias.
 */

export interface DbPilot {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  phone?: string;
  blood_type?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  motorcycle?: string;
  motorcycle_year?: string;
  motorcycle_plate?: string;
  motorcycle_nickname?: string;
  motorcycle_photos?: string[] | string;
  bio?: string;
  avatar_url?: string;
  personal_logo_url?: string;
  city?: string;
  state?: string;
  cep?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  default_start_point?: number | boolean;
  club_name?: string;
  role?: 'admin' | 'pilot' | 'partner' | 'organizer';
  plan?: 'gratuito' | 'pago' | 'bonificado';
  points?: number;
  tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbTrip {
  id: string;
  pilot_id: string;
  title: string;
  description?: string;
  start_location?: string;
  destination: string;
  distance_km?: number;
  start_date: string;
  end_date?: string;
  status?: string;
  motorcycle_used?: string;
  checklist_data?: any;
  photos?: any;
  created_at?: string;
}

export interface DbRoute {
  id: string;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  title: string;
  name?: string;
  description?: string;
  maps_address?: string;
  maps_url?: string;
  rider_tips?: string;
  ai_tourist_info?: string;
  state?: string;
  city?: string;
  distance_km?: number;
  duration?: string;
  difficulty?: string;
  road_type?: string;
  cover_image?: string;
  waypoints?: any;
  rating?: number;
  total_ratings_count?: number;
  rating_metrics?: any;
  reviews?: any;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  rejection_reason?: string;
  created_at?: string;
}

export interface DbEvent {
  id: string;
  organizer_id?: string;
  created_by?: string;
  title: string;
  description?: string;
  desc?: string;
  event_date: string;
  date?: string;
  end_date?: string;
  time?: string;
  end_time?: string;
  location: string;
  city?: string;
  state?: string;
  distance?: number;
  category?: string;
  banner_url?: string;
  image?: string;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  rejection_reason?: string;
  member_count?: number;
  created_at?: string;
}

export interface DbPartner {
  id: string;
  name: string;
  category: string;
  description?: string;
  news?: string;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  corporate_contact?: string;
  website?: string;
  map_url?: string;
  discount_info?: string;
  discount?: string;
  logo_url?: string;
  image?: string;
  rating?: number;
  highlight?: boolean | number;
  responsible?: any;
  posts?: any;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  created_at?: string;
}

export interface DbCommunityPost {
  id: string;
  pilot_id: string;
  author_name?: string;
  author_avatar?: string;
  author_role?: string;
  content: string;
  image_url?: string;
  category?: string;
  likes_count?: number;
  likes?: number;
  comments_count?: number;
  comments?: number;
  comments_list?: any;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  rejection_reason?: string;
  created_at?: string;
}

export interface DbMotoClub {
  id: string;
  name: string;
  city?: string;
  state?: string;
  members_count?: number;
  rating?: number;
  image?: string;
  logo?: string;
  description?: string;
  category?: string;
  president_name?: string;
  contact_phone?: string;
  status?: string;
  created_at?: string;
}

export class HostingerDbService {
  /**
   * Status e Diagnóstico da Conexão
   */
  async getStatus() {
    const health = await testDbConnection();
    return {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      ...health
    };
  }

  /**
   * Inicialização das tabelas
   */
  async initTables() {
    return initDatabaseTables();
  }

  // ==========================================================================
  // PILOTOS (Pilots)
  // ==========================================================================

  async getAllPilots(): Promise<DbPilot[]> {
    try {
      const rows: any = await safeMySqlQuery('SELECT * FROM pilots ORDER BY created_at DESC');
      if (rows && rows[0] && Array.isArray(rows[0]) && rows[0].length > 0) {
        return rows[0].map(this.normalizePilotRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getAllPilots fallback:', err);
    }
    // Fallback para cache local persistente
    return storeGetAllPilots();
  }

  async getPilotById(id: string): Promise<DbPilot | null> {
    if (!id) return null;
    try {
      const rows: any = await safeMySqlQuery(
        'SELECT * FROM pilots WHERE id = ? OR LOWER(email) = ? LIMIT 1',
        [id, id.toLowerCase()]
      );
      if (rows && rows[0] && Array.isArray(rows[0]) && rows[0].length > 0) {
        return this.normalizePilotRow(rows[0][0]);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getPilotById fallback:', err);
    }
    return storeGetPilotById(id) || storeGetPilotByEmail(id) || null;
  }

  async getPilotByEmail(email: string): Promise<DbPilot | null> {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    try {
      const rows: any = await safeMySqlQuery(
        'SELECT * FROM pilots WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );
      if (rows && rows[0] && Array.isArray(rows[0]) && rows[0].length > 0) {
        return this.normalizePilotRow(rows[0][0]);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getPilotByEmail fallback:', err);
    }
    return storeGetPilotByEmail(cleanEmail) || null;
  }

  async savePilot(data: Partial<DbPilot>): Promise<DbPilot> {
    // 1. Garante gravação no store resiliente
    const saved = storeSavePilot(data);

    // 2. Persiste no MySQL Hostinger via prepared statement
    const photosJson = Array.isArray(data.motorcycle_photos) 
      ? JSON.stringify(data.motorcycle_photos) 
      : (typeof data.motorcycle_photos === 'string' ? data.motorcycle_photos : null);

    const defaultStart = data.default_start_point !== undefined 
      ? (data.default_start_point ? 1 : 0) 
      : 1;

    try {
      await safeMySqlQuery(`
        INSERT INTO pilots (
          id, email, password_hash, name, motorcycle, phone, blood_type, emergency_contact, emergency_phone,
          role, plan, motorcycle_nickname, motorcycle_photos, motorcycle_year, motorcycle_plate,
          bio, avatar_url, personal_logo_url, city, state, cep, street, street_number, neighborhood,
          default_start_point, club_name, points, tier
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          motorcycle = VALUES(motorcycle),
          phone = VALUES(phone),
          blood_type = VALUES(blood_type),
          emergency_contact = VALUES(emergency_contact),
          emergency_phone = VALUES(emergency_phone),
          role = VALUES(role),
          plan = VALUES(plan),
          motorcycle_nickname = VALUES(motorcycle_nickname),
          motorcycle_photos = VALUES(motorcycle_photos),
          motorcycle_year = VALUES(motorcycle_year),
          motorcycle_plate = VALUES(motorcycle_plate),
          bio = VALUES(bio),
          avatar_url = VALUES(avatar_url),
          personal_logo_url = VALUES(personal_logo_url),
          city = VALUES(city),
          state = VALUES(state),
          cep = VALUES(cep),
          street = VALUES(street),
          street_number = VALUES(street_number),
          neighborhood = VALUES(neighborhood),
          default_start_point = VALUES(default_start_point),
          club_name = VALUES(club_name),
          points = VALUES(points),
          tier = VALUES(tier)
      `, [
        saved.id,
        saved.email,
        saved.password_hash || null,
        saved.name,
        saved.motorcycle || null,
        saved.phone || null,
        saved.blood_type || null,
        saved.emergency_contact || null,
        saved.emergency_phone || null,
        saved.role || 'pilot',
        saved.plan || 'gratuito',
        saved.motorcycle_nickname || null,
        photosJson,
        saved.motorcycle_year || null,
        saved.motorcycle_plate || null,
        saved.bio || null,
        saved.avatar_url || null,
        saved.personal_logo_url || null,
        saved.city || null,
        saved.state || null,
        saved.cep || null,
        saved.street || null,
        saved.street_number || null,
        saved.neighborhood || null,
        defaultStart,
        saved.club_name || null,
        saved.points || 0,
        saved.tier || 'Bronze'
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] savePilot MySQL warning:', err);
    }

    return saved;
  }

  async updatePilotPassword(pilotId: string, passwordHash: string): Promise<boolean> {
    try {
      await safeMySqlQuery('UPDATE pilots SET password_hash = ? WHERE id = ?', [passwordHash, pilotId]);
      const pilot = storeGetPilotById(pilotId);
      if (pilot) {
        pilot.password_hash = passwordHash;
        storeSavePilot(pilot);
      }
      return true;
    } catch {
      return false;
    }
  }

  async updatePilotPlan(pilotId: string, plan: 'gratuito' | 'pago' | 'bonificado'): Promise<boolean> {
    try {
      await safeMySqlQuery('UPDATE pilots SET plan = ? WHERE id = ?', [plan, pilotId]);
      const pilot = storeGetPilotById(pilotId);
      if (pilot) {
        pilot.plan = plan;
        storeSavePilot(pilot);
      }
      return true;
    } catch {
      return false;
    }
  }

  private normalizePilotRow(row: any): DbPilot {
    let photos = row.motorcycle_photos;
    if (typeof photos === 'string') {
      try { photos = JSON.parse(photos); } catch { photos = []; }
    }
    return {
      ...row,
      motorcycle_photos: photos,
      default_start_point: row.default_start_point === 1 || row.default_start_point === true
    };
  }

  // ==========================================================================
  // VIAGENS (Trips / Diário de Bordo)
  // ==========================================================================

  async getTrips(pilotId?: string, wantAll: boolean = false): Promise<DbTrip[]> {
    try {
      let query: string;
      let params: any[] = [];

      if (wantAll || !pilotId || pilotId === 'all') {
        query = 'SELECT * FROM trips ORDER BY created_at DESC';
      } else {
        query = 'SELECT * FROM trips WHERE pilot_id = ? ORDER BY created_at DESC';
        params = [pilotId];
      }

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0]) && rows[0].length > 0) {
        return rows[0].map(this.normalizeTripRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getTrips MySQL fallback:', err);
    }

    const local = storeGetTrips(pilotId || 'all', wantAll);
    return local.map(this.normalizeTripRow);
  }

  async saveTrip(trip: Partial<DbTrip>): Promise<DbTrip> {
    const finalId = trip.id || `trip_${Date.now()}`;
    const saved = storeSaveTrip({ ...trip, id: finalId } as any);

    const checklistJson = typeof trip.checklist_data === 'string' 
      ? trip.checklist_data 
      : JSON.stringify(trip.checklist_data || {});

    const photosJson = typeof trip.photos === 'string' 
      ? trip.photos 
      : JSON.stringify(trip.photos || []);

    try {
      await safeMySqlQuery(`
        INSERT INTO trips (
          id, pilot_id, title, description, start_location, destination, distance_km,
          start_date, end_date, status, motorcycle_used, checklist_data, photos
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          description = VALUES(description),
          start_location = VALUES(start_location),
          destination = VALUES(destination),
          distance_km = VALUES(distance_km),
          start_date = VALUES(start_date),
          end_date = VALUES(end_date),
          status = VALUES(status),
          motorcycle_used = VALUES(motorcycle_used),
          checklist_data = VALUES(checklist_data),
          photos = VALUES(photos)
      `, [
        finalId,
        saved.pilot_id || 'pilot',
        saved.title || 'Roteiro de Viagem',
        saved.description || null,
        saved.start_location || saved.origin || null,
        saved.destination || '',
        saved.distance_km || 0,
        saved.start_date || new Date().toISOString().split('T')[0],
        saved.end_date || null,
        saved.status || 'completed',
        saved.motorcycle_used || null,
        checklistJson,
        photosJson
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] saveTrip MySQL warning:', err);
    }

    return this.normalizeTripRow(saved);
  }

  async deleteTrip(id: string): Promise<boolean> {
    storeDeleteTrip(id);
    try {
      await safeMySqlQuery('DELETE FROM trips WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeTripRow(row: any): DbTrip {
    let checklist = row.checklist_data;
    if (typeof checklist === 'string') {
      try { checklist = JSON.parse(checklist); } catch { checklist = {}; }
    }
    let photos = row.photos;
    if (typeof photos === 'string') {
      try { photos = JSON.parse(photos); } catch { photos = []; }
    }
    return {
      ...row,
      checklist_data: checklist,
      photos: Array.isArray(photos) ? photos : []
    };
  }

  // ==========================================================================
  // ROTEIROS (Routes)
  // ==========================================================================

  async getRoutes(status?: string): Promise<DbRoute[]> {
    try {
      let query = 'SELECT * FROM routes';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0].map(this.normalizeRouteRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getRoutes MySQL fallback:', err);
    }
    return [];
  }

  async getRouteById(id: string): Promise<DbRoute | null> {
    try {
      const rows: any = await safeMySqlQuery('SELECT * FROM routes WHERE id = ? LIMIT 1', [id]);
      if (rows && rows[0] && Array.isArray(rows[0]) && rows[0].length > 0) {
        return this.normalizeRouteRow(rows[0][0]);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getRouteById fallback:', err);
    }
    return null;
  }

  async saveRoute(route: Partial<DbRoute>): Promise<DbRoute> {
    const finalId = route.id || `route_${Date.now()}`;
    const waypointsJson = typeof route.waypoints === 'string' 
      ? route.waypoints 
      : JSON.stringify(route.waypoints || []);
    const ratingMetricsJson = typeof route.rating_metrics === 'string'
      ? route.rating_metrics
      : JSON.stringify(route.rating_metrics || {});
    const reviewsJson = typeof route.reviews === 'string'
      ? route.reviews
      : JSON.stringify(route.reviews || []);

    const title = route.title || route.name || 'Roteiro de Moto';
    const desc = route.description || '';
    const status = route.status || 'aprovado';

    try {
      await safeMySqlQuery(`
        INSERT INTO routes (
          id, author_id, author_name, author_avatar, title, description, maps_address, maps_url,
          rider_tips, ai_tourist_info, state, city, distance_km, duration, difficulty,
          road_type, cover_image, waypoints, rating, total_ratings_count, rating_metrics, reviews,
          status, rejection_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          author_name = VALUES(author_name),
          author_avatar = VALUES(author_avatar),
          title = VALUES(title),
          description = VALUES(description),
          maps_address = VALUES(maps_address),
          maps_url = VALUES(maps_url),
          rider_tips = VALUES(rider_tips),
          ai_tourist_info = VALUES(ai_tourist_info),
          state = VALUES(state),
          city = VALUES(city),
          distance_km = VALUES(distance_km),
          duration = VALUES(duration),
          difficulty = VALUES(difficulty),
          road_type = VALUES(road_type),
          cover_image = VALUES(cover_image),
          waypoints = VALUES(waypoints),
          rating = VALUES(rating),
          total_ratings_count = VALUES(total_ratings_count),
          rating_metrics = VALUES(rating_metrics),
          reviews = VALUES(reviews),
          status = VALUES(status),
          rejection_reason = VALUES(rejection_reason)
      `, [
        finalId,
        route.author_id || null,
        route.author_name || null,
        route.author_avatar || null,
        title,
        desc,
        route.maps_address || null,
        route.maps_url || null,
        route.rider_tips || null,
        route.ai_tourist_info || null,
        route.state || null,
        route.city || null,
        route.distance_km || 0,
        route.duration || null,
        route.difficulty || 'Médio',
        route.road_type || null,
        route.cover_image || null,
        waypointsJson,
        route.rating || 5.0,
        route.total_ratings_count || 1,
        ratingMetricsJson,
        reviewsJson,
        status,
        route.rejection_reason || null
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] saveRoute MySQL warning:', err);
    }

    return this.normalizeRouteRow({ ...route, id: finalId, title, description: desc, status });
  }

  async updateRouteStatus(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string): Promise<boolean> {
    try {
      await safeMySqlQuery(
        'UPDATE routes SET status = ?, rejection_reason = ? WHERE id = ?',
        [status, rejectionReason || null, id]
      );
      return true;
    } catch (err) {
      console.warn('[HostingerDbService] updateRouteStatus MySQL warning:', err);
      return false;
    }
  }

  async deleteRoute(id: string): Promise<boolean> {
    try {
      await safeMySqlQuery('DELETE FROM routes WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeRouteRow(row: any): DbRoute {
    let waypoints = row.waypoints;
    if (typeof waypoints === 'string') {
      try { waypoints = JSON.parse(waypoints); } catch { waypoints = []; }
    }
    let metrics = row.rating_metrics;
    if (typeof metrics === 'string') {
      try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
    }
    let reviews = row.reviews;
    if (typeof reviews === 'string') {
      try { reviews = JSON.parse(reviews); } catch { reviews = []; }
    }

    return {
      ...row,
      name: row.title || row.name,
      image: row.cover_image || row.image,
      mapsAddress: row.maps_address || row.mapsAddress,
      mapsUrl: row.maps_url || row.mapsUrl,
      riderTips: row.rider_tips || row.riderTips,
      aiTouristInfo: row.ai_tourist_info || row.aiTouristInfo,
      distance: Number(row.distance_km || row.distance || 0),
      duration: row.duration,
      difficulty: row.difficulty,
      ratingMetrics: metrics,
      totalRatingsCount: Number(row.total_ratings_count || 1),
      reviews: Array.isArray(reviews) ? reviews : [],
      waypoints: Array.isArray(waypoints) ? waypoints : [],
      author: {
        name: row.author_name || 'Piloto MotoLegado',
        avatar: row.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.author_name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`
      }
    };
  }

  // ==========================================================================
  // EVENTOS (Events)
  // ==========================================================================

  async getEvents(status?: string): Promise<DbEvent[]> {
    try {
      let query = 'SELECT * FROM events';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY event_date ASC, created_at DESC';

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0].map(this.normalizeEventRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getEvents MySQL fallback:', err);
    }
    return [];
  }

  async saveEvent(event: Partial<DbEvent>): Promise<DbEvent> {
    const finalId = event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const title = event.title || 'Novo Evento MotoLegado';
    const eventDate = event.event_date || event.date || new Date().toISOString().split('T')[0];
    const location = event.location || 'Brasil';
    const status = event.status || 'pendente';
    const createdBy = event.created_by || (event as any).createdBy || 'Piloto';

    try {
      await safeMySqlQuery(`
        INSERT INTO events (
          id, organizer_id, created_by, title, description, event_date, end_date,
          time, end_time, location, city, state, distance_km, category, banner_url,
          status, rejection_reason, member_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          created_by = VALUES(created_by),
          title = VALUES(title),
          description = VALUES(description),
          event_date = VALUES(event_date),
          end_date = VALUES(end_date),
          time = VALUES(time),
          end_time = VALUES(end_time),
          location = VALUES(location),
          city = VALUES(city),
          state = VALUES(state),
          distance_km = VALUES(distance_km),
          category = VALUES(category),
          banner_url = VALUES(banner_url),
          status = VALUES(status),
          rejection_reason = VALUES(rejection_reason),
          member_count = VALUES(member_count)
      `, [
        finalId,
        event.organizer_id || null,
        createdBy,
        title,
        event.description || (event as any).desc || '',
        eventDate,
        event.end_date || (event as any).endDate || null,
        event.time || '09:00',
        event.end_time || (event as any).endTime || null,
        location,
        event.city || null,
        event.state || null,
        event.distance || (event as any).distance_km || 0,
        event.category || 'Geral',
        event.banner_url || (event as any).image || null,
        status,
        event.rejection_reason || (event as any).rejectionReason || null,
        event.member_count || (event as any).memberCount || 1
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] saveEvent MySQL warning:', err);
    }

    return this.normalizeEventRow({ 
      ...event, 
      id: finalId, 
      title, 
      event_date: eventDate, 
      location, 
      status, 
      created_by: createdBy 
    });
  }

  async updateEventStatus(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string): Promise<boolean> {
    try {
      await safeMySqlQuery(
        'UPDATE events SET status = ?, rejection_reason = ? WHERE id = ?',
        [status, rejectionReason || null, id]
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await safeMySqlQuery('DELETE FROM events WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeEventRow(row: any): DbEvent {
    let dateStr = row.event_date || row.date;
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().split('T')[0];
    } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    let endDateStr = row.end_date || row.endDate;
    if (endDateStr instanceof Date) {
      endDateStr = endDateStr.toISOString().split('T')[0];
    } else if (typeof endDateStr === 'string' && endDateStr.includes('T')) {
      endDateStr = endDateStr.split('T')[0];
    }

    const validStatus = (row.status && typeof row.status === 'string' && row.status.trim() !== '')
      ? row.status.trim()
      : 'pendente';

    return {
      ...row,
      id: String(row.id),
      title: row.title || 'Evento MotoLegado',
      desc: row.description || row.desc || '',
      date: dateStr || new Date().toISOString().split('T')[0],
      endDate: endDateStr || undefined,
      time: row.time || '09:00',
      endTime: row.end_time || row.endTime || undefined,
      location: row.location || 'Brasil',
      category: row.category || 'Geral',
      image: row.banner_url || row.image || '',
      distance: Number(row.distance_km || row.distance || 0),
      status: validStatus,
      rejectionReason: row.rejection_reason || row.rejectionReason || undefined,
      createdBy: row.created_by || row.createdBy || 'Piloto',
      memberCount: Number(row.member_count || row.memberCount || 1),
      checkedIn: Boolean(row.checkedIn)
    };
  }

  // ==========================================================================
  // PARCEIROS (Partners)
  // ==========================================================================

  async getPartners(status?: string): Promise<DbPartner[]> {
    try {
      let query = 'SELECT * FROM partners';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0].map(this.normalizePartnerRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getPartners MySQL fallback:', err);
    }
    return [];
  }

  async savePartner(partner: Partial<DbPartner>): Promise<DbPartner> {
    const finalId = partner.id || `partner_${Date.now()}`;
    const name = partner.name || 'Parceiro MotoLegado';
    const category = partner.category || 'Oficina';
    const location = partner.location || partner.address || 'Brasil';
    const status = partner.status || 'aprovado';

    const responsibleJson = typeof partner.responsible === 'string'
      ? partner.responsible
      : JSON.stringify(partner.responsible || {});
    const postsJson = typeof partner.posts === 'string'
      ? partner.posts
      : JSON.stringify(partner.posts || []);

    try {
      await safeMySqlQuery(`
        INSERT INTO partners (
          id, name, category, description, news, address, city, state, phone,
          whatsapp, corporate_contact, website, map_url, discount_info, logo_url,
          rating, highlight, responsible, posts, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          description = VALUES(description),
          news = VALUES(news),
          address = VALUES(address),
          city = VALUES(city),
          state = VALUES(state),
          phone = VALUES(phone),
          whatsapp = VALUES(whatsapp),
          corporate_contact = VALUES(corporate_contact),
          website = VALUES(website),
          map_url = VALUES(map_url),
          discount_info = VALUES(discount_info),
          logo_url = VALUES(logo_url),
          rating = VALUES(rating),
          highlight = VALUES(highlight),
          responsible = VALUES(responsible),
          posts = VALUES(posts),
          status = VALUES(status)
      `, [
        finalId,
        name,
        category,
        partner.description || '',
        partner.news || null,
        location,
        partner.city || null,
        partner.state || null,
        partner.phone || null,
        partner.whatsapp || null,
        partner.corporate_contact || null,
        partner.website || null,
        partner.map_url || null,
        partner.discount_info || partner.discount || 'Desconto exclusivo MotoLegado',
        partner.logo_url || partner.image || null,
        partner.rating || 5.0,
        partner.highlight ? 1 : 0,
        responsibleJson,
        postsJson,
        status
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] savePartner MySQL warning:', err);
    }

    return this.normalizePartnerRow({ ...partner, id: finalId, name, category, location, status });
  }

  async updatePartnerStatus(id: string, status: 'aprovado' | 'pendente' | 'rejeitado'): Promise<boolean> {
    try {
      await safeMySqlQuery('UPDATE partners SET status = ? WHERE id = ?', [status, id]);
      return true;
    } catch {
      return false;
    }
  }

  async deletePartner(id: string): Promise<boolean> {
    try {
      await safeMySqlQuery('DELETE FROM partners WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  private normalizePartnerRow(row: any): DbPartner {
    let responsible = row.responsible;
    if (typeof responsible === 'string') {
      try { responsible = JSON.parse(responsible); } catch { responsible = {}; }
    }
    let posts = row.posts;
    if (typeof posts === 'string') {
      try { posts = JSON.parse(posts); } catch { posts = []; }
    }

    return {
      ...row,
      location: row.address || row.location,
      discount: row.discount_info || row.discount,
      image: row.logo_url || row.image,
      highlight: row.highlight === 1 || row.highlight === true,
      responsible,
      posts: Array.isArray(posts) ? posts : []
    };
  }

  // ==========================================================================
  // FEED DA COMUNIDADE (Community Posts)
  // ==========================================================================

  async getCommunityPosts(status?: string): Promise<DbCommunityPost[]> {
    try {
      let query = 'SELECT * FROM community_posts';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0].map(this.normalizeCommunityPostRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getCommunityPosts MySQL fallback:', err);
    }
    return [];
  }

  async saveCommunityPost(post: Partial<DbCommunityPost>): Promise<DbCommunityPost> {
    const finalId = post.id || `post_${Date.now()}`;
    const pilotId = post.pilot_id || 'pilot';
    const content = post.content || '';
    const status = post.status || 'aprovado';

    const commentsJson = typeof post.comments_list === 'string'
      ? post.comments_list
      : JSON.stringify(post.comments_list || []);

    try {
      await safeMySqlQuery(`
        INSERT INTO community_posts (
          id, pilot_id, author_name, author_avatar, author_role, content,
          image_url, category, likes_count, comments_count, comments_list,
          status, rejection_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          image_url = VALUES(image_url),
          category = VALUES(category),
          likes_count = VALUES(likes_count),
          comments_count = VALUES(comments_count),
          comments_list = VALUES(comments_list),
          status = VALUES(status),
          rejection_reason = VALUES(rejection_reason)
      `, [
        finalId,
        pilotId,
        post.author_name || 'Piloto MotoLegado',
        post.author_avatar || null,
        post.author_role || 'pilot',
        content,
        post.image_url || null,
        post.category || 'Geral',
        post.likes_count || post.likes || 0,
        post.comments_count || post.comments || 0,
        commentsJson,
        status,
        post.rejection_reason || null
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] saveCommunityPost MySQL warning:', err);
    }

    return this.normalizeCommunityPostRow({ ...post, id: finalId, pilot_id: pilotId, content, status });
  }

  async likeCommunityPost(postId: string): Promise<number> {
    try {
      await safeMySqlQuery('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
      const rows: any = await safeMySqlQuery('SELECT likes_count FROM community_posts WHERE id = ? LIMIT 1', [postId]);
      if (rows && rows[0] && rows[0][0]) {
        return rows[0][0].likes_count;
      }
    } catch (err) {
      console.warn('[HostingerDbService] likeCommunityPost warning:', err);
    }
    return 1;
  }

  async updatePostStatus(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string): Promise<boolean> {
    try {
      await safeMySqlQuery(
        'UPDATE community_posts SET status = ?, rejection_reason = ? WHERE id = ?',
        [status, rejectionReason || null, id]
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteCommunityPost(id: string): Promise<boolean> {
    try {
      await safeMySqlQuery('DELETE FROM community_posts WHERE id = ?', [id]);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeCommunityPostRow(row: any): any {
    let commentsList = row.comments_list;
    if (typeof commentsList === 'string') {
      try { commentsList = JSON.parse(commentsList); } catch { commentsList = []; }
    }

    return {
      id: row.id,
      user: {
        name: row.author_name || 'Piloto MotoLegado',
        avatar: row.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.author_name || 'Piloto')}&background=ea580c&color=ffffff&bold=true`,
        role: row.author_role || 'pilot'
      },
      content: row.content,
      image: row.image_url,
      category: row.category || 'Geral',
      likes: Number(row.likes_count || row.likes || 0),
      comments: Number(row.comments_count || row.comments || (Array.isArray(commentsList) ? commentsList.length : 0)),
      timestamp: row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : 'Agora',
      status: row.status || 'aprovado',
      createdAt: row.created_at || new Date().toISOString(),
      rejectionReason: row.rejection_reason,
      commentsList: Array.isArray(commentsList) ? commentsList : []
    };
  }

  // ==========================================================================
  // MOTOCLUBES (Clubs)
  // ==========================================================================

  async getClubs(): Promise<DbMotoClub[]> {
    try {
      const rows: any = await safeMySqlQuery('SELECT * FROM clubs ORDER BY name ASC');
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0].map(this.normalizeClubRow);
      }
    } catch (err) {
      console.warn('[HostingerDbService] getClubs MySQL fallback:', err);
    }
    return [];
  }

  async saveClub(club: Partial<DbMotoClub>): Promise<DbMotoClub> {
    const finalId = club.id || `club_${Date.now()}`;
    const name = club.name || 'Motoclube';

    try {
      await safeMySqlQuery(`
        INSERT INTO clubs (
          id, name, city, state, members_count, rating, image, logo, description,
          category, president_name, contact_phone, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          city = VALUES(city),
          state = VALUES(state),
          members_count = VALUES(members_count),
          rating = VALUES(rating),
          image = VALUES(image),
          logo = VALUES(logo),
          description = VALUES(description),
          category = VALUES(category),
          president_name = VALUES(president_name),
          contact_phone = VALUES(contact_phone),
          status = VALUES(status)
      `, [
        finalId,
        name,
        club.city || 'Brasil',
        club.state || null,
        club.members_count || 1,
        club.rating || 5.0,
        club.image || null,
        club.logo || null,
        club.description || '',
        club.category || 'Tradicional',
        club.president_name || null,
        club.contact_phone || null,
        club.status || 'active'
      ]);
    } catch (err) {
      console.warn('[HostingerDbService] saveClub MySQL warning:', err);
    }

    return this.normalizeClubRow({ ...club, id: finalId, name });
  }

  private normalizeClubRow(row: any): any {
    return {
      id: row.id,
      name: row.name,
      city: row.city || 'Brasil',
      members: Number(row.members_count || row.members || 1),
      rating: Number(row.rating || 5.0),
      image: row.image || '',
      logo: row.logo || '',
      description: row.description || '',
      category: row.category || 'Tradicional'
    };
  }

  // ==========================================================================
  // PAGAMENTOS (Payment Requests)
  // ==========================================================================

  async getPaymentRequests(status?: string) {
    try {
      let query = 'SELECT * FROM payment_requests';
      const params: any[] = [];
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';

      const rows: any = await safeMySqlQuery(query, params);
      if (rows && rows[0] && Array.isArray(rows[0])) {
        return rows[0];
      }
    } catch {}
    return storeGetPaymentRequests(status);
  }

  async savePaymentRequest(data: { pilot_id: string; email: string; name: string; amount: number; method: string; status?: string }) {
    const saved = storeSavePaymentRequest(data as any);
    try {
      await safeMySqlQuery(`
        INSERT INTO payment_requests (id, pilot_id, email, name, amount, method, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        saved.id,
        saved.pilot_id,
        saved.email,
        saved.name,
        saved.amount,
        saved.method,
        saved.status || 'pending'
      ]);
    } catch {}
    return saved;
  }

  async approvePaymentRequest(identifier: string, approverName: string = 'Cícero Ranieri') {
    const result = storeApprovePaymentRequest(identifier, approverName);
    try {
      await safeMySqlQuery(
        "UPDATE payment_requests SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE pilot_id = ? OR email = ?",
        [approverName, identifier, identifier.toLowerCase()]
      );
      await safeMySqlQuery(
        "UPDATE pilots SET plan = 'pago' WHERE id = ? OR LOWER(email) = ?",
        [identifier, identifier.toLowerCase()]
      );
    } catch {}
    return result;
  }
}

// Exporta instância Singleton centralizada
export const dbService = new HostingerDbService();
export default dbService;
