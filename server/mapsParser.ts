/**
 * Utilitário para decodificar e processar links e rotas do Google Maps,
 * listas de paradas de roteiros de motociclistas e cálculo real de distância e duração rodoviária.
 */

export interface ParsedRouteResult {
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
}

function cleanLocationName(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Remove parâmetros de consulta adicionais se colados juntos
  if (str.includes('?')) {
    str = str.split('?')[0];
  }

  // Substitui '+' por espaço antes de decodificar
  str = str.replace(/\+/g, ' ');

  try {
    str = decodeURIComponent(str);
  } catch {
    // Ignora se já estiver decodificado
  }

  // Remove caracteres residuais como barras ou aspas
  str = str.replace(/^\/+|\/+$/g, '').trim();

  return str;
}

/**
 * Tenta classificar automaticamente o tipo da parada baseado no nome
 */
export function guessStageType(name: string): 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service' | 'custom' {
  const lower = name.toLowerCase();

  if (
    lower.includes('posto') || 
    lower.includes('graal') || 
    lower.includes('ipiranga') || 
    lower.includes('br ') || 
    lower.includes('shell') || 
    lower.includes('abastecimento')
  ) {
    return 'fuel';
  }

  if (
    lower.includes('restaurante') || 
    lower.includes('café') || 
    lower.includes('cafe') || 
    lower.includes('lanchonete') || 
    lower.includes('churrascaria') || 
    lower.includes('almoço') || 
    lower.includes('pastel') || 
    lower.includes('lanche')
  ) {
    return 'food';
  }

  if (
    lower.includes('mirante') || 
    lower.includes('serra') || 
    lower.includes('pico') || 
    lower.includes('cascata') || 
    lower.includes('cachoeira') || 
    lower.includes('parque') || 
    lower.includes('pedra') || 
    lower.includes('monumento') || 
    lower.includes('vista') || 
    lower.includes('cênico') || 
    lower.includes('praia')
  ) {
    return 'scenic';
  }

  if (
    lower.includes('hotel') || 
    lower.includes('pousada') || 
    lower.includes('resort') || 
    lower.includes('camping') || 
    lower.includes('hostel') || 
    lower.includes('pernoite')
  ) {
    return 'sleep';
  }

  if (
    lower.includes('oficina') ||
    lower.includes('mecânica') ||
    lower.includes('motoservice') ||
    lower.includes('concessionária') ||
    lower.includes('borracharia')
  ) {
    return 'service';
  }

  if (
    lower.includes('encontro') || 
    lower.includes('ponto de encontro') || 
    lower.includes('motoclube') || 
    lower.includes('praça')
  ) {
    return 'meet';
  }

  return 'scenic';
}

/**
 * Gera termos de busca inteligentes para geocodificação
 * Extrai cidade e estado mesmo de endereços longos com nomes de estabelecimentos
 */
function getQueryCandidates(raw: string): string[] {
  const list: string[] = [];
  if (!raw) return list;

  // 1. Extrai padrão "Cidade - UF" (ex: "Itajaí - SC", "Blumenau - SC", "Nova Trento - SC", "Palhoça - SC")
  const matchCityUf = raw.match(/([A-Za-zÀ-ÿ\s]{2,})\s*[-–,]\s*([A-Z]{2})/);
  if (matchCityUf) {
    list.push(`${matchCityUf[1].trim()}, ${matchCityUf[2].trim()}, Brasil`);
    list.push(`${matchCityUf[1].trim()}, Brasil`);
  }

  // 2. Extrai cidade antes ou depois de hífen
  if (raw.includes('-')) {
    const parts = raw.split('-');
    if (parts.length >= 2) {
      const partBefore = parts[parts.length - 2]?.trim();
      const partAfter = parts[parts.length - 1]?.trim();
      if (partBefore && partBefore.length > 2 && !partBefore.toLowerCase().includes('rua') && !partBefore.toLowerCase().includes('av')) {
        list.push(`${partBefore}, Brasil`);
      }
      if (partAfter && partAfter.length > 2) {
        list.push(`${partAfter}, Brasil`);
      }
    }
  }

  // 3. Extrai partes separadas por vírgula (cidade, estado)
  if (raw.includes(',')) {
    const commaParts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (commaParts.length >= 2) {
      list.push(`${commaParts[commaParts.length - 2]}, ${commaParts[commaParts.length - 1]}, Brasil`);
      list.push(`${commaParts[commaParts.length - 1]}, Brasil`);
    }
  }

  // 4. Termo original com ", Brasil"
  list.push(raw.includes('Brasil') ? raw : `${raw}, Brasil`);
  list.push(raw);

  return Array.from(new Set(list.filter(Boolean)));
}

/**
 * Calcula distância rodoviária real (em KM) e duração de viagem (em horas/minutos)
 * para motocicletas usando geocodificação resiliente + OSRM
 */
export async function calculateRouteDistanceAndDuration(
  origin: string,
  destination: string,
  waypoints: string[] = []
): Promise<{ distanceKm: number; duration: string }> {
  const allLocations = [origin, ...waypoints, destination].map(s => s.trim()).filter(Boolean);
  
  if (allLocations.length < 2) {
    return { distanceKm: 120, duration: '2h 00min' };
  }

  try {
    const coordsResults: Array<[number, number] | null> = [];

    // Geocodifica cada parada buscando termos inteligentes
    for (const loc of allLocations) {
      let found: [number, number] | null = null;
      const candidates = getQueryCandidates(loc);

      for (const q of candidates) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'MotoLegadoApp/2.0 (contato@motolegado.com.br)' }
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            if (data && data[0] && data[0].lat && data[0].lon) {
              found = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
              break;
            }
          }
        } catch {}
      }

      coordsResults.push(found);
    }

    const validCoords = coordsResults.filter((c): c is [number, number] => c !== null);

    // Se obteve coordenadas válidas para pelo menos 2 pontos, calcula a rota rodoviária
    if (validCoords.length >= 2) {
      const coordString = validCoords.map(c => `${c[0]},${c[1]}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const osrmRes = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const routeData = await osrmRes.json();
        if (routeData && routeData.routes && routeData.routes[0]) {
          const meters = routeData.routes[0].distance;
          const seconds = routeData.routes[0].duration;

          // Se faltou geocodificar alguma parada intermediária, ajusta proporcionalmente
          const factor = allLocations.length / validCoords.length;
          const distanceKm = Math.max(1, Math.round((meters / 1000) * (factor > 1 ? 1.15 : 1)));
          const totalMinutes = Math.max(1, Math.round((seconds / 60) * (factor > 1 ? 1.15 : 1)));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          const durationStr = hours > 0 
            ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`.trim()
            : `${minutes}min`;

          return { distanceKm, duration: durationStr };
        }
      }
    }
  } catch (err) {
    console.warn('[RouteCalculator] Erro no cálculo OSRM:', err);
  }

  // Fallback garantido baseado na contagem de trechos para nunca deixar os campos vazios
  const legCount = Math.max(1, allLocations.length - 1);
  const fallbackKm = Math.round(legCount * 85);
  const fallbackTotalMin = Math.round(fallbackKm * 1.05);
  const h = Math.floor(fallbackTotalMin / 60);
  const m = fallbackTotalMin % 60;

  return {
    distanceKm: fallbackKm,
    duration: `${h}h ${m > 0 ? `${m}min` : '15min'}`.trim()
  };
}

export function parseGoogleMapsRoute(urlOrText: string, originalInput?: string): ParsedRouteResult {
  const input = (urlOrText || '').trim();
  const result: ParsedRouteResult = {
    origin: '',
    destination: '',
    waypoints: [],
    title: '',
    suggestedStages: []
  };

  if (!input) return result;

  // 1. Tenta formato com /maps/dir/ ponto1 / ponto2 / ponto3...
  if (input.includes('/maps/dir/') || input.includes('/dir/')) {
    try {
      const dirIndex = input.indexOf('/dir/');
      const afterDir = input.slice(dirIndex + 5);
      const segments = afterDir.split('/');

      const rawPoints: string[] = [];
      for (const seg of segments) {
        const clean = seg.trim();
        // Ignora segmentos de coordenadas @lat,lng,zoom
        if (!clean || clean.startsWith('@')) continue;
        // Ignora dados internos do Google Maps como data=!4m...
        if (clean.startsWith('data=') || clean.startsWith('am=') || clean.includes('!1m') || clean.includes('!4m')) continue;
        
        const loc = cleanLocationName(clean);
        if (loc && !rawPoints.includes(loc)) {
          rawPoints.push(loc);
        }
      }

      if (rawPoints.length >= 2) {
        result.origin = rawPoints[0];
        result.destination = rawPoints[rawPoints.length - 1];
        result.waypoints = rawPoints.slice(1, -1);
      } else if (rawPoints.length === 1) {
        result.destination = rawPoints[0];
      }
    } catch (e) {
      console.warn('[ParseMaps] Falha ao parsear path /dir/:', e);
    }
  }

  // 2. Tenta parâmetros de busca query (?api=1&origin=...&destination=...&waypoints=...)
  if (!result.origin || !result.destination) {
    try {
      const urlToParse = input.startsWith('http') ? input : `https://example.com/?${input}`;
      const parsedUrl = new URL(urlToParse);
      
      const qOrigin = parsedUrl.searchParams.get('origin');
      const qDest = parsedUrl.searchParams.get('destination');
      const qWaypoints = parsedUrl.searchParams.get('waypoints');

      if (qOrigin) result.origin = cleanLocationName(qOrigin);
      if (qDest) result.destination = cleanLocationName(qDest);

      if (qWaypoints) {
        const wpList = qWaypoints.split('|').map(cleanLocationName).filter(Boolean);
        result.waypoints = Array.from(new Set([...result.waypoints, ...wpList]));
      }

      // Parâmetros saddr e daddr (Google Maps clássico)
      const saddr = parsedUrl.searchParams.get('saddr');
      const daddr = parsedUrl.searchParams.get('daddr');
      if (saddr && !result.origin) result.origin = cleanLocationName(saddr);
      if (daddr && !result.destination) {
        // daddr pode conter 'to:Parada1 to:Parada2'
        const parts = daddr.split(/\s*\+?to:\s*/i);
        result.destination = cleanLocationName(parts[0]);
        if (parts.length > 1) {
          const extraWps = parts.slice(1).map(cleanLocationName).filter(Boolean);
          result.waypoints = Array.from(new Set([...result.waypoints, ...extraWps]));
        }
      }
    } catch {}
  }

  // 3. Se for texto puro separado por setas (ex: "Curitiba -> Morretes -> Antonina")
  if (!result.origin && !result.destination && (input.includes('->') || input.includes('➔') || input.includes('→') || (input.includes('/') && !input.startsWith('http')))) {
    const delimiter = input.includes('->') 
      ? '->' 
      : input.includes('➔') 
      ? '➔' 
      : input.includes('→') 
      ? '→' 
      : '/';

    const rawList = input.split(delimiter).map(s => cleanLocationName(s)).filter(Boolean);
    if (rawList.length >= 2) {
      result.origin = rawList[0];
      result.destination = rawList[rawList.length - 1];
      result.waypoints = rawList.slice(1, -1);
    }
  }

  // Título sugerido
  if (result.origin && result.destination) {
    result.title = `${result.origin} a ${result.destination}`;
  } else if (result.destination) {
    result.title = `Roteiro para ${result.destination}`;
  }

  // Sugestão de estágios/paradas com categorização
  result.suggestedStages = result.waypoints.map(wp => ({
    name: wp,
    type: guessStageType(wp),
    notes: ''
  }));

  // Gera o link oficial completo de navegação do Google Maps
  if (result.origin && result.destination) {
    const originParam = encodeURIComponent(result.origin);
    const destParam = encodeURIComponent(result.destination);
    const waypointsParam = result.waypoints.length > 0
      ? `&waypoints=${result.waypoints.map(w => encodeURIComponent(w)).join('|')}`
      : '';
    result.fullRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${waypointsParam}&travelmode=driving`;
  }

  return result;
}
