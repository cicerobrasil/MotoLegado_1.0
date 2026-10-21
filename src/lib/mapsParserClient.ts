/**
 * Utilitário cliente (navegador) para decodificação e análise de rotas do Google Maps,
 * garantindo resiliência offline ou caso o servidor demore a responder.
 */

export interface ParsedRouteClientResult {
  origin: string;
  destination: string;
  waypoints: string[];
  title: string;
  fullRouteUrl?: string;
  suggestedStages?: Array<{
    name: string;
    type: 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service' | 'custom';
    notes?: string;
  }>;
  estimatedDistanceKm?: number;
  estimatedDuration?: string;
}

function cleanLocationName(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  if (str.includes('?')) {
    str = str.split('?')[0];
  }

  str = str.replace(/\+/g, ' ');

  try {
    str = decodeURIComponent(str);
  } catch {
    // Mantém texto original caso decode falhe
  }

  str = str.replace(/^\/+|\/+$/g, '').trim();
  return str;
}

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
    lower.includes('motopeças') || 
    lower.includes('borracharia') || 
    lower.includes('revisão')
  ) {
    return 'service';
  }

  if (
    lower.includes('encontro') || 
    lower.includes('motoclube') || 
    lower.includes('sede') || 
    lower.includes('confraria')
  ) {
    return 'meet';
  }

  return 'scenic';
}

// Dicionário de coordenadas de cidades e regiões metropolitanas para cálculo offline/instantâneo de distâncias
export const CLIENT_CITY_COORDS: Record<string, [number, number]> = {
  // Rio Grande do Sul
  'porto alegre': [-51.2177, -30.0346],
  'porto alegre - rs': [-51.2177, -30.0346],
  'independência, porto alegre': [-51.2120, -30.0290],
  'av. independência, porto alegre': [-51.2120, -30.0290],
  'independencia, porto alegre': [-51.2120, -30.0290],
  'viamão': [-51.0242, -30.0811],
  'viamão - rs': [-51.0242, -30.0811],
  'viamao': [-51.0242, -30.0811],
  'viamao - rs': [-51.0242, -30.0811],
  'canoas': [-51.1837, -29.9179],
  'canoas - rs': [-51.1837, -29.9179],
  'gravataí': [-50.9922, -29.9439],
  'gravatai': [-50.9922, -29.9439],
  'alvorada': [-51.0825, -30.0028],
  'novo hamburgo': [-51.1306, -29.6783],
  'são leopoldo': [-51.1444, -29.7547],
  'caxias do sul': [-51.1794, -29.1678],
  'gramado': [-50.8736, -29.3789],
  'canela': [-50.8128, -29.3639],
  'bento gonçalves': [-51.5186, -29.1706],
  'pelotas': [-52.3426, -31.7654],
  'santa maria': [-53.8069, -29.6842],
  'passo fundo': [-52.4067, -28.2628],
  'torres': [-49.7269, -29.3361],
  'capão da canoa': [-50.0344, -29.7456],

  // Santa Catarina
  'itajaí': [-48.6658, -26.9078],
  'itajaí - sc': [-48.6658, -26.9078],
  'itajai': [-48.6658, -26.9078],
  'itajai - sc': [-48.6658, -26.9078],
  'balneário camboriú': [-48.6353, -26.9926],
  'balneario camboriu': [-48.6353, -26.9926],
  'florianópolis': [-48.5496, -27.5954],
  'florianopolis': [-48.5496, -27.5954],
  'joinville': [-48.8464, -26.3045],
  'blumenau': [-49.0661, -26.9194],
  'pomerode': [-49.1764, -26.7408],
  'brusque': [-48.9161, -27.0978],
  'navegantes': [-48.6547, -26.8978],
  'urubici': [-49.5919, -28.0150],
  'bom jardim da serra': [-49.6278, -28.3386],
  'são joaquim': [-49.9317, -28.2939],
  'serra do rio do rastro': [-49.5500, -28.3833],

  // Paraná
  'curitiba': [-49.2731, -25.4284],
  'curitiba - pr': [-49.2731, -25.4284],
  'morretes': [-48.8339, -25.4744],
  'antonina': [-48.7119, -25.4286],
  'paranaguá': [-48.5225, -25.5205],
  'ponta grossa': [-50.1619, -25.0994],
  'foz do iguaçu': [-54.5854, -25.5163],
  'londrina': [-51.1628, -23.3045],
  'maringá': [-51.9331, -23.4205],

  // São Paulo
  'são paulo': [-46.6333, -23.5505],
  'santos': [-46.3333, -23.9608],
  'campos do jordão': [-45.5908, -22.7394],
  'cunha': [-44.9583, -23.0767],
  'ubatuba': [-45.0689, -23.4339],
  'campinas': [-47.0608, -22.9099],
  'ribeirão preto': [-47.8103, -21.1704],

  // Rio de Janeiro
  'rio de janeiro': [-43.1729, -22.9068],
  'paraty': [-44.7136, -23.2178],
  'petrópolis': [-43.1822, -22.5050],
  'angra dos reis': [-44.3181, -23.0067],

  // Minas Gerais
  'belo horizonte': [-43.9378, -19.9208],
  'ouro preto': [-43.5036, -20.3856],
  'tiradentes': [-44.1758, -21.1108],

  // Centro-Oeste / Nordeste
  'brasília': [-47.9292, -15.7801],
  'brasilia': [-47.9292, -15.7801],
  'goiânia': [-49.2550, -16.6869],
  'salvador': [-38.5108, -12.9714]
};

export function lookupCoords(text: string): [number, number] | null {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  
  // 1. Busca exata
  if (CLIENT_CITY_COORDS[clean]) return CLIENT_CITY_COORDS[clean];

  // 2. Busca por termo contido
  for (const [key, coords] of Object.entries(CLIENT_CITY_COORDS)) {
    if (clean.includes(key)) return coords;
  }

  // 3. Normalização de caracteres
  const normalized = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, coords] of Object.entries(CLIENT_CITY_COORDS)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(keyNorm)) return coords;
  }

  return null;
}

export function extractMetricsFromTextClient(text: string): { distanceKm: number | null; duration: string | null } {
  if (!text) return { distanceKm: null, duration: null };
  let distanceKm: number | null = null;
  let duration: string | null = null;

  // 1. Extrai distância em KM (ex: "22,8 km", "22.8 km", "3,4 km", "185 km", "(22,8 km)")
  const distMatch = text.match(/(?:^|[^\w])(\d+(?:[.,]\d+)?)\s*(?:km|kms|quilômetros|quilometros)\b/i);
  if (distMatch) {
    const rawVal = distMatch[1].replace(',', '.');
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      distanceKm = Math.round(parsed * 10) / 10;
    }
  }

  // 2. Extrai duração em Horas e Minutos (ex: "1 h 15 min", "1h 15min", "1h15m", "1 hora e 15 minutos")
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
    // Apenas minutos (ex: "35 min", "35min", "35 minutos")
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

export function parseGoogleMapsRouteClient(urlOrText: string): ParsedRouteClientResult {
  const input = (urlOrText || '').trim();
  const result: ParsedRouteClientResult = {
    origin: '',
    destination: '',
    waypoints: [],
    title: '',
    suggestedStages: []
  };

  if (!input) return result;

  // 1. Padrão de texto compartilhado do app Google Maps
  // Ex: "De Curitiba para Morretes via BR-277. 1 h 15 min (68,4 km). Para o melhor trajeto..."
  const deParaMatch = input.match(/(?:De|de|From|from)\s+([\s\S]+?)\s+(?:para|p\/|a|to)\s+([\s\S]+)$/i);
  if (deParaMatch) {
    result.origin = cleanLocationName(deParaMatch[1].trim());
    let rest = deParaMatch[2].trim();
    // Remove métricas e URLs no final do texto
    rest = rest.replace(/(?:[.]\s*)?\d+\s*(?:h|hr|hrs|min|mins|m)\b[\s\S]*$/i, '').trim();
    rest = rest.replace(/\(\s*\d+(?:[.,]\d+)?\s*(?:km|kms)\s*\)[\s\S]*$/i, '').trim();
    rest = rest.replace(/https?:\/\/[^\s]+[\s\S]*$/i, '').trim();

    const viaM = rest.match(/([\s\S]+?)\s+(?:via|pela|pelo|by)\s+([\s\S]+?)(?:\.\s*$|$)/i);
    if (viaM) {
      result.destination = cleanLocationName(viaM[1].trim());
    } else {
      result.destination = cleanLocationName(rest.replace(/\.\s*$/, '').trim());
    }
  } else {
    // Tenta formato sem prefixo "De" (ex: "Curitiba para Morretes 68 km")
    const simpleMatch = input.match(/^([\s\S]+?)\s+(?:para|p\/|a|to)\s+([\s\S]+)$/i);
    if (simpleMatch && !simpleMatch[1].toLowerCase().startsWith('http')) {
      result.origin = cleanLocationName(simpleMatch[1].trim());
      let rest = simpleMatch[2].trim();
      rest = rest.replace(/(?:[.]\s*)?\d+\s*(?:h|hr|hrs|min|mins|m)\b[\s\S]*$/i, '').trim();
      rest = rest.replace(/\(\s*\d+(?:[.,]\d+)?\s*(?:km|kms)\s*\)[\s\S]*$/i, '').trim();
      result.destination = cleanLocationName(rest.replace(/\.\s*$/, '').trim());
    }
  }

  // Extrai métricas explícitas se existirem no texto
  const textMetrics = extractMetricsFromTextClient(input);
  if (textMetrics.distanceKm) {
    result.estimatedDistanceKm = textMetrics.distanceKm;
  }
  if (textMetrics.duration) {
    result.estimatedDuration = textMetrics.duration;
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
        if (!clean || clean.startsWith('@')) continue;
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
    } catch {}
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

  // 4. Texto puro separado por setas (ex: "Curitiba -> Morretes -> Antonina")
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

  if (result.origin && result.destination) {
    result.title = `${result.origin} a ${result.destination}`;
  } else if (result.destination) {
    result.title = `Roteiro para ${result.destination}`;
  }

  result.suggestedStages = result.waypoints.map(wp => ({
    name: wp,
    type: guessStageType(wp),
    notes: ''
  }));

  if (result.origin && result.destination) {
    const originParam = encodeURIComponent(result.origin);
    const destParam = encodeURIComponent(result.destination);
    const waypointsParam = result.waypoints.length > 0
      ? `&waypoints=${result.waypoints.map(w => encodeURIComponent(w)).join('|')}`
      : '';
    result.fullRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}${waypointsParam}&travelmode=driving`;
  }

  // 5. Se houver coordenadas na URL (!1d... !2d... ou @lat,lng), calcula distância direta com precisão
  if (!result.estimatedDistanceKm) {
    const coords: Array<[number, number]> = [];
    const addUnique = (lon: number, lat: number) => {
      if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        if (!coords.some(c => Math.abs(c[0] - lon) < 0.0002 && Math.abs(c[1] - lat) < 0.0002)) {
          coords.push([lon, lat]);
        }
      }
    };
    const m1 = [...input.matchAll(/!1d(-?\d+(?:\.\d+)?)[^!]*!2d(-?\d+(?:\.\d+)?)/g)];
    for (const m of m1) addUnique(parseFloat(m[1]), parseFloat(m[2]));
    
    if (coords.length >= 2) {
      let totalKm = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        totalKm += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      const roadKm = totalKm * 1.25;
      result.estimatedDistanceKm = Math.round(roadKm * 10) / 10;
    }
  }

  // Se não foi extraída distância do texto ou coordenadas da URL, busca cidades no dicionário offline
  if (!result.estimatedDistanceKm && result.origin && result.destination) {
    const cOrigin = lookupCoords(result.origin);
    const cDest = lookupCoords(result.destination);

    if (cOrigin && cDest) {
      const dLat = (cDest[1] - cOrigin[1]) * Math.PI / 180;
      const dLon = (cDest[0] - cOrigin[0]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(cOrigin[1] * Math.PI / 180) * Math.cos(cDest[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const totalKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const roadKm = Math.round(totalKm * 1.25 * 10) / 10;
      result.estimatedDistanceKm = roadKm;
    }
  }

  if (!result.estimatedDuration && result.estimatedDistanceKm) {
    const avgSpeed = result.estimatedDistanceKm < 35 ? 38 : 68;
    const totalMins = Math.round((result.estimatedDistanceKm / avgSpeed) * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    result.estimatedDuration = h > 0 
      ? `${h}h ${m > 0 ? `${m}min` : '00min'}`.trim()
      : `${totalMins}min`;
  }

  return result;
}
