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
  viaRoad?: string;
  coords?: Array<[number, number]>;
  suggestedStages?: Array<{
    name: string;
    type: 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service' | 'custom';
    notes?: string;
  }>;
}

/**
 * Extrai distância (KM) e duração (ex: "1h 15min") diretamente de textos compartilhados do Google Maps
 * Exemplo: "De Curitiba para Morretes via BR-277. 1 h 15 min (68,4 km). Para o melhor trajeto..."
 */
export function extractMetricsFromText(text: string): { distanceKm: number | null; duration: string | null } {
  if (!text) return { distanceKm: null, duration: null };
  let distanceKm: number | null = null;
  let duration: string | null = null;

  // 1. Extrai distância em KM (ex: "68,4 km", "68.4 km", "3,4 km", "185 km", "(68 km)")
  const distMatch = text.match(/(?:^|[^\w])(\d+(?:[.,]\d+)?)\s*(?:km|kms|quilômetros|quilometros)\b/i);
  if (distMatch) {
    const rawVal = distMatch[1].replace(',', '.');
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      distanceKm = Math.round(parsed * 10) / 10;
    }
  }

  // 2. Extrai duração em Horas e Minutos (ex: "1 h 15 min", "1h 15min", "1h15m", "1 hr 15 min", "1 hora e 15 minutos")
  const hmMatch = text.match(/(\d+)\s*(?:h|hr|hrs|hora|horas)\s*(?:e\s*)?(\d+)?\s*(?:min|mins|minuto|minutos|m)?\b/i);
  if (hmMatch) {
    const hours = parseInt(hmMatch[1], 10);
    const mins = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    if (hours > 0 || mins > 0) {
      duration = hours > 0 
        ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}`
        : `${mins}min`;
    }
  } else {
    // Apenas minutos (ex: "45 min", "45min", "45 minutos")
    const mMatch = text.match(/(\d+)\s*(?:min|mins|minuto|minutos|m)\b/i);
    if (mMatch) {
      const mins = parseInt(mMatch[1], 10);
      if (mins > 0) {
        const hours = Math.floor(mins / 60);
        const remMins = mins % 60;
        duration = hours > 0
          ? `${hours}h ${remMins > 0 ? `${remMins}min` : '00min'}`
          : `${mins}min`;
      }
    }
  }

  return { distanceKm, duration };
}

// Cache em memória de geocodificação para respostas instantâneas
const geocodeCache = new Map<string, [number, number]>([
  ['curitiba', [-49.2731, -25.4284]],
  ['curitiba - pr', [-49.2731, -25.4284]],
  ['morretes', [-48.8339, -25.4744]],
  ['morretes - pr', [-48.8339, -25.4744]],
  ['antonina', [-48.7119, -25.4286]],
  ['antonina - pr', [-48.7119, -25.4286]],
  ['paranaguá', [-48.5225, -25.5205]],
  ['ponta grossa', [-50.1619, -25.0994]],
  ['são paulo', [-46.6333, -23.5505]],
  ['santos', [-46.3333, -23.9608]],
  ['campos do jordão', [-45.5908, -22.7394]],
  ['cunha', [-44.9583, -23.0767]],
  ['paraty', [-44.7136, -23.2178]],
  ['ubatuba', [-45.0689, -23.4339]],
  ['rio de janeiro', [-43.1729, -22.9068]],
  ['belo horizonte', [-43.9378, -19.9208]],
  ['ouro preto', [-43.5036, -20.3856]],
  ['tiradentes', [-44.1758, -21.1108]],
  ['florianópolis', [-48.5496, -27.5954]],
  ['balneário camboriú', [-48.6353, -26.9926]],
  ['blumenau', [-49.0661, -26.9194]],
  ['pomerode', [-49.1764, -26.7408]],
  ['urubici', [-49.5919, -28.0150]],
  ['bom jardim da serra', [-49.6278, -28.3386]],
  ['são joaquim', [-49.9317, -28.2939]],
  ['lauro müller', [-49.3958, -28.3931]],
  ['serra do rio do rastro', [-49.5500, -28.3833]],
  ['gramado', [-50.8736, -29.3789]],
  ['canela', [-50.8128, -29.3639]],
  ['bento gonçalves', [-51.5186, -29.1706]],
  ['porto alegre', [-51.2177, -30.0346]],
  ['brasília', [-47.9292, -15.7801]],
  ['goiânia', [-49.2550, -16.6869]]
]);

/**
 * Extrai coordenadas geográficas embutidas diretamente na URL do Google Maps
 */
export function extractCoordinatesFromUrl(url: string): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  if (!url) return coords;

  const addUniqueCoord = (lon: number, lat: number) => {
    if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    const isDup = coords.some(c => Math.abs(c[0] - lon) < 0.0002 && Math.abs(c[1] - lat) < 0.0002);
    if (!isDup) {
      coords.push([lon, lat]);
    }
  };

  // 1. Formato Google Maps data waypoints: !1d<lon>!2d<lat> (muito comum em rotas com direções)
  const dataMatches1 = [...url.matchAll(/!1d(-?\d+(?:\.\d+)?)[^!]*!2d(-?\d+(?:\.\d+)?)/g)];
  for (const m of dataMatches1) {
    addUniqueCoord(parseFloat(m[1]), parseFloat(m[2]));
  }

  // 2. Formato !3d<lat>!4d<lon> (Google Maps places e waypoints clássicos)
  if (coords.length === 0) {
    const placeMatches = [...url.matchAll(/!3d(-?\d+(?:\.\d+)?)(?:!4d(-?\d+(?:\.\d+)?))/g)];
    for (const m of placeMatches) {
      addUniqueCoord(parseFloat(m[2]), parseFloat(m[1]));
    }
  }

  // 3. Formato /dir/lat,lon/lat,lon/
  const dirCoordsMatches = [...url.matchAll(/\/(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/g)];
  for (const m of dirCoordsMatches) {
    addUniqueCoord(parseFloat(m[2]), parseFloat(m[1]));
  }

  // 4. Formato @<lat>,<lon> (centro do mapa, caso não tenha pontos intermediários)
  if (coords.length === 0) {
    const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      addUniqueCoord(parseFloat(atMatch[2]), parseFloat(atMatch[1]));
    }
  }

  return coords;
}

/**
 * Interpreta texto compartilhado do app Google Maps no celular (Android/iOS)
 * Ex: "De Curitiba para Morretes via BR-277. 1 h 15 min (68,4 km). Para o melhor trajeto..."
 */
export function parseGoogleMapsShareText(input: string): {
  origin: string | null;
  destination: string | null;
  viaRoad: string | null;
  distanceKm: number | null;
  duration: string | null;
  url: string | null;
} {
  let url: string | null = null;
  const urlMatch = input.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    url = urlMatch[0];
  }

  const { distanceKm, duration } = extractMetricsFromText(input);

  let origin: string | null = null;
  let destination: string | null = null;
  let viaRoad: string | null = null;

  // Padrão em português e inglês: "De <Origem> para <Destino> via <Rodovia>"
  const deParaMatch = input.match(/(?:De|de|From|from)\s+([\s\S]+?)\s+(?:para|p\/|a|to)\s+([\s\S]+)$/i);
  if (deParaMatch) {
    origin = cleanLocationName(deParaMatch[1].trim());
    let rest = deParaMatch[2].trim();
    // Remove métricas e URLs no final do texto
    rest = rest.replace(/(?:[.]\s*)?\d+\s*(?:h|hr|hrs|min|mins|m)\b[\s\S]*$/i, '').trim();
    rest = rest.replace(/\(\s*\d+(?:[.,]\d+)?\s*(?:km|kms)\s*\)[\s\S]*$/i, '').trim();
    rest = rest.replace(/https?:\/\/[^\s]+[\s\S]*$/i, '').trim();

    const viaM = rest.match(/([\s\S]+?)\s+(?:via|pela|pelo|by)\s+([\s\S]+?)(?:\.\s*$|$)/i);
    if (viaM) {
      destination = cleanLocationName(viaM[1].trim());
      viaRoad = cleanLocationName(viaM[2].trim().replace(/\.$/, ''));
    } else {
      destination = cleanLocationName(rest.replace(/\.\s*$/, '').trim());
    }
  }

  return { origin, destination, viaRoad, distanceKm, duration, url };
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
 * Calcula distância entre dois pontos (Haversine) em KM
 */
function haversineDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula distância rodoviária real (em KM) e duração de viagem (em horas/minutos)
 * para motocicletas usando coordenadas do Google Maps + OSRM ou geocodificação resiliente
 */
export async function calculateRouteDistanceAndDuration(
  origin: string,
  destination: string,
  waypoints: string[] = [],
  precomputedCoords?: Array<[number, number]>
): Promise<{ distanceKm: number; duration: string } | null> {
  const allLocations = [origin, ...waypoints, destination].map(s => s.trim()).filter(Boolean);
  
  if (allLocations.length < 2 && (!precomputedCoords || precomputedCoords.length < 2)) {
    return null;
  }

  try {
    let validCoords: Array<[number, number]> = [];

    // Se já temos coordenadas exatas da URL do Google Maps, usa diretamente!
    if (precomputedCoords && precomputedCoords.length >= 2) {
      validCoords = precomputedCoords;
    } else {
      // Geocodifica cada parada buscando termos inteligentes
      const coordsResults: Array<[number, number] | null> = [];

      for (const loc of allLocations) {
        const normKey = loc.toLowerCase().trim();
        let found: [number, number] | null = geocodeCache.get(normKey) || null;

        if (!found) {
          const candidates = getQueryCandidates(loc);

          // 1. Tenta Photon (Komoot) primeiro por ser muito rápido e sem restrição de IP
          for (const q of candidates) {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3500);

              const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`, {
                signal: controller.signal
              });
              clearTimeout(timeout);

              if (photonRes.ok) {
                const pData = await photonRes.json();
                if (pData?.features?.[0]?.geometry?.coordinates) {
                  const [lon, lat] = pData.features[0].geometry.coordinates;
                  if (!isNaN(lon) && !isNaN(lat)) {
                    found = [parseFloat(lon), parseFloat(lat)];
                    geocodeCache.set(normKey, found);
                    break;
                  }
                }
              }
            } catch {}
          }

          // 2. Se Photon não encontrou, tenta Nominatim OpenStreetMap
          if (!found) {
            for (const q of candidates.slice(0, 2)) {
              try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3500);

                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
                  signal: controller.signal,
                  headers: { 'User-Agent': 'MotoLegadoApp/2.0 (contato@motolegado.com.br)' }
                });
                clearTimeout(timeout);

                if (res.ok) {
                  const data = await res.json();
                  if (data && data[0] && data[0].lat && data[0].lon) {
                    found = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
                    geocodeCache.set(normKey, found);
                    break;
                  }
                }
              } catch {}
            }
          }
        }

        coordsResults.push(found);
      }

      validCoords = coordsResults.filter((c): c is [number, number] => c !== null);
    }

    // Se obteve coordenadas válidas para pelo menos 2 pontos, calcula a rota rodoviária via OSRM
    if (validCoords.length >= 2) {
      const coordString = validCoords.map(c => `${c[0]},${c[1]}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const osrmRes = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const routeData = await osrmRes.json();
        if (routeData && routeData.routes && routeData.routes[0]) {
          const meters = routeData.routes[0].distance;
          const seconds = routeData.routes[0].duration;

          const distanceRaw = meters / 1000;
          const distanceKm = Math.round(distanceRaw * 10) / 10;
          const totalMinutes = Math.max(1, Math.round(seconds / 60));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          const durationStr = hours > 0 
            ? `${hours}h ${minutes > 0 ? `${minutes}min` : '00min'}`.trim()
            : `${minutes}min`;

          return { distanceKm, duration: durationStr };
        }
      }

      // Se OSRM falhar, calcula distância real aproximada via Haversine com fator de sinuosidade rodoviária (1.28x)
      let totalHaversine = 0;
      for (let i = 0; i < validCoords.length - 1; i++) {
        totalHaversine += haversineDistanceKm(validCoords[i], validCoords[i + 1]);
      }
      if (totalHaversine > 0) {
        const roadRaw = totalHaversine * 1.25;
        const roadKm = Math.round(roadRaw * 10) / 10;
        // Velocidade média em motocicleta de turismo com paradas (~68 km/h ou ~38 km/h se urbano)
        const avgSpeed = roadKm < 35 ? 38 : 68;
        const totalMin = Math.round((roadKm / avgSpeed) * 60);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return {
          distanceKm: roadKm,
          duration: h > 0 ? `${h}h ${m > 0 ? `${m}min` : '00min'}` : `${m}min`
        };
      }
    }
  } catch (err) {
    console.warn('[RouteCalculator] Erro no cálculo OSRM:', err);
  }

  // Se não foi possível geocodificar com precisão, retorna null para não injetar valores falsos
  return null;
}

export function parseGoogleMapsRoute(urlOrText: string, originalInput?: string): ParsedRouteResult {
  const input = (urlOrText || '').trim();
  const rawSource = (originalInput || input).trim();

  const result: ParsedRouteResult = {
    origin: '',
    destination: '',
    waypoints: [],
    title: '',
    suggestedStages: []
  };

  if (!input && !rawSource) return result;

  // 1. Tenta extrair primeiro do formato de compartilhamento do celular (WhatsApp, Google Maps share)
  // Ex: "De Curitiba para Morretes via BR-277. 1 h 15 min (68,4 km). Para o melhor trajeto..."
  const shareTextInfo = parseGoogleMapsShareText(rawSource);
  if (shareTextInfo.origin && shareTextInfo.destination) {
    result.origin = shareTextInfo.origin;
    result.destination = shareTextInfo.destination;
    if (shareTextInfo.viaRoad) {
      result.viaRoad = shareTextInfo.viaRoad;
    }
    if (shareTextInfo.distanceKm) {
      result.estimatedDistanceKm = shareTextInfo.distanceKm;
    }
    if (shareTextInfo.duration) {
      result.estimatedDuration = shareTextInfo.duration;
    }
  }

  // Extrai métricas explícitas se existirem no texto
  if (!result.estimatedDistanceKm || !result.estimatedDuration) {
    const textMetrics = extractMetricsFromText(rawSource);
    if (!result.estimatedDistanceKm && textMetrics.distanceKm) {
      result.estimatedDistanceKm = textMetrics.distanceKm;
    }
    if (!result.estimatedDuration && textMetrics.duration) {
      result.estimatedDuration = textMetrics.duration;
    }
  }

  // Extrai coordenadas da URL se existirem sem duplicar
  const rawCoords = extractCoordinatesFromUrl(input);
  if (rawCoords.length < 2 && rawSource && rawSource !== input) {
    rawCoords.push(...extractCoordinatesFromUrl(rawSource));
  }
  if (rawCoords.length >= 2) {
    result.coords = rawCoords;
  }

  // 2. Tenta formato com /maps/dir/ ponto1 / ponto2 / ponto3...
  if ((!result.origin || !result.destination) && (input.includes('/maps/dir/') || input.includes('/dir/'))) {
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
      } else if (rawPoints.length === 1 && !result.destination) {
        result.destination = rawPoints[0];
      }
    } catch (e) {
      console.warn('[ParseMaps] Falha ao parsear path /dir/:', e);
    }
  }

  // 3. Tenta parâmetros de busca query (?api=1&origin=...&destination=...&waypoints=...)
  if (!result.origin || !result.destination) {
    try {
      const urlToParse = input.startsWith('http') ? input : `https://example.com/?${input}`;
      const parsedUrl = new URL(urlToParse);
      
      const qOrigin = parsedUrl.searchParams.get('origin');
      const qDest = parsedUrl.searchParams.get('destination');
      const qWaypoints = parsedUrl.searchParams.get('waypoints');

      if (qOrigin && !result.origin) result.origin = cleanLocationName(qOrigin);
      if (qDest && !result.destination) result.destination = cleanLocationName(qDest);

      if (qWaypoints) {
        const wpList = qWaypoints.split('|').map(cleanLocationName).filter(Boolean);
        result.waypoints = Array.from(new Set([...result.waypoints, ...wpList]));
      }

      // Parâmetros saddr e daddr (Google Maps clássico)
      const saddr = parsedUrl.searchParams.get('saddr');
      const daddr = parsedUrl.searchParams.get('daddr');
      if (saddr && !result.origin) result.origin = cleanLocationName(saddr);
      if (daddr && !result.destination) {
        const parts = daddr.split(/\s*\+?to:\s*/i);
        result.destination = cleanLocationName(parts[0]);
        if (parts.length > 1) {
          const extraWps = parts.slice(1).map(cleanLocationName).filter(Boolean);
          result.waypoints = Array.from(new Set([...result.waypoints, ...extraWps]));
        }
      }
    } catch {}
  }

  // 4. Se for texto puro separado por setas (ex: "Curitiba -> Morretes -> Antonina")
  if (!result.origin && !result.destination && (rawSource.includes('->') || rawSource.includes('➔') || rawSource.includes('→') || (rawSource.includes('/') && !rawSource.startsWith('http')))) {
    const delimiter = rawSource.includes('->') 
      ? '->' 
      : rawSource.includes('➔') 
      ? '➔' 
      : rawSource.includes('→') 
      ? '→' 
      : '/';

    const rawList = rawSource.split(delimiter).map(s => cleanLocationName(s)).filter(Boolean);
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
