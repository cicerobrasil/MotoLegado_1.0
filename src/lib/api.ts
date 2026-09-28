// Utilitário de conexão direta com a API do MotoLegado rodando na Hostinger

export async function fetchFromApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Não foi possível conectar ao endpoint ${endpoint}:`, err);
    return null;
  }
}

// Sincronizar dados do piloto com o MySQL da Hostinger
export async function syncPilotToHostinger(pilotData: any) {
  return fetchFromApi('/api/pilots', {
    method: 'POST',
    body: JSON.stringify(pilotData)
  });
}

// Sincronizar viagem com o MySQL da Hostinger
export async function syncTripToHostinger(tripData: any) {
  return fetchFromApi('/api/trips', {
    method: 'POST',
    body: JSON.stringify(tripData)
  });
}

// Buscar viagens do piloto no MySQL da Hostinger
export async function getTripsFromHostinger(pilotId?: string) {
  const url = pilotId ? `/api/trips?pilot_id=${encodeURIComponent(pilotId)}` : '/api/trips';
  return fetchFromApi<{ success: boolean; trips: any[] }>(url);
}
