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

export function extractMetricsFromTextClient(text: string): { distanceKm: number | null; duration: string | null } {
  if (!text) return { distanceKm: null, duration: null };
  let distanceKm: number | null = null;
  let duration: string | null = null;

  // 1. Extrai distância em KM (ex: "68,4 km", "68.4 km", "3,4 km", "185 km", "(68 km)")
  const distMatch = text.match(/(?:^|[^\w])(\d+(?:[.,]\d+)?)\s*(?:km|kms|quilômetros|quilometros)\b/i);
  if (distMatch) {
    const rawVal = distMatch[1].replace(',', '.');
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      distanceKm = parsed < 10 ? Math.round(parsed * 10) / 10 : Math.round(parsed);
    }
  }

  // 2. Extrai duração em Horas e Minutos
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

  // Se não foi extraída distância do texto, calcula estimativa coerente
  if (!result.estimatedDistanceKm) {
    const normOrigin = (result.origin || '').toLowerCase();
    const normDest = (result.destination || '').toLowerCase();
    const isUrban = (normOrigin.includes('rio de janeiro') && normDest.includes('rio de janeiro')) ||
      (normOrigin.includes('são paulo') && normDest.includes('são paulo')) ||
      (normOrigin.includes('curitiba') && normDest.includes('curitiba')) ||
      (normOrigin.includes('belo horizonte') && normDest.includes('belo horizonte'));

    if (isUrban) {
      result.estimatedDistanceKm = 5;
      result.estimatedDuration = '15min';
    } else {
      const allPoints = [result.origin, ...result.waypoints, result.destination].filter(Boolean);
      const legCount = Math.max(1, allPoints.length - 1);
      result.estimatedDistanceKm = Math.round(legCount * 60);
    }
  }

  if (!result.estimatedDuration && result.estimatedDistanceKm) {
    const avgSpeed = result.estimatedDistanceKm < 20 ? 35 : 72;
    const totalMins = Math.round((result.estimatedDistanceKm / avgSpeed) * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    result.estimatedDuration = `${h}h ${m > 0 ? `${m}min` : '00min'}`.trim();
  }

  return result;
}
