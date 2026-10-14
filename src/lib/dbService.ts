import { 
  getRoutesFromHostinger, 
  saveRouteToHostinger, 
  updateRouteStatusInHostinger, 
  deleteRouteFromHostinger,
  getEventsFromHostinger,
  saveEventToHostinger,
  updateEventStatusInHostinger,
  deleteEventFromHostinger,
  getPartnersFromHostinger,
  savePartnerToHostinger,
  updatePartnerStatusInHostinger,
  deletePartnerFromHostinger,
  getCommunityPostsFromHostinger,
  saveCommunityPostToHostinger,
  likeCommunityPostInHostinger,
  updateCommunityPostStatusInHostinger,
  deleteCommunityPostFromHostinger,
  getClubsFromHostinger,
  saveClubToHostinger,
  syncPilotToHostinger,
  getPilotsFromHostinger,
  syncTripToHostinger,
  getTripsFromHostinger,
  deleteTripFromHostinger,
  getDbStatus,
  initDbTables,
  pingSelect1FromHostinger
} from './api';
import { Route, CommunityPost } from '../types';
import type { MotoEvent } from '../components/Events';
import type { Partner } from '../components/Partners';

/**
 * ============================================================================
 * SERVIÇO CENTRALIZADO DE BANCO DE DADOS MYSQL DA HOSTINGER (Frontend Client)
 * ============================================================================
 * 
 * Centraliza e encapsula todas as consultas e mutações ao banco de dados real
 * MySQL da Hostinger, garantindo sincronização imediata e eliminando mock data.
 */
export const clientDbService = {
  // Diagnóstico e Status da Conexão
  status: {
    check: getDbStatus,
    init: initDbTables,
    pingSelect1: pingSelect1FromHostinger,
  },

  // Pilotos
  pilots: {
    getAll: getPilotsFromHostinger,
    save: syncPilotToHostinger,
  },

  // Diário de Bordo (Viagens)
  trips: {
    getAll: (pilotId?: string) => getTripsFromHostinger(pilotId),
    save: syncTripToHostinger,
    delete: deleteTripFromHostinger,
  },

  // Roteiros (Routes)
  routes: {
    getAll: async (status?: string): Promise<Route[]> => {
      const data = await getRoutesFromHostinger(status);
      return data as Route[];
    },
    save: async (route: Partial<Route>): Promise<Route> => {
      const saved = await saveRouteToHostinger(route);
      return saved as Route;
    },
    updateStatus: updateRouteStatusInHostinger,
    delete: deleteRouteFromHostinger,
  },

  // Eventos (Events)
  events: {
    getAll: async (status?: string): Promise<MotoEvent[]> => {
      const data = await getEventsFromHostinger(status);
      return data as MotoEvent[];
    },
    save: async (event: Partial<MotoEvent>): Promise<MotoEvent> => {
      const saved = await saveEventToHostinger(event);
      return saved as MotoEvent;
    },
    updateStatus: updateEventStatusInHostinger,
    delete: deleteEventFromHostinger,
  },

  // Parceiros (Partners)
  partners: {
    getAll: async (status?: string): Promise<Partner[]> => {
      const data = await getPartnersFromHostinger(status);
      return data as Partner[];
    },
    save: async (partner: Partial<Partner>): Promise<Partner> => {
      const saved = await savePartnerToHostinger(partner);
      return saved as Partner;
    },
    updateStatus: updatePartnerStatusInHostinger,
    delete: deletePartnerFromHostinger,
  },

  // Mural da Comunidade (Posts)
  posts: {
    getAll: async (status?: string): Promise<CommunityPost[]> => {
      const data = await getCommunityPostsFromHostinger(status);
      return data as CommunityPost[];
    },
    save: async (post: Partial<CommunityPost>): Promise<CommunityPost> => {
      const saved = await saveCommunityPostToHostinger(post);
      return saved as CommunityPost;
    },
    like: likeCommunityPostInHostinger,
    updateStatus: updateCommunityPostStatusInHostinger,
    delete: deleteCommunityPostFromHostinger,
  },

  // Motoclubes (Clubs)
  clubs: {
    getAll: getClubsFromHostinger,
    save: saveClubToHostinger,
  }
};

export * from './databaseSchema';
export default clientDbService;
