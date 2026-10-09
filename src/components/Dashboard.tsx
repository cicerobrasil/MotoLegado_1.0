import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, Store, Percent, Route, BookOpen, CheckCircle, Plus, MapPin, Trophy,
  Navigation, Clock, Sun, Moon, Star, CloudRain, Cloud, Zap, CloudFog, Wind,
  ExternalLink, ShieldCheck, Bike
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MotoEvent } from './Events';
import { Partner } from './Partners';
import { 
  LogEntry, 
  parseLogPeriod, 
  parseLogClimates, 
  TRIP_PERIOD_CONFIG, 
  WEATHER_CONDITIONS, 
  CLIMATE_CONFIG 
} from './Logbook';
import { RouteMetricsPanel } from './RouteMetricsPanel';
import { TripReportModal } from './TripReportModal';
import { useAuth } from '../context/AuthContext';
import { getTripsFromHostinger } from '../lib/api';
import { getPilotLiveGamification } from '../lib/gamification';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTripModal, setSelectedTripModal] = useState<LogEntry | null>(null);

  useEffect(() => {
    const loadDashboardData = () => {
      // 1. Load Events
      const savedEvents = localStorage.getItem('motolegado_events');
      if (savedEvents) {
        try {
          setEvents(JSON.parse(savedEvents));
        } catch (e) {
          console.error('Error reading motolegado_events', e);
        }
      }

      // 2. Load Partners
      const savedPartners = localStorage.getItem('motolegado_partners');
      if (savedPartners) {
        try {
          setPartners(JSON.parse(savedPartners));
        } catch (e) {
          console.error('Error reading motolegado_partners', e);
        }
      }

      const currentPilotKey = user?.id || profile?.id || user?.email || 'guest';
      const userStorageKey = `motolegado_logs_${currentPilotKey}`;
      const currentPilotSet = new Set<string>([
        user?.id,
        profile?.id,
        user?.email,
        profile?.email
      ].filter(Boolean).map(s => String(s).toLowerCase()));

      const isMyLog = (log: any) => {
        if (!log) return false;
        if (!log.pilot_id) return true;
        return currentPilotSet.has(String(log.pilot_id).toLowerCase());
      };

      // 3. Load Logbook - Carrega estritamente os registros do piloto ativo
      let currentLocalLogs: LogEntry[] = [];
      const savedUserLogs = localStorage.getItem(userStorageKey);
      if (savedUserLogs) {
        try {
          const parsed = JSON.parse(savedUserLogs);
          if (Array.isArray(parsed)) {
            currentLocalLogs = parsed.filter(isMyLog);
            setLogs(currentLocalLogs);
          }
        } catch (e) {
          console.error('Error reading user logs', e);
        }
      } else {
        const savedLogs = localStorage.getItem('motolegado_logs');
        if (savedLogs) {
          try {
            const parsed = JSON.parse(savedLogs);
            if (Array.isArray(parsed)) {
              currentLocalLogs = parsed.filter(isMyLog);
              setLogs(currentLocalLogs);
            }
          } catch (e) {
            console.error('Error reading motolegado_logs', e);
          }
        }
      }

      // 4. Carregar e sincronizar viagens do MySQL na Hostinger estritamente para o piloto ativo
      const isStockUrl = (u?: string) => !u || u.includes('images.unsplash.com');

      getTripsFromHostinger(user?.id || profile?.id || user?.email)
        .then((res) => {
          if (res && res.trips && Array.isArray(res.trips)) {
            const mappedLogs: LogEntry[] = res.trips.map((t: any) => {
              let checklist: any = {};
              if (typeof t.checklist_data === 'string') {
                try { checklist = JSON.parse(t.checklist_data); } catch {}
              } else if (typeof t.checklist_data === 'object' && t.checklist_data) {
                checklist = t.checklist_data;
              }

              let photos: string[] = [];
              if (typeof t.photos === 'string') {
                try { photos = JSON.parse(t.photos); } catch {}
              } else if (Array.isArray(t.photos)) {
                photos = t.photos;
              }

              const realPhoto = photos.find((p: string) => !isStockUrl(p));
              const realProofPhoto = Array.isArray(checklist?.documentaryProofs)
                ? checklist.documentaryProofs.find((p: any) => !isStockUrl(p?.url))?.url
                : null;
              const finalImage = (!isStockUrl(checklist?.image) ? checklist?.image : null) || realPhoto || realProofPhoto || checklist?.image || photos[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

              let rawDate = t.start_date ? String(t.start_date).split('T')[0] : (t.date || '');
              let displayDate = rawDate;
              if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                const [y, m, d] = rawDate.split('-');
                displayDate = `${d}/${m}/${y}`;
              }

              return {
                id: String(t.id),
                title: t.title || 'Viagem Registrada',
                category: checklist?.category || t.category || 'Viagem',
                date: displayDate || new Date().toLocaleDateString('pt-BR'),
                origin: t.start_location || t.origin || '',
                destination: t.destination || '',
                distance: String(Math.round(parseFloat(t.distance_km) || 0)),
                duration: checklist?.duration || '2h',
                bike: t.motorcycle_used || t.bike_model || profile?.motorcycle || 'Motocicleta',
                climate: checklist?.climate || 'sun',
                road: checklist?.road || 'Boa',
                rating: checklist?.rating || t.rating || 5,
                content: t.description || checklist?.content || t.notes || '',
                image: finalImage,
                photos: photos.length > 0 ? photos : (Array.isArray(t.photos) ? t.photos : []),
                documentaryProofs: Array.isArray(checklist?.documentaryProofs) ? checklist.documentaryProofs : [],
                stages: Array.isArray(checklist?.stages) ? checklist.stages : (Array.isArray(t.stages) ? t.stages : []),
                mapsUrl: checklist?.mapsUrl || t.maps_url || undefined
              };
            });
            
            // Mescla de forma segura sem perdas nem duplicações por ID
            const merged: LogEntry[] = [];
            const seenIds = new Set<string>();

            mappedLogs.forEach(ml => {
              seenIds.add(ml.id);

              // Tenta localizar versão local correspondente para enriquecer dados
              const localMatch = currentLocalLogs.find(l => l.id === ml.id);
              if (localMatch) {
                const combinedPhotos = Array.from(new Set([...(ml.photos || []), ...(localMatch.photos || [])]));
                const combinedProofs = (ml.documentaryProofs && ml.documentaryProofs.length > 0)
                  ? ml.documentaryProofs
                  : (localMatch.documentaryProofs || []);
                const combinedCover = (!isStockUrl(ml.image) ? ml.image : null) 
                  || (!isStockUrl(localMatch.image) ? localMatch.image : null)
                  || ml.image 
                  || localMatch.image;

                merged.push({
                  ...ml,
                  title: ml.title || localMatch.title,
                  origin: ml.origin || localMatch.origin,
                  destination: ml.destination || localMatch.destination,
                  content: ml.content || localMatch.content,
                  bike: (ml.bike && ml.bike !== 'Motocicleta') ? ml.bike : (localMatch.bike || ml.bike),
                  distance: (ml.distance && ml.distance !== '0') ? ml.distance : (localMatch.distance || ml.distance),
                  category: ml.category || localMatch.category,
                  photos: combinedPhotos.length > 0 ? combinedPhotos : (ml.photos || []),
                  documentaryProofs: combinedProofs,
                  image: combinedCover,
                  stages: (ml.stages && ml.stages.length > 0) ? ml.stages : (localMatch.stages || []),
                  mapsUrl: ml.mapsUrl || localMatch.mapsUrl
                });
              } else {
                merged.push(ml);
              }
            });

            currentLocalLogs.forEach(ll => {
              if (!seenIds.has(ll.id)) {
                seenIds.add(ll.id);
                merged.push(ll);
              }
            });

            setLogs(merged);
            localStorage.setItem(userStorageKey, JSON.stringify(merged));
          } else {
            setLogs(currentLocalLogs);
            localStorage.setItem(userStorageKey, JSON.stringify(currentLocalLogs));
          }
        })
        .catch(() => {
          setLogs(currentLocalLogs);
        });
    };

    loadDashboardData();

    // Listen to real-time events from Logbook & gamification
    window.addEventListener('motolegado_logs_updated', loadDashboardData);
    window.addEventListener('motolegado_gamification_updated', loadDashboardData);
    window.addEventListener('storage', loadDashboardData);

    return () => {
      window.removeEventListener('motolegado_logs_updated', loadDashboardData);
      window.removeEventListener('motolegado_gamification_updated', loadDashboardData);
      window.removeEventListener('storage', loadDashboardData);
    };
  }, [user]);

  const checkedInEvents = events.filter(evt => evt.checkedIn);
  const displayEvents = checkedInEvents.length > 0 ? checkedInEvents.slice(0, 3) : events.slice(0, 3);
  const highlightedPartners = partners.filter(p => p.highlight).slice(0, 2);
  const displayPartners = highlightedPartners.length > 0 ? highlightedPartners : partners.slice(0, 2);

  // Calculate live total distance from actual pilot logs
  const loggedKm = logs.reduce((acc, log) => {
    const val = parseInt(log.distance, 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalKmCombined = loggedKm;

  // Active or latest trip
  const latestLog = logs.length > 0 ? logs[0] : null;

  // Métricas exclusivas da última rota registrada (evita duplicidade com painel de telemetria acumulada)
  const latestRouteMetrics = useMemo(() => {
    if (!latestLog) return null;
    const distNum = parseFloat(latestLog.distance?.replace(/[^\d.]/g, '') || '0') || 0;
    const periodKey = parseLogPeriod(latestLog);
    const periodConfig = TRIP_PERIOD_CONFIG[periodKey] || TRIP_PERIOD_CONFIG.day;
    const weatherList = parseLogClimates(latestLog);
    const stagesList = Array.isArray(latestLog.stages) ? latestLog.stages : [];

    return {
      distance: distNum,
      duration: latestLog.duration || '—',
      road: latestLog.road || 'Tapete (Perfeita)',
      rating: latestLog.rating || 5,
      bike: latestLog.bike || profile?.motorcycle || 'Motocicleta',
      periodKey,
      periodConfig,
      weatherList,
      stagesList,
    };
  }, [latestLog, profile]);

  // Dynamic telemetry chart data reflecting actual trips
  const chartKmData = useMemo(() => {
    if (logs.length === 0) {
      return [
        { name: 'Km 0', km: 0 },
        { name: 'Km 150', km: 150 },
        { name: 'Km 320', km: 320 },
        { name: 'Km 580', km: 580 },
        { name: 'Km 900', km: 900 },
      ];
    }

    // Sort chronologically (oldest to newest) to display cumulative distance evolution
    const chronological = [...logs].reverse();
    let accumulated = 0;

    return chronological.map((log, index) => {
      const dist = parseInt(log.distance, 10) || 0;
      accumulated += dist;
      const titleLabel = log.title 
        ? (log.title.length > 14 ? log.title.slice(0, 12) + '...' : log.title) 
        : `Rota ${index + 1}`;
      return {
        name: titleLabel,
        km: accumulated,
        tripKm: dist
      };
    });
  }, [logs]);

  // Live Gamification Engine (KM + Eventos + Diário + Badges)
  const gamification = useMemo(() => {
    return getPilotLiveGamification(logs, events);
  }, [logs, events]);

  const { pointsBreakdown, rankInfo, badges } = gamification;
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-6 overflow-y-auto bg-slate-950">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/60 pb-6 md:pb-8 gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">DASH<span className="text-orange-500">BOARD</span></h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            TELEMETRIA, EVENTOS E DIÁRIO DE BORDO EM TEMPO REAL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            data-tour="dashboard-ranking"
            onClick={() => navigate('/achievements')}
            className="btn-secondary flex items-center gap-1.5 border-amber-500/40 text-amber-400 hover:text-white"
          >
            <Trophy size={15} className="text-amber-400" />
            <span className="font-mono">{rankInfo.currentTier.icon} {pointsBreakdown.totalPoints.toLocaleString()} PTS</span>
          </button>
          <button
            onClick={() => navigate('/logbook')}
            className="btn-secondary"
          >
            <BookOpen size={15} className="text-[#ff751f]" />
            <span>Diário ({logs.length})</span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Active Route Main Box */}
        <div data-tour="dashboard-telemetry" className="col-span-12 lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 bg-orange-600/20 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase italic rounded-full border border-orange-500/30">
                  ÚLTIMA ROTA REGISTRADA
                </span>
                {latestLog?.date && (
                  <span className="text-[10px] font-mono text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                    {latestLog.date}
                  </span>
                )}
                {latestLog?.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-black uppercase border border-slate-700">
                    {latestLog.category}
                  </span>
                )}

                {/* CONDIÇÕES MANTIDAS NA PARTE DE CIMA DO CARD */}
                {latestRouteMetrics && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider ml-1">
                      CONDIÇÕES:
                    </span>
                    {/* Período (De dia / De noite / O dia todo) */}
                    {(() => {
                      const PIcon = latestRouteMetrics.periodConfig.icon;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-black uppercase tracking-wider",
                            latestRouteMetrics.periodConfig.bg,
                            latestRouteMetrics.periodConfig.border,
                            latestRouteMetrics.periodConfig.color
                          )}
                          title={`Período do Roteiro: ${latestRouteMetrics.periodConfig.label}`}
                        >
                          <PIcon size={11} />
                          <span>{latestRouteMetrics.periodConfig.label}</span>
                        </span>
                      );
                    })()}

                    {/* Climas Enfrentados nesta rota */}
                    {latestRouteMetrics.weatherList.map(cId => {
                      const found = WEATHER_CONDITIONS.find(w => w.id === cId);
                      const legacy = CLIMATE_CONFIG[cId];
                      const label = found?.label || legacy?.label || cId.toUpperCase();
                      const CIcon = found?.icon || legacy?.icon || Sun;
                      const color = found?.color || legacy?.color || 'text-amber-400';
                      const bg = found?.bg || legacy?.bg || 'bg-amber-500/10';
                      const border = found?.border || legacy?.border || 'border-amber-500/20';

                      return (
                        <span
                          key={cId}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs",
                            bg, border, color
                          )}
                          title={`Clima enfrentado: ${label}`}
                        >
                          <CIcon size={11} />
                          <span>{label}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-black italic uppercase mt-2 sm:mt-3 tracking-tighter text-white">
                {latestLog ? latestLog.title : 'Nenhuma Viagem Registrada'}
              </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {latestLog && (
                <button
                  onClick={() => navigate('/logbook')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Abrir no Diário de Bordo"
                >
                  <BookOpen size={14} className="text-orange-400" />
                  <span className="hidden sm:inline">Ver no Diário</span>
                </button>
              )}
              <button
                data-tour="dashboard-logbook"
                onClick={() => navigate('/logbook')}
                className="btn-primary w-full sm:w-auto self-start sm:self-center"
              >
                <Plus size={15} />
                <span>NOVO REGISTRO</span>
              </button>
            </div>
          </div>

          {latestLog && latestRouteMetrics ? (
            <div className="space-y-3.5">
              {/* 1. LINHA INDIVIDUAL: ORIGEM DESTINO */}
              <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                    ORIGEM & DESTINO
                  </span>
                  <div className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-tight flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-slate-100">{latestLog.origin || 'Origem não informada'}</span>
                    <span className="text-orange-500 font-black text-sm sm:text-base">➔</span>
                    <span className="text-slate-100">{latestLog.destination || 'Destino não informado'}</span>
                  </div>
                </div>
              </div>

              {/* 2. LINHA ABAIXO DE ORIGEM DESTINO: DISTÂNCIA TOTAL, TEMPO ESTIMADO, ESTADO DA ESTRADA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                {/* 1. Distância Total */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                    <Navigation size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                      Distância Total
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-white font-mono truncate block">
                      {latestRouteMetrics.distance} KM
                    </span>
                  </div>
                </div>

                {/* 2. Tempo Estimado */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                      Tempo Estimado
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-white truncate block">
                      {latestRouteMetrics.duration}
                    </span>
                  </div>
                </div>

                {/* 3. Estado da Estrada */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Route size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                      Estado da Estrada
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-amber-400 truncate block" title={latestRouteMetrics.road}>
                      {latestRouteMetrics.road}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. PAINEL DE DETALHES DA ROTA: Condições excluídas da parte de baixo para evitar duplicidade */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800/70 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      DETALHES DO REGISTRO
                    </span>
                  </div>

                  {/* Avaliação e Moto */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Avaliação:</span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>{latestRouteMetrics.rating}.0</span>
                      </div>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1 text-slate-300 font-bold truncate max-w-[180px]">
                      <Bike size={14} className="text-orange-500 shrink-0" />
                      <span className="truncate">{latestRouteMetrics.bike}</span>
                    </div>
                  </div>
                </div>

                {/* Trajeto com Etapas & Paradas (se houver) ou Relato */}
                {latestRouteMetrics.stagesList.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Navigation size={12} className="text-orange-500" />
                        Etapas e Paradas da Rota ({latestRouteMetrics.stagesList.length})
                      </span>
                      {latestLog.mapsUrl && (
                        <a
                          href={latestLog.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={11} />
                          <span>Abrir Rota no Google Maps</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      <span className="text-[10px] font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        🏁 {latestLog.origin.split('/')[0]}
                      </span>
                      {latestRouteMetrics.stagesList.map((st, idx) => (
                        <div key={st.id || idx} className="flex items-center gap-1.5 shrink-0">
                          <span className="text-orange-500 font-bold text-xs">➔</span>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/30">
                            {st.name}
                          </span>
                        </div>
                      ))}
                      <span className="text-orange-500 font-bold text-xs shrink-0">➔</span>
                      <span className="text-[10px] font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        🚩 {latestLog.destination.split('/')[0]}
                      </span>
                    </div>
                  </div>
                ) : latestLog.content ? (
                  <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
                    "{latestLog.content}"
                  </p>
                ) : null}

                {/* Footer da Rota com foto de capa e status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[10px]">
                  <div className="flex items-center gap-2">
                    {latestLog.image && (
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                        <img src={latestLog.image} alt={latestLog.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="text-slate-400">
                      Registro certificado no Diário de Bordo
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTripModal(latestLog)}
                    className="text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-xl border border-orange-500/30 text-xs shadow-sm active:scale-95"
                    title="Abrir tela exclusiva para visualizar todos os detalhes deste roteiro"
                  >
                    <span>Visualizar Roteiro Completo</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Nenhuma viagem registrada ainda. Clique em "NOVO REGISTRO" para cadastrar seu primeiro roteiro!
            </div>
          )}
        </div>

        {/* Adventures & Logbook Sidebar Box */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <BookOpen size={14} className="text-orange-500" />
                Diário de Bordo Recente
              </h3>
              <button 
                onClick={() => navigate('/logbook')} 
                className="text-[9px] text-amber-400 font-black uppercase tracking-widest hover:underline"
              >
                VER TODOS ({logs.length})
              </button>
            </div>

            <div className="space-y-3">
              {logs.slice(0, 3).map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedTripModal(log)}
                  className="flex gap-4 items-center group cursor-pointer p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/50 transition-all border border-slate-800/80 hover:border-orange-500/40"
                  title="Clique para visualizar tela exclusiva desta viagem"
                >
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0 group-hover:border-orange-500 transition-colors">
                    <img src={log.image} alt={log.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors truncate">
                      {log.title}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate flex items-center gap-1.5">
                      <span>{log.date}</span>
                      <span>•</span>
                      <span>{log.distance} KM</span>
                      <span>•</span>
                      <span className="text-orange-400 font-black">
                        {(log as any).period === 'night' ? '🌙 Noite' : ((log as any).period === 'all_day' ? '⏳ Dia Todo' : '☀️ Dia')}
                      </span>
                    </p>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhuma viagem registrada no diário de bordo.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/logbook')}
            className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={14} className="text-orange-500" />
            <span>Cadastrar Nova Aventura</span>
          </button>
        </div>

        {/* Painel Interativo de Métricas Recharts: Total de Quilometragem & Tempo Acumulado */}
        <RouteMetricsPanel 
          logs={logs} 
          onNewTripClick={() => navigate('/logbook')} 
        />

        {/* Checked In Events Section */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                Eventos com Check-in / Confirmados ({checkedInEvents.length})
              </h3>
              <button 
                onClick={() => navigate('/events')} 
                className="text-[9px] text-amber-400 font-black uppercase tracking-widest hover:underline"
              >
                VER AGENDA
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayEvents.map((adv) => (
                <div 
                  key={adv.id} 
                  onClick={() => navigate('/events')}
                  className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {adv.category}
                    </span>
                    {adv.checkedIn && (
                      <span className="text-[8px] font-black uppercase text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle size={10} /> Presença
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {adv.title}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">
                      {adv.date} • {adv.location}
                    </p>
                  </div>
                </div>
              ))}

              {displayEvents.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                  Nenhum evento agendado no momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefícios e Parceiros */}
        <div 
          onClick={() => navigate('/partners')}
          className="col-span-12 lg:col-span-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col justify-between cursor-pointer group hover:border-orange-500/30 transition-all"
        >
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Store size={14} className="text-orange-500" />
                Parceiros em Destaque
              </h3>
              <span className="text-[8px] text-orange-400 font-extrabold uppercase tracking-widest bg-orange-600/10 border border-orange-500/30 px-2.5 py-1 rounded-full">
                OFICINAS E BENEFÍCIOS
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayPartners.map((pt) => (
                <div key={pt.id} className="flex gap-3 items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 group-hover:border-slate-700 transition-all">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0">
                    <img src={pt.image} className="w-full h-full object-cover" alt={pt.name} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors truncate">{pt.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-orange-400">
                      <Percent size={10} className="shrink-0" />
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wide truncate">
                        {pt.discount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {displayPartners.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                  Nenhum parceiro cadastrado no momento.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/50">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ver rede credenciada completa</span>
            <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:border-orange-500 transition-colors">
              ➔
            </span>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Route size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">DISTÂNCIA TOTAL</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {totalKmCombined.toLocaleString()} <span className="text-xs not-italic text-orange-500 uppercase font-black">KM</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.kmPoints} pts no asfalto</p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Calendar size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">EVENTOS PARTICIPADOS</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {checkedInEvents.length.toString().padStart(2, '0')} <span className="text-xs not-italic text-sky-400 uppercase font-black">CHECK-INS</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.eventPoints} pts de eventos</p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <BookOpen size={22} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">DIÁRIO DE BORDO</p>
            <div className="text-xl font-black italic text-white tracking-tighter">
              {logs.length.toString().padStart(2, '0')} <span className="text-xs not-italic text-purple-400 uppercase font-black">EXPEDIÇÕES</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">+{pointsBreakdown.tripPoints} pts de relatos</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/achievements')}
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
            {rankInfo.currentTier.icon}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <p className="text-amber-500 text-[8px] font-black uppercase tracking-[0.2em] truncate">PATENTE & BADGES</p>
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest group-hover:underline">VER HUB ➔</span>
            </div>
            <div className="text-xl font-black italic text-white tracking-tighter truncate">
              {rankInfo.currentTier.title}
            </div>
            <p className="text-[9px] text-slate-400 font-medium font-mono">
              <strong className="text-amber-400">{pointsBreakdown.totalPoints.toLocaleString()} PTS</strong> • {unlockedBadgesCount}/{badges.length} Badges
            </p>
          </div>
        </div>
      </main>

      <footer className="flex flex-col sm:flex-row gap-3 justify-between items-center text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em] pb-4 border-t border-slate-900 pt-4 text-center sm:text-left">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8">
          <span className="flex items-center gap-2"><span className="w-1 h-1 bg-green-500 rounded-full"></span>GPS: ATIVO (L1/L5)</span>
          <span>LAT: -26.3045 LON: -48.8456</span>
        </div>
        <div>
          © 2026 MOTOLEGADO ENGINEERING SYSTEMS
        </div>
      </footer>

      {/* Tela Exclusiva com apenas a Viagem Selecionada */}
      {selectedTripModal && (
        <TripReportModal
          isOpen={!!selectedTripModal}
          onClose={() => setSelectedTripModal(null)}
          logs={[selectedTripModal]}
          pilotName={profile?.name || user?.user_metadata?.full_name || 'Piloto MotoLegado'}
          pilotClub={profile?.club_name || 'Piloto Independente'}
          pilotMotorcycle={profile?.motorcycle || selectedTripModal.bike || 'Motocicleta Cadastrada'}
          pilotId={profile?.id || user?.id}
          initialSelectedTripId={selectedTripModal.id}
          exclusiveTripMode={true}
          onOpenAllTrips={() => navigate('/logbook')}
        />
      )}
    </div>
  );
}

