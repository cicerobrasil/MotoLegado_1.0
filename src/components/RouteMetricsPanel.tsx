import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  BarChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Navigation, 
  Clock, 
  Route as RouteIcon, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Compass, 
  Plus, 
  Layers, 
  Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogEntry } from './Logbook';
import { cn } from '../lib/utils';

interface RouteMetricsPanelProps {
  logs: LogEntry[];
  onNewTripClick?: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  badgeText?: string;
  periodLabel?: string;
}

/**
 * Converte string de duração (ex: "2h 30min", "45min", "3h") em minutos inteiros
 */
export function parseDurationToMinutes(durationStr?: string): number {
  if (!durationStr) return 90; // fallback padrão de 1h30min
  const str = durationStr.toLowerCase().trim();
  let totalMinutes = 0;

  const hoursMatch = str.match(/(\d+)\s*(?:h|hora|horas)/i);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }

  const minutesMatch = str.match(/(\d+)\s*(?:m|min|minuto|minutos)/i);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }

  if (!hoursMatch && !minutesMatch) {
    const rawNum = parseFloat(str.replace(',', '.'));
    if (!isNaN(rawNum)) {
      if (rawNum > 12) {
        totalMinutes = Math.round(rawNum);
      } else {
        totalMinutes = Math.round(rawNum * 60);
      }
    }
  }

  return totalMinutes > 0 ? totalMinutes : 90;
}

/**
 * Formata minutos em string amigável (ex: "14h 30min")
 */
export function formatMinutesToReadable(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function RouteMetricsPanel({ 
  logs, 
  onNewTripClick,
  title,
  subtitle,
  badgeText,
  periodLabel
}: RouteMetricsPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'combined' | 'distance' | 'duration'>('combined');
  const [dataLimit, setDataLimit] = useState<'all' | '10' | '5'>('all');

  // Processamento e consolidação de telemetria
  const metricsData = useMemo(() => {
    if (logs.length === 0) {
      // Estado de demonstração se o usuário ainda não tiver registros
      return {
        totalKm: 0,
        totalMinutes: 0,
        avgKmPerTrip: 0,
        avgMinutesPerTrip: 0,
        avgSpeedKmH: 0,
        tripsCount: 0,
        chartData: [
          { name: 'Ponto 0', tripKm: 0, accumKm: 0, tripHours: 0, accumHours: 0, durationFormatted: '0min', rawDurationMin: 0, date: 'Início' },
          { name: 'Demo 1', tripKm: 120, accumKm: 120, tripHours: 1.8, accumHours: 1.8, durationFormatted: '1h 50min', rawDurationMin: 110, date: 'Rota 1' },
          { name: 'Demo 2', tripKm: 240, accumKm: 360, tripHours: 3.5, accumHours: 5.3, durationFormatted: '3h 30min', rawDurationMin: 210, date: 'Rota 2' },
          { name: 'Demo 3', tripKm: 180, accumKm: 540, tripHours: 2.5, accumHours: 7.8, durationFormatted: '2h 30min', rawDurationMin: 150, date: 'Rota 3' },
          { name: 'Demo 4', tripKm: 310, accumKm: 850, tripHours: 4.2, accumHours: 12.0, durationFormatted: '4h 10min', rawDurationMin: 250, date: 'Rota 4' }
        ],
        isDemo: true
      };
    }

    // Ordenação cronológica (do mais antigo para o mais recente) para evolução acumulada
    const chronological = [...logs].reverse();

    let runningKm = 0;
    let runningMinutes = 0;

    const fullChartData = chronological.map((log, index) => {
      const dist = parseInt(log.distance, 10) || 0;
      const mins = parseDurationToMinutes(log.duration);

      runningKm += dist;
      runningMinutes += mins;

      const shortTitle = log.title 
        ? (log.title.length > 13 ? log.title.slice(0, 11) + '..' : log.title)
        : `Rota ${index + 1}`;

      const tripHoursDecimal = Number((mins / 60).toFixed(1));
      const accumHoursDecimal = Number((runningMinutes / 60).toFixed(1));

      return {
        id: log.id,
        name: shortTitle,
        fullTitle: log.title || `Rota ${index + 1}`,
        date: log.date || '',
        origin: log.origin || '',
        destination: log.destination || '',
        tripKm: dist,
        accumKm: runningKm,
        rawDurationMin: mins,
        durationFormatted: formatMinutesToReadable(mins),
        tripHours: tripHoursDecimal,
        accumHours: accumHoursDecimal,
        accumHoursFormatted: formatMinutesToReadable(runningMinutes),
        speed: mins > 0 ? Math.round((dist / (mins / 60))) : 0
      };
    });

    // Aplica o filtro de limite selecionado
    let slicedChartData = fullChartData;
    if (dataLimit === '5') {
      slicedChartData = fullChartData.slice(-5);
    } else if (dataLimit === '10') {
      slicedChartData = fullChartData.slice(-10);
    }

    const totalKm = runningKm;
    const totalMinutes = runningMinutes;
    const tripsCount = logs.length;
    const avgKmPerTrip = tripsCount > 0 ? Math.round(totalKm / tripsCount) : 0;
    const avgMinutesPerTrip = tripsCount > 0 ? Math.round(totalMinutes / tripsCount) : 0;
    const totalHoursFloat = totalMinutes / 60;
    const avgSpeedKmH = totalHoursFloat > 0 ? Math.round(totalKm / totalHoursFloat) : 0;

    return {
      totalKm,
      totalMinutes,
      avgKmPerTrip,
      avgMinutesPerTrip,
      avgSpeedKmH,
      tripsCount,
      chartData: slicedChartData,
      isDemo: false
    };
  }, [logs, dataLimit]);

  // Tooltip customizado com estética motociclista
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md min-w-[210px] space-y-2 text-xs">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] font-mono text-orange-400 font-bold block">
              {data.date || 'Registro'}
            </span>
            <p className="font-black text-white uppercase italic text-sm truncate">
              {data.fullTitle || data.name}
            </p>
            {data.origin && data.destination && (
              <p className="text-[10px] text-slate-400 truncate">
                {data.origin.split('/')[0]} ➔ {data.destination.split('/')[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5 font-bold">
            <div className="flex items-center justify-between text-orange-400">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Navigation size={12} className="text-orange-500" /> KM da Rota:
              </span>
              <span className="font-mono">{data.tripKm} KM</span>
            </div>

            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Gauge size={12} className="text-amber-500" /> KM Acumulado:
              </span>
              <span className="font-mono">{data.accumKm} KM</span>
            </div>

            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Clock size={12} className="text-cyan-500" /> Tempo da Rota:
              </span>
              <span className="font-mono">{data.durationFormatted}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <TrendingUp size={12} className="text-emerald-500" /> Tempo Acumulado:
              </span>
              <span className="font-mono">{data.accumHoursFormatted || `${data.accumHours}h`}</span>
            </div>

            {data.speed > 0 && (
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-900 text-[10px]">
                <span className="text-slate-500">Média no Trecho:</span>
                <span className="font-mono font-bold text-slate-300">{data.speed} km/h</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col-span-12 bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-5 sm:p-7 md:p-8 flex flex-col gap-6 relative overflow-hidden group">
      {/* Header do Painel de Métricas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 bg-orange-600/20 text-orange-400 text-[10px] font-black uppercase italic rounded-full border border-orange-500/30">
              {badgeText || "TELEMETRIA DO DIÁRIO"}
            </span>
            {periodLabel && (
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Calendar size={11} className="text-cyan-400" />
                {periodLabel}
              </span>
            )}
            {metricsData.isDemo && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Modo Demonstração
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white mt-1.5">
            {title ? (
              title
            ) : (
              <>PAINEL DE <span className="text-orange-500">QUILOMETRAGEM & TEMPO</span> ACUMULADO</>
            )}
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            {subtitle || "Monitoramento gráfico do total de quilômetros rodados e horas acumuladas nas rotas do piloto."}
          </p>
        </div>

        {/* Controles de Visualização e Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Seletor de Modo Gráfico (Segmented Control) */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('combined')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                activeTab === 'combined'
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 font-black"
                  : "text-slate-400 hover:text-white"
              )}
            >
              KM + Tempo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('distance')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                activeTab === 'distance'
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 font-black"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Apenas KM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('duration')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                activeTab === 'duration'
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 font-black"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Apenas Tempo
            </button>
          </div>

          {/* Filtro de Quantidade de Rotas */}
          {logs.length > 5 && (
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setDataLimit('5')}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px]",
                  dataLimit === '5' ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
                )}
              >
                Últimas 5
              </button>
              <button
                type="button"
                onClick={() => setDataLimit('10')}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px]",
                  dataLimit === '10' ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
                )}
              >
                Últimas 10
              </button>
              <button
                type="button"
                onClick={() => setDataLimit('all')}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px]",
                  dataLimit === 'all' ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
                )}
              >
                Todas
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onNewTripClick || (() => navigate('/logbook'))}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ml-auto lg:ml-0"
          >
            <Plus size={14} className="text-orange-500" />
            <span>Nova Viagem</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas Consolidadas no Topo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Quilometragem */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Odômetro Total</span>
            <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Navigation size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {metricsData.totalKm.toLocaleString()} <span className="text-orange-500 text-sm">KM</span>
            </div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">
              Média: <strong className="text-slate-200">{metricsData.avgKmPerTrip} KM</strong> por rota
            </div>
          </div>
        </div>

        {/* Total Tempo em Estrada */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Tempo em Estrada</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight">
              {formatMinutesToReadable(metricsData.totalMinutes)}
            </div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">
              Média: <strong className="text-slate-200">{formatMinutesToReadable(metricsData.avgMinutesPerTrip)}</strong> por rota
            </div>
          </div>
        </div>

        {/* Velocidade Média Calculada */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Ritmo de Cruzeiro</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {metricsData.avgSpeedKmH} <span className="text-emerald-500/80 text-sm">KM/H</span>
            </div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">
              Velocidade média acumulada
            </div>
          </div>
        </div>

        {/* Roteiros Concluídos */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Rotas no Diário</span>
            <div className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RouteIcon size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {metricsData.tripsCount} <span className="text-amber-500/80 text-sm">VIAGENS</span>
            </div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">
              Histórico com telemetria
            </div>
          </div>
        </div>
      </div>

      {/* Área Central: Gráfico Recharts */}
      <div className="bg-slate-950/80 rounded-2xl sm:rounded-3xl border border-slate-800/80 p-4 sm:p-6 backdrop-blur-sm flex flex-col justify-between min-h-[340px]">
        {/* Legenda do Gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs font-bold">
          <div className="flex items-center gap-4">
            {(activeTab === 'combined' || activeTab === 'distance') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-orange-600" />
                <span className="text-slate-300">KM da Rota</span>
              </div>
            )}
            {(activeTab === 'combined' || activeTab === 'distance') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-amber-400 rounded-full" />
                <span className="text-slate-300">KM Acumulado</span>
              </div>
            )}
            {(activeTab === 'combined' || activeTab === 'duration') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-600" />
                <span className="text-slate-300">Tempo da Rota (h)</span>
              </div>
            )}
            {(activeTab === 'combined' || activeTab === 'duration') && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                <span className="text-slate-300">Tempo Acumulado (h)</span>
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono font-medium">
            {metricsData.chartData.length} registros no período
          </span>
        </div>

        {/* Gráfico Recharts Responsivo */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'combined' ? (
              <ComposedChart data={metricsData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="barKmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="areaAccumKmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                {/* Eixo Esquerdo para KM */}
                <YAxis 
                  yAxisId="left" 
                  stroke="#f97316" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val}km`}
                />
                {/* Eixo Direito para Horas */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#06b6d4" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="tripKm" fill="url(#barKmGrad)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                <Line yAxisId="left" type="monotone" dataKey="accumKm" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill: '#fbbf24', r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="accumHours" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
              </ComposedChart>
            ) : activeTab === 'distance' ? (
              <AreaChart data={metricsData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaDistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                <YAxis stroke="#f97316" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} tickFormatter={(val) => `${val}km`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accumKm" stroke="#f97316" strokeWidth={3} fill="url(#areaDistGrad)" dot={{ fill: '#f97316', r: 4 }} />
              </AreaChart>
            ) : (
              <BarChart data={metricsData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="barHoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                <YAxis stroke="#06b6d4" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} tickFormatter={(val) => `${val}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tripHours" fill="url(#barHoursGrad)" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Rodapé Informativo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-900 text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado automaticamente com todas as viagens salvas no seu Diário de Bordo.</span>
          </div>
          <div className="text-orange-400 font-mono font-bold">
            {metricsData.totalKm.toLocaleString()} KM &middot; {formatMinutesToReadable(metricsData.totalMinutes)}
          </div>
        </div>
      </div>
    </div>
  );
}
