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

