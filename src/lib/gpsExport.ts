/**
 * ============================================================================
 * GERADOR DE ARQUIVOS GPX E KML PARA GPS EXTERNOS (MotoLegado)
 * ============================================================================
 * 
 * Permite a exportação de rotas e viagens planejadas para formatos universais:
 * - GPX 1.1: Garmin Zūmo, TomTom Rider, BMW Motorrad, OsmAnd, Gaia GPS, Calimoto.
 * - KML 2.2: Google Earth, Google My Maps, Organic Maps, Maps.me.
 */

import { Route } from '../types';

export interface GpsWaypoint {
  name: string;
  desc?: string;
  lat: number;
  lon: number;
  ele?: number;
  type?: 'start' | 'end' | 'stage' | 'fuel' | 'food' | 'scenic' | 'sleep' | 'meet' | 'service';
}

export interface GpsExportData {
  title: string;
  description?: string;
  author?: string;
  difficulty?: string;
  distanceKm?: number;
  duration?: string;
  originName?: string;
  destName?: string;
  waypoints: GpsWaypoint[];
  trackPoints: Array<{ lat: number; lon: number; ele?: number }>;
}

// Banco offline de coordenadas das principais cidades, serras e pontos de parada de motociclismo no Brasil
const BRAZILIAN_MOTORCYCLE_PLACES: Record<string, { lat: number; lon: number; ele?: number }> = {
  // Serras e Roteiros Famosos
  'serra do rio do rastro': { lat: -28.3915, lon: -49.5539, ele: 1421 },
  'serra da graciosa': { lat: -25.3500, lon: -48.9167, ele: 850 },
  'serra do corvo branco': { lat: -28.0536, lon: -49.3711, ele: 1470 },
  'serra da bocaina': { lat: -22.7500, lon: -44.6000, ele: 1500 },
  'serra da mantiqueira': { lat: -22.4500, lon: -45.0000, ele: 1600 },
  'serra da canastra': { lat: -20.2500, lon: -46.5000, ele: 1200 },
  'rota do sol': { lat: -29.2800, lon: -50.1500, ele: 900 },
  'rota romantica': { lat: -29.5000, lon: -51.1000, ele: 600 },
  'estrada real': { lat: -20.3856, lon: -43.5036, ele: 1100 },
  'estrada parque transpantaneira': { lat: -16.4300, lon: -56.6300, ele: 120 },

  // Paraná
  'curitiba': { lat: -25.4284, lon: -49.2733, ele: 934 },
  'morretes': { lat: -25.4764, lon: -48.8344, ele: 10 },
  'antonina': { lat: -25.4294, lon: -48.7128, ele: 5 },
  'paranagua': { lat: -25.5205, lon: -48.5092, ele: 5 },
  'guaratuba': { lat: -25.8828, lon: -48.5750, ele: 6 },
  'foz do iguacu': { lat: -25.5163, lon: -54.5854, ele: 192 },
  'londrina': { lat: -23.3045, lon: -51.1696, ele: 610 },
  'maringa': { lat: -23.4210, lon: -51.9331, ele: 515 },
  'ponta grossa': { lat: -25.0994, lon: -50.1583, ele: 975 },
  'castro': { lat: -24.7911, lon: -50.0125, ele: 999 },
  'tibagi': { lat: -24.5097, lon: -50.4136, ele: 770 },

  // Santa Catarina
  'florianopolis': { lat: -27.5954, lon: -48.5480, ele: 3 },
  'urubici': { lat: -28.0147, lon: -49.5919, ele: 915 },
  'bom jardim da serra': { lat: -28.3381, lon: -49.6272, ele: 1245 },
  'sao joaquim': { lat: -28.2939, lon: -49.9317, ele: 1360 },
  'lages': { lat: -27.8161, lon: -50.3261, ele: 916 },
  'lauro muller': { lat: -28.3931, lon: -49.3981, ele: 220 },
  'blumenau': { lat: -26.9194, lon: -49.0661, ele: 21 },
  'pomerode': { lat: -26.7411, lon: -49.1764, ele: 68 },
  'joinville': { lat: -26.3045, lon: -48.8487, ele: 4 },
  'balneario camboriu': { lat: -26.9926, lon: -48.6353, ele: 2 },
  'itajaí': { lat: -26.9078, lon: -48.6619, ele: 2 },
  'garopaba': { lat: -28.0264, lon: -48.6186, ele: 18 },
  'imbituba': { lat: -28.2400, lon: -48.6703, ele: 20 },

  // Rio Grande do Sul
  'porto alegre': { lat: -30.0346, lon: -51.2177, ele: 10 },
  'gramado': { lat: -29.3746, lon: -50.8764, ele: 850 },
  'canela': { lat: -29.3653, lon: -50.8122, ele: 837 },
  'bento goncalves': { lat: -29.1706, lon: -51.5189, ele: 690 },
  'garibaldi': { lat: -29.2558, lon: -51.5342, ele: 617 },
  'caxias do sul': { lat: -29.1681, lon: -51.1794, ele: 817 },
  'cambara do sul': { lat: -29.0478, lon: -50.1444, ele: 1031 },
  'torres': { lat: -29.3364, lon: -49.7269, ele: 16 },
  'sao francisco de paula': { lat: -29.4481, lon: -50.5822, ele: 907 },

  // São Paulo
  'sao paulo': { lat: -23.5505, lon: -46.6333, ele: 760 },
  'santos': { lat: -23.9608, lon: -46.3331, ele: 2 },
  'campos do jordao': { lat: -22.7394, lon: -45.5914, ele: 1628 },
  'sao bento do sapucai': { lat: -22.6881, lon: -45.7336, ele: 886 },
  'cunha': { lat: -23.0744, lon: -44.9592, ele: 950 },
  'ubatuba': { lat: -23.4339, lon: -45.0711, ele: 3 },
  'sao sebastiao': { lat: -23.7600, lon: -45.4097, ele: 2 },
  'ilha bela': { lat: -23.7781, lon: -45.3564, ele: 5 },
  'campinas': { lat: -22.9099, lon: -47.0626, ele: 685 },
  'ribeirao preto': { lat: -21.1775, lon: -47.8103, ele: 546 },
  'sorocaba': { lat: -23.5015, lon: -47.4526, ele: 601 },
  'botucatu': { lat: -22.8858, lon: -48.4450, ele: 804 },
  'socorro': { lat: -22.5925, lon: -46.5286, ele: 752 },
  'serra negra': { lat: -22.6125, lon: -46.7003, ele: 925 },
  'aguas de lindoia': { lat: -22.4764, lon: -46.6328, ele: 945 },

  // Rio de Janeiro
  'rio de janeiro': { lat: -22.9068, lon: -43.1729, ele: 10 },
  'paraty': { lat: -23.2178, lon: -44.7131, ele: 5 },
  'angra dos reis': { lat: -23.0067, lon: -44.3181, ele: 6 },
  'petropolis': { lat: -22.5050, lon: -43.1789, ele: 845 },
  'teresopolis': { lat: -22.4123, lon: -42.9664, ele: 871 },
  'nova friburgo': { lat: -22.2886, lon: -42.5342, ele: 846 },
  'itatiaia': { lat: -22.4961, lon: -44.5633, ele: 505 },
  'penedo': { lat: -22.4411, lon: -44.5261, ele: 540 },
  'visconde de maua': { lat: -22.3311, lon: -44.5422, ele: 1100 },
  'buzios': { lat: -22.7564, lon: -41.8886, ele: 5 },
  'cabo frio': { lat: -22.8797, lon: -42.0194, ele: 4 },

  // Minas Gerais
  'belo horizonte': { lat: -19.9167, lon: -43.9345, ele: 852 },
  'ouro preto': { lat: -20.3856, lon: -43.5036, ele: 1116 },
  'mariana': { lat: -20.3778, lon: -43.4161, ele: 697 },
  'tiradentes': { lat: -21.1106, lon: -44.1772, ele: 927 },
  'sao joao del rei': { lat: -21.1356, lon: -44.2617, ele: 898 },
  'capitolio': { lat: -20.6144, lon: -46.0506, ele: 760 },
  'diamantina': { lat: -18.2439, lon: -43.6031, ele: 1280 },
  'monte verde': { lat: -22.8631, lon: -46.0378, ele: 1555 },
  'goncalves': { lat: -22.6575, lon: -45.8569, ele: 1350 },
  'pocos de caldas': { lat: -21.7878, lon: -46.5614, ele: 1200 },
  'sao lourenco': { lat: -22.1158, lon: -45.0533, ele: 875 },
  'caxambu': { lat: -21.9772, lon: -44.9331, ele: 890 },

  // Centro-Oeste / Nordeste / Norte
  'brasilia': { lat: -15.7975, lon: -47.8919, ele: 1172 },
  'goiania': { lat: -16.6869, lon: -49.2648, ele: 749 },
  'pirenopolis': { lat: -15.8519, lon: -48.9592, ele: 770 },
  'bonito': { lat: -21.1264, lon: -56.4819, ele: 315 },
  'chapada dos guimaraes': { lat: -15.4606, lon: -55.7497, ele: 811 },
  'salvador': { lat: -12.9777, lon: -38.5016, ele: 8 },
  'lencois': { lat: -12.5636, lon: -41.3911, ele: 394 },
  'recife': { lat: -8.0476, lon: -34.8770, ele: 4 },
  'maceio': { lat: -9.6498, lon: -35.7089, ele: 7 },
  'natal': { lat: -5.7945, lon: -35.2110, ele: 30 },
  'fortaleza': { lat: -3.7172, lon: -38.5433, ele: 21 },
  'palmas': { lat: -10.2491, lon: -48.3243, ele: 260 },
  'manaus': { lat: -3.1190, lon: -60.0217, ele: 92 },
  'belem': { lat: -1.4558, lon: -48.4902, ele: 10 }
};

/**
 * Normaliza uma string de texto removendo acentos e pontuações para busca geográfica
 */
function normalizePlaceName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tenta extrair coordenadas lat,lon diretamente de uma string ou link do Google Maps
 */
export function extractCoordsFromTextOrUrl(text: string): { lat: number; lon: number } | null {
  if (!text) return null;

  // 1. Tenta formato explícito lat, lon (ex: "-25.4284, -49.2733")
  const explicitMatch = text.match(/(-?\d{1,2}\.\d{3,7})[,\s]+(-?\d{1,3}\.\d{3,7})/);
  if (explicitMatch) {
    const lat = parseFloat(explicitMatch[1]);
    const lon = parseFloat(explicitMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 2. Tenta padrão de coordenadas do Google Maps (@-25.4284,-49.2733)
  const atMatch = text.match(/@(-?\d{1,2}\.\d{3,7}),(-?\d{1,3}\.\d{3,7})/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 3. Tenta query params ll=-25.4,-49.2 ou q=-25.4,-49.2 ou destination=-25.4,-49.2
  const paramMatch = text.match(/(?:q|ll|destination|origin|center)=(-?\d{1,2}\.\d{3,7}),(-?\d{1,3}\.\d{3,7})/i);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lon = parseFloat(paramMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

/**
 * Encontra coordenadas para um nome de local ou endereço usando o banco local de pontos
 */
export function resolvePlaceCoordinates(query: string): { lat: number; lon: number; ele?: number } {
  if (!query) {
    return { lat: -25.4284, lon: -49.2733, ele: 934 }; // Fallback Curitiba
  }

  // 1. Primeiro tenta coordenadas embutidas no texto
  const direct = extractCoordsFromTextOrUrl(query);
  if (direct) {
    return { lat: direct.lat, lon: direct.lon, ele: 500 };
  }

  // 2. Busca no banco de locais conhecidos por correspondência exata ou parcial
  const normQuery = normalizePlaceName(query);

  // Busca exata
  if (BRAZILIAN_MOTORCYCLE_PLACES[normQuery]) {
    return BRAZILIAN_MOTORCYCLE_PLACES[normQuery];
  }

  // Busca por contenção (ex: "serra do rio do rastro - sc" contém "serra do rio do rastro")
  for (const [placeName, coords] of Object.entries(BRAZILIAN_MOTORCYCLE_PLACES)) {
    if (normQuery.includes(placeName) || placeName.includes(normQuery)) {
      return coords;
    }
  }

  // Palavras-chave parciais (cidade no endereço)
  for (const [placeName, coords] of Object.entries(BRAZILIAN_MOTORCYCLE_PLACES)) {
    const words = placeName.split(' ');
    if (words.length >= 2 && words.every(w => normQuery.includes(w))) {
      return coords;
    }
  }

  // Fallback seguro: se menciona "sc" ou "santa catarina"
  if (normQuery.includes(' sc ') || normQuery.endsWith(' sc') || normQuery.includes('santa catarina')) {
    return { lat: -27.5954, lon: -48.5480, ele: 50 };
  }
  // Se menciona "sp" ou "sao paulo"
  if (normQuery.includes(' sp ') || normQuery.endsWith(' sp') || normQuery.includes('sao paulo')) {
    return { lat: -23.5505, lon: -46.6333, ele: 760 };
  }
  // Se menciona "rj" ou "rio de janeiro"
  if (normQuery.includes(' rj ') || normQuery.endsWith(' rj') || normQuery.includes('rio de janeiro')) {
    return { lat: -22.9068, lon: -43.1729, ele: 10 };
  }
  // Se menciona "mg" ou "minas"
  if (normQuery.includes(' mg ') || normQuery.endsWith(' mg') || normQuery.includes('minas')) {
    return { lat: -19.9167, lon: -43.9345, ele: 852 };
  }
  // Se menciona "rs" ou "rio grande do sul"
  if (normQuery.includes(' rs ') || normQuery.endsWith(' rs') || normQuery.includes('rio grande do sul')) {
    return { lat: -29.3746, lon: -50.8764, ele: 850 };
  }

  return { lat: -25.4284, lon: -49.2733, ele: 934 };
}

/**
 * Interpola pontos intermediários suaves ao longo de dois waypoints para gerar um track/traçado
 * realista com curvas leves para o GPS externo
 */
export function interpolateTrackPoints(
  start: { lat: number; lon: number; ele?: number },
  end: { lat: number; lon: number; ele?: number },
  numSegments = 16
): Array<{ lat: number; lon: number; ele?: number }> {
  const points: Array<{ lat: number; lon: number; ele?: number }> = [];

  const startEle = start.ele || 500;
  const endEle = end.ele || 500;

  for (let i = 0; i <= numSegments; i++) {
    const fraction = i / numSegments;
    // Interpolação linear base
    const baseLat = start.lat + (end.lat - start.lat) * fraction;
    const baseLon = start.lon + (end.lon - start.lon) * fraction;
    const ele = Math.round(startEle + (endEle - startEle) * fraction);

    // Adiciona uma leve curvatura senoidal suave que simula estradas reais
    if (i > 0 && i < numSegments) {
      const wobble = Math.sin(fraction * Math.PI) * 0.008;
      points.push({
        lat: Number((baseLat + wobble * 0.6).toFixed(6)),
        lon: Number((baseLon + wobble).toFixed(6)),
        ele
      });
    } else {
      points.push({
        lat: Number(baseLat.toFixed(6)),
        lon: Number(baseLon.toFixed(6)),
        ele
      });
    }
  }

  return points;
}

/**
 * Prepara todos os dados necessários a partir de uma Route ou Trip
 */
export function buildGpsExportDataFromRoute(route: Route): GpsExportData {
  const waypoints: GpsWaypoint[] = [];

  // 1. Origem
  const originQuery = route.startPoint || 'Ponto de Partida';
  const originCoords = resolvePlaceCoordinates(route.startPoint || route.name);
  waypoints.push({
    name: route.startPoint || 'Partida',
    desc: `Origem do roteiro: ${route.name}`,
    lat: originCoords.lat,
    lon: originCoords.lon,
    ele: originCoords.ele,
    type: 'start'
  });

  // 2. Destino
  const destQuery = route.mapsAddress || route.endPoint || route.name;
  const destCoords = resolvePlaceCoordinates(destQuery);
  waypoints.push({
    name: route.mapsAddress || route.endPoint || route.name,
    desc: `Destino do roteiro: ${route.name}`,
    lat: destCoords.lat,
    lon: destCoords.lon,
    ele: destCoords.ele,
    type: 'end'
  });

  // 3. Traçado do percurso
  const trackPoints = interpolateTrackPoints(originCoords, destCoords, 24);

  return {
    title: route.name,
    description: `${route.description || ''}\n\nDicas Técnicas: ${route.riderTips || ''}\nDificuldade: ${route.difficulty || 'Médio'}`,
    author: route.author?.name || 'MotoLegado Community',
    difficulty: route.difficulty,
    distanceKm: route.distance || 0,
    duration: route.duration || '',
    originName: route.startPoint || 'Partida',
    destName: route.mapsAddress || route.name,
    waypoints,
    trackPoints
  };
}

/**
 * Escapa caracteres especiais XML para segurança e conformidade W3C
 */
function escapeXml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gera string XML padrão GPX 1.1 compatível com Garmin, TomTom e apps mobile
 */
export function generateGpxString(data: GpsExportData): string {
  const timestamp = new Date().toISOString();
  const escapedTitle = escapeXml(data.title);
  const escapedDesc = escapeXml(data.description);
  const escapedAuthor = escapeXml(data.author || 'MotoLegado');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoLegado - https://motolegado.com"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapedTitle}</name>
    <desc>${escapedDesc}</desc>
    <author>
      <name>${escapedAuthor}</name>
      <link href="https://motolegado.com" />
    </author>
    <time>${timestamp}</time>
    <keywords>MotoLegado, Motociclismo, Viagem de Moto, Garmin, GPS, ${data.difficulty || 'Roteiro'}</keywords>
  </metadata>
`;

  // Waypoints (Pontos de interesse)
  data.waypoints.forEach((wpt, index) => {
    const sym = wpt.type === 'start' ? 'Flag, Green' : (wpt.type === 'end' ? 'Flag, Red' : 'Scenic Area');
    xml += `  <wpt lat="${wpt.lat}" lon="${wpt.lon}">
    <ele>${wpt.ele || 500}</ele>
    <time>${timestamp}</time>
    <name>${escapeXml(wpt.name)}</name>
    <desc>${escapeXml(wpt.desc || `Parada #${index + 1}`)}</desc>
    <sym>${sym}</sym>
    <type>${wpt.type || 'waypoint'}</type>
  </wpt>\n`;
  });

  // Route (Roteiro sequencial de navegação curva a curva para Garmin/TomTom)
  xml += `  <rte>
    <name>${escapedTitle}</name>
    <desc>Roteiro planejado para navegação por GPS</desc>
    <number>1</number>
`;
  data.waypoints.forEach((wpt) => {
    xml += `    <rtept lat="${wpt.lat}" lon="${wpt.lon}">
      <name>${escapeXml(wpt.name)}</name>
    </rtept>\n`;
  });
  xml += `  </rte>\n`;

  // Track (Traçado contínuo para visualização no mapa)
  xml += `  <trk>
    <name>${escapedTitle} - Traçado</name>
    <desc>Traçado da expedição gerado pelo MotoLegado</desc>
    <trkseg>\n`;

  data.trackPoints.forEach((pt) => {
    xml += `      <trkpt lat="${pt.lat}" lon="${pt.lon}">
        <ele>${pt.ele || 500}</ele>
        <time>${timestamp}</time>
      </trkpt>\n`;
  });

  xml += `    </trkseg>
  </trk>
</gpx>`;

  return xml;
}

/**
 * Gera string XML padrão KML 2.2 compatível com Google Earth e Maps.me
 */
export function generateKmlString(data: GpsExportData): string {
  const escapedTitle = escapeXml(data.title);
  const escapedDesc = escapeXml(data.description);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapedTitle}</name>
    <description>${escapedDesc}</description>
    
    <!-- Estilo da linha da rota (Laranja MotoLegado #ff751f em aabbggrr -> ff1f75ff) -->
    <Style id="motolegadoRouteLine">
      <LineStyle>
        <color>ff1f75ff</color>
        <width>6</width>
      </LineStyle>
    </Style>

    <Style id="startPin">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.3</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>

    <Style id="endPin">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.3</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-flag.png</href>
        </Icon>
      </IconStyle>
    </Style>

    <Style id="stagePin">
      <IconStyle>
        <color>ff00aaff</color>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/orange-diamond.png</href>
        </Icon>
      </IconStyle>
    </Style>
`;

  // Placemarks dos waypoints
  data.waypoints.forEach((wpt) => {
    const styleUrl = wpt.type === 'start' ? '#startPin' : (wpt.type === 'end' ? '#endPin' : '#stagePin');
    xml += `    <Placemark>
      <name>${escapeXml(wpt.name)}</name>
      <description>${escapeXml(wpt.desc)}</description>
      <styleUrl>${styleUrl}</styleUrl>
      <Point>
        <coordinates>${wpt.lon},${wpt.lat},${wpt.ele || 0}</coordinates>
      </Point>
    </Placemark>\n`;
  });

  // Traçado da rota LineString
  const coordinatesString = data.trackPoints
    .map((pt) => `${pt.lon},${pt.lat},${pt.ele || 0}`)
    .join(' ');

  xml += `    <Placemark>
      <name>Traçado da Viagem - ${escapedTitle}</name>
      <description>Expedição planejada no MotoLegado</description>
      <styleUrl>#motolegadoRouteLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
          ${coordinatesString}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

  return xml;
}

/**
 * Função utilitária para acionar o download do arquivo no navegador do usuário
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exporta a rota diretamente em formato GPX
 */
export function exportRouteToGpx(route: Route): void {
  const data = buildGpsExportDataFromRoute(route);
  const gpxContent = generateGpxString(data);
  const safeName = route.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filename = `motolegado-${safeName || 'roteiro'}.gpx`;
  triggerFileDownload(gpxContent, filename, 'application/gpx+xml;charset=utf-8');
}

/**
 * Exporta a rota diretamente em formato KML
 */
export function exportRouteToKml(route: Route): void {
  const data = buildGpsExportDataFromRoute(route);
  const kmlContent = generateKmlString(data);
  const safeName = route.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filename = `motolegado-${safeName || 'roteiro'}.kml`;
  triggerFileDownload(kmlContent, filename, 'application/vnd.google-earth.kml+xml;charset=utf-8');
}
