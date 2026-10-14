// Utilitário de conexão direta com a API do MotoLegado rodando na Hostinger

export async function fetchFromApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { data: json, error: json?.error || json?.message || `Erro HTTP ${res.status}` };
    }
    if (json && (json as any).success === false) {
      return { data: json, error: (json as any).error || (json as any).message || 'Operação não pôde ser concluída' };
    }
    return { data: json, error: null };
  } catch (err: any) {
    console.warn(`[API] Não foi possível conectar ao endpoint ${endpoint}:`, err);
    return { data: null, error: err?.message || 'Servidor indisponível' };
  }
}

// Autenticação Real no MySQL da Hostinger
export async function apiLogin(email: string, password: string) {
  return fetchFromApi<{ success: boolean; pilot: any; message?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function apiRegister(payload: { email: string; password: string; name: string; motorcycle?: string; phone?: string }) {
  return fetchFromApi<{ success: boolean; pilot: any; message?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiGetMe(pilotId: string) {
  return fetchFromApi<{ success: boolean; pilot: any }>(`/api/auth/me/${encodeURIComponent(pilotId)}`);
}

// Recuperação e Redefinição de Senha
export async function apiForgotPassword(email: string) {
  return fetchFromApi<{ 
    success: boolean; 
    message?: string; 
    error?: string; 
    code?: string; 
    securityHint?: string; 
    pilotName?: string;
  }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function apiResetPassword(payload: { 
  email: string; 
  code?: string; 
  new_password: string; 
  security_answer?: string; 
}) {
  return fetchFromApi<{ success: boolean; message?: string; error?: string; pilot?: any }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiChangePassword(payload: { 
  pilot_id: string; 
  current_password: string; 
  new_password: string; 
}) {
  return fetchFromApi<{ success: boolean; message?: string; error?: string }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Sincronizar dados do piloto com o MySQL da Hostinger
export async function syncPilotToHostinger(pilotData: any) {
  const result = await fetchFromApi('/api/pilots', {
    method: 'POST',
    body: JSON.stringify(pilotData)
  });
  return result.data;
}

// Sincronizar viagem com o MySQL da Hostinger
export async function syncTripToHostinger(tripData: any) {
  const result = await fetchFromApi('/api/trips', {
    method: 'POST',
    body: JSON.stringify(tripData)
  });
  return result.data;
}

// Buscar viagens do piloto no MySQL da Hostinger
export async function getTripsFromHostinger(pilotId?: string) {
  const url = pilotId ? `/api/trips?pilot_id=${encodeURIComponent(pilotId)}` : '/api/trips';
  const result = await fetchFromApi<{ success: boolean; trips: any[] }>(url);
  return result.data;
}

// Excluir viagem no MySQL da Hostinger
export async function deleteTripFromHostinger(tripId: string) {
  const result = await fetchFromApi<{ success: boolean; message?: string }>(`/api/trips/${encodeURIComponent(tripId)}`, {
    method: 'DELETE'
  });
  return result.data;
}

// Buscar todos os pilotos cadastrados (para administração no CommandCenter)
export async function getPilotsFromHostinger() {
  const result = await fetchFromApi<{ success: boolean; pilots: any[] }>('/api/pilots');
  return result.data;
}

// Status e Diagnóstico do Banco de Dados MySQL na Hostinger
export async function getDbStatus() {
  return fetchFromApi<{
    success: boolean;
    status: string;
    configuredHost?: string;
    database?: string;
    user?: string;
    totalPilots?: number;
    message?: string;
  }>('/api/db/status');
}

export async function initDbTables() {
  return fetchFromApi<{ success: boolean; message: string }>('/api/db/init', {
    method: 'POST'
  });
}

// Executar consulta SQL básica (SELECT 1) via mysql2 no banco da Hostinger
export async function pingSelect1FromHostinger() {
  return fetchFromApi<{
    success: boolean;
    status: 'Conectado' | 'Erro de Conexão';
    query: string;
    latencyMs?: number;
    host?: string;
    database?: string;
    user?: string;
    message: string;
    result?: Array<{ ping: number; server_time?: string; current_database?: string; mysql_version?: string }>;
    error?: string;
    timestamp: string;
  }>('/api/db/ping');
}

// Decodificar e importar rota e paradas do Google Maps com cálculo de distância e duração
export async function apiParseGoogleMapsRoute(input: string) {
  return fetchFromApi<{
    success: boolean;
    origin: string;
    destination: string;
    waypoints: string[];
    title: string;
    fullRouteUrl?: string;
    estimatedDistanceKm?: number;
    estimatedDuration?: string;
    suggestedStages?: Array<{
      name: string;
      type: 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service' | 'custom';
      notes?: string;
    }>;
    error?: string;
  }>('/api/routes/parse-maps', {
    method: 'POST',
    body: JSON.stringify({ url: input, text: input })
  });
}

// Calcular distância e duração rodoviária para paradas
export async function apiCalculateRouteMetrics(origin: string, destination: string, waypoints: string[] = []) {
  return fetchFromApi<{
    success: boolean;
    distanceKm: number;
    duration: string;
    error?: string;
  }>('/api/routes/calculate-metrics', {
    method: 'POST',
    body: JSON.stringify({ origin, destination, waypoints })
  });
}

// ============================================================================
// ROTEIROS (Routes) - MySQL Hostinger
// ============================================================================
export async function getRoutesFromHostinger(status?: string) {
  const url = status ? `/api/routes?status=${encodeURIComponent(status)}` : '/api/routes';
  const res = await fetchFromApi<{ success: boolean; routes: any[] }>(url);
  return res.data?.routes || [];
}

export async function getRouteByIdFromHostinger(id: string) {
  const res = await fetchFromApi<{ success: boolean; route: any }>(`/api/routes/${encodeURIComponent(id)}`);
  return res.data?.route || null;
}

export async function saveRouteToHostinger(routeData: any) {
  const res = await fetchFromApi<{ success: boolean; route: any; message?: string }>('/api/routes', {
    method: 'POST',
    body: JSON.stringify(routeData)
  });
  return res.data?.route || routeData;
}

export async function updateRouteStatusInHostinger(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/routes/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, rejectionReason })
  });
  return res.data?.success || false;
}

export async function deleteRouteFromHostinger(id: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/routes/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.data?.success || false;
}

// ============================================================================
// EVENTOS (Events) - MySQL Hostinger
// ============================================================================
export async function getEventsFromHostinger(status?: string) {
  const url = status ? `/api/events?status=${encodeURIComponent(status)}` : '/api/events';
  const res = await fetchFromApi<{ success: boolean; events: any[] }>(url);
  return res.data?.events || [];
}

export async function saveEventToHostinger(eventData: any) {
  const res = await fetchFromApi<{ success: boolean; event: any; message?: string }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
  return res.data?.event || eventData;
}

export async function updateEventStatusInHostinger(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/events/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, rejectionReason })
  });
  return res.data?.success || false;
}

export async function deleteEventFromHostinger(id: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/events/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.data?.success || false;
}

// ============================================================================
// PARCEIROS (Partners) - MySQL Hostinger
// ============================================================================
export async function getPartnersFromHostinger(status?: string) {
  const url = status ? `/api/partners?status=${encodeURIComponent(status)}` : '/api/partners';
  const res = await fetchFromApi<{ success: boolean; partners: any[] }>(url);
  return res.data?.partners || [];
}

export async function savePartnerToHostinger(partnerData: any) {
  const res = await fetchFromApi<{ success: boolean; partner: any; message?: string }>('/api/partners', {
    method: 'POST',
    body: JSON.stringify(partnerData)
  });
  return res.data?.partner || partnerData;
}

export async function updatePartnerStatusInHostinger(id: string, status: 'aprovado' | 'pendente' | 'rejeitado') {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/partners/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  return res.data?.success || false;
}

export async function deletePartnerFromHostinger(id: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/partners/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.data?.success || false;
}

// ============================================================================
// MURAL DA COMUNIDADE (Community Posts) - MySQL Hostinger
// ============================================================================
export async function getCommunityPostsFromHostinger(status?: string) {
  const url = status ? `/api/community/posts?status=${encodeURIComponent(status)}` : '/api/community/posts';
  const res = await fetchFromApi<{ success: boolean; posts: any[] }>(url);
  return res.data?.posts || [];
}

export async function saveCommunityPostToHostinger(postData: any) {
  const res = await fetchFromApi<{ success: boolean; post: any; message?: string }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  });
  return res.data?.post || postData;
}

export async function likeCommunityPostInHostinger(postId: string) {
  const res = await fetchFromApi<{ success: boolean; likes: number }>(`/api/community/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST'
  });
  return res.data?.likes || 1;
}

export async function updateCommunityPostStatusInHostinger(id: string, status: 'aprovado' | 'pendente' | 'rejeitado', rejectionReason?: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/community/posts/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, rejectionReason })
  });
  return res.data?.success || false;
}

export async function deleteCommunityPostFromHostinger(id: string) {
  const res = await fetchFromApi<{ success: boolean; message?: string }>(`/api/community/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.data?.success || false;
}

// ============================================================================
// MOTOCLUBES (Clubs) - MySQL Hostinger
// ============================================================================
export async function getClubsFromHostinger() {
  const res = await fetchFromApi<{ success: boolean; clubs: any[] }>('/api/clubs');
  return res.data?.clubs || [];
}

export async function saveClubToHostinger(clubData: any) {
  const res = await fetchFromApi<{ success: boolean; club: any; message?: string }>('/api/clubs', {
    method: 'POST',
    body: JSON.stringify(clubData)
  });
  return res.data?.club || clubData;
}


