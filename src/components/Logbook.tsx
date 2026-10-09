import { useState, useEffect, useRef, useMemo, ChangeEvent } from 'react';
import { Send, Plus, Map, X, Compass, Calendar, Bike, MapPin, Clock, Cloud, CloudRain, Sun, Zap, Moon, Star, Sparkles, ArrowLeft, Camera, Loader2, Trash2, ClipboardCheck, BookOpen, FileDown, Navigation, ExternalLink, Share2, ShieldCheck, Eye, Layers, CheckCircle2, Filter, RotateCcw, TrendingUp, SlidersHorizontal, Pencil, Check, Wrench, Users, Tag, ChevronDown, CloudFog, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { uploadImageToStorage } from '../lib/storage';
import { syncTripToHostinger, getTripsFromHostinger, deleteTripFromHostinger } from '../lib/api';
import { UpgradeModal, UpgradeFeatureTrigger } from './UpgradeModal';
import { TripChecklist } from './TripChecklist';
import { TripReportModal } from './TripReportModal';
import { DateInput } from './DateInput';
import { TripStagesManager, TripStage, STAGE_TYPE_CONFIG } from './TripStagesManager';
import { Route, DocumentaryProof } from '../types';
import { isUserProOrBonificado } from '../lib/permissions';
import { estimateRouteMetrics } from './Routes';
import { DocumentaryCameraModal, PROOF_TYPES } from './DocumentaryCameraModal';
import { ProofLightboxModal } from './ProofLightboxModal';
import { RouteMetricsPanel, parseDurationToMinutes, formatMinutesToReadable } from './RouteMetricsPanel';

export type LogbookCategory = 'Viagem' | 'Manutenção' | 'Passeio' | 'Encontro' | 'Outro';

export interface LogbookCategoryConfig {
  id: LogbookCategory;
  label: string;
  icon: typeof Compass;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const LOGBOOK_CATEGORIES: LogbookCategoryConfig[] = [
  { id: 'Viagem', label: 'Viagem', icon: Compass, color: 'text-orange-400', badgeBg: 'bg-orange-500/15', badgeBorder: 'border-orange-500/40', badgeText: 'text-orange-400' },
  { id: 'Passeio', label: 'Passeio', icon: Bike, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/15', badgeBorder: 'border-emerald-500/40', badgeText: 'text-emerald-400' },
  { id: 'Encontro', label: 'Encontro', icon: Users, color: 'text-purple-400', badgeBg: 'bg-purple-500/15', badgeBorder: 'border-purple-500/40', badgeText: 'text-purple-400' },
  { id: 'Manutenção', label: 'Manutenção', icon: Wrench, color: 'text-amber-400', badgeBg: 'bg-amber-500/15', badgeBorder: 'border-amber-500/40', badgeText: 'text-amber-400' },
  { id: 'Outro', label: 'Outro', icon: Tag, color: 'text-slate-400', badgeBg: 'bg-slate-500/15', badgeBorder: 'border-slate-500/40', badgeText: 'text-slate-300' },
];

export type TripPeriod = 'day' | 'night' | 'all_day';

export interface TripPeriodConfig {
  id: TripPeriod;
  label: string;
  badgeLabel: string;
  subLabel: string;
  icon: typeof Sun;
  color: string;
  bg: string;
  border: string;
  activeBorder: string;
}

export const TRIP_PERIOD_CONFIG: Record<TripPeriod, TripPeriodConfig> = {
  day: { 
    id: 'day', 
    label: 'De dia', 
    badgeLabel: 'DE DIA',
    subLabel: 'Roteiro diurno', 
    icon: Sun, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    activeBorder: 'border-amber-500'
  },
  night: { 
    id: 'night', 
    label: 'De noite', 
    badgeLabel: 'DE NOITE',
    subLabel: 'Roteiro noturno', 
    icon: Moon, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/10', 
    border: 'border-indigo-500/30',
    activeBorder: 'border-indigo-500'
  },
  all_day: { 
    id: 'all_day', 
    label: 'O dia todo', 
    badgeLabel: 'O DIA TODO',
    subLabel: 'Integral (dia e noite)', 
    icon: Clock, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30',
    activeBorder: 'border-emerald-500'
  },
};

export interface WeatherConditionConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
}

export const WEATHER_CONDITIONS: WeatherConditionConfig[] = [
  { 
    id: 'sun', 
    label: 'Sol / Céu Limpo', 
    shortLabel: 'SOL', 
    icon: Sun, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30',
    activeBg: 'bg-amber-500/20 text-amber-300',
    activeBorder: 'border-amber-500 shadow-amber-500/20'
  },
  { 
    id: 'rain', 
    label: 'Chuva', 
    shortLabel: 'CHUVA', 
    icon: CloudRain, 
    color: 'text-sky-400', 
    bg: 'bg-sky-500/10', 
    border: 'border-sky-500/30',
    activeBg: 'bg-sky-500/20 text-sky-300',
    activeBorder: 'border-sky-500 shadow-sky-500/20'
  },
  { 
    id: 'cloud', 
    label: 'Nublado', 
    shortLabel: 'NUBLADO', 
    icon: Cloud, 
    color: 'text-slate-300', 
    bg: 'bg-slate-500/10', 
    border: 'border-slate-500/30',
    activeBg: 'bg-slate-700/50 text-slate-200',
    activeBorder: 'border-slate-400 shadow-slate-500/20'
  },
  { 
    id: 'zap', 
    label: 'Tempestade / Raios', 
    shortLabel: 'TEMPESTADE', 
    icon: Zap, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/30',
    activeBg: 'bg-yellow-500/20 text-yellow-300',
    activeBorder: 'border-yellow-500 shadow-yellow-500/20'
  },
  { 
    id: 'fog', 
    label: 'Neblina / Nevoeiro', 
    shortLabel: 'NEBLINA', 
    icon: CloudFog, 
    color: 'text-teal-400', 
    bg: 'bg-teal-500/10', 
    border: 'border-teal-500/30',
    activeBg: 'bg-teal-500/20 text-teal-300',
    activeBorder: 'border-teal-500 shadow-teal-500/20'
  },
  { 
    id: 'wind', 
    label: 'Vento Forte', 
    shortLabel: 'VENTO FORTE', 
    icon: Wind, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30',
    activeBg: 'bg-cyan-500/20 text-cyan-300',
    activeBorder: 'border-cyan-500 shadow-cyan-500/20'
  },
];

export const CLIMATE_CONFIG: Record<string, { label: string; icon: typeof Sun; color: string; bg: string; border: string }> = {
  sun: { label: 'CÉU LIMPO', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  rain: { label: 'CHUVA', icon: CloudRain, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  cloud: { label: 'NUBLADO', icon: Cloud, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  zap: { label: 'TEMPESTADE', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  fog: { label: 'NEBLINA', icon: CloudFog, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  wind: { label: 'VENTO FORTE', icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  moon: { label: 'NOITE', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

export function parseLogPeriod(log?: Partial<LogEntry>): TripPeriod {
  if (log?.period === 'day' || log?.period === 'night' || log?.period === 'all_day') {
    return log.period;
  }
  if (log?.climate === 'moon') return 'night';
  return 'day';
}

export function parseLogClimates(log?: Partial<LogEntry>): string[] {
  if (Array.isArray(log?.climates) && log.climates.length > 0) {
    return log.climates;
  }
  if (typeof log?.climate === 'string' && log.climate.trim()) {
    const list = log.climate.split(',').map(s => s.trim().toLowerCase()).filter(s => s && s !== 'moon');
    if (list.length > 0) return list;
  }
  return ['sun'];
}

export interface LogEntry {
  id: string;
  pilot_id?: string;
  title: string;
  category?: string;
  date: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  bike: string;
  period?: TripPeriod;
  climates?: string[];
  climate: string;
  road: string;
  rating: number;
  content: string;
  image: string;
  stages?: TripStage[];
  mapsUrl?: string;
  photos?: string[];
  documentaryProofs?: DocumentaryProof[];
}

/**
 * Converte qualquer representação de data (ISO ou DD/MM/YYYY) para objeto Date
 */
export function parseLogDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const parts = s.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2].slice(0, 4), 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const parts = s.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2].slice(0, 2), 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Verifica se a data do roteiro está dentro do intervalo [startStr, endStr] de forma inclusiva
 */
export function isDateWithinRange(dateStr?: string, startStr?: string, endStr?: string): boolean {
  if (!startStr && !endStr) return true;
  const d = parseLogDate(dateStr);
  if (!d) return false;

  const logTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  if (startStr) {
    const s = parseLogDate(startStr);
    if (s) {
      const startTime = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
      if (logTime < startTime) return false;
    }
  }

  if (endStr) {
    const e = parseLogDate(endStr);
    if (e) {
      const endTime = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
      if (logTime > endTime) return false;
    }
  }

  return true;
}

/**
 * Obtém o endereço formatado de ponto de partida padrão do piloto
 * se a opção default_start_point estiver ativada
 */
export function getDefaultStartPoint(profile?: any): string {
  // Verifica se o ponto de partida padrão está ativado (padrão é true se não configurado)
  let isEnabled = true;
  if (profile && profile.default_start_point !== undefined) {
    isEnabled = Boolean(profile.default_start_point);
  } else {
    try {
      const savedAddr = localStorage.getItem('motolegado_pilot_address');
      if (savedAddr) {
        const parsed = JSON.parse(savedAddr);
        if (parsed.isDefaultStartPoint !== undefined) {
          isEnabled = Boolean(parsed.isDefaultStartPoint);
        }
      }
    } catch {}
  }

  if (!isEnabled) return '';

  let street = profile?.street || '';
  let streetNumber = profile?.street_number || '';
  let neighborhood = profile?.neighborhood || '';
  let city = profile?.city || '';
  let state = profile?.state || '';

  // Fallback 1: localStorage 'motolegado_pilot_address'
  if (!street && !city) {
    try {
      const savedAddr = localStorage.getItem('motolegado_pilot_address');
      if (savedAddr) {
        const parsed = JSON.parse(savedAddr);
        street = street || parsed.street || '';
        streetNumber = streetNumber || parsed.streetNumber || parsed.street_number || '';
        neighborhood = neighborhood || parsed.neighborhood || '';
        city = city || parsed.city || '';
        state = state || parsed.state || '';
      }
    } catch {}
  }

  // Fallback 2: localStorage 'motolegado_pilot_session'
  if (!street && !city) {
    try {
      const savedSession = localStorage.getItem('motolegado_pilot_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        street = street || parsed.street || '';
        streetNumber = streetNumber || parsed.street_number || '';
        neighborhood = neighborhood || parsed.neighborhood || '';
        city = city || parsed.city || '';
        state = state || parsed.state || '';
      }
    } catch {}
  }

  let streetPart = '';
  if (street) {
    streetPart = street;
    if (streetNumber) {
      streetPart += `, ${streetNumber}`;
    }
    if (neighborhood) {
      streetPart += ` - ${neighborhood}`;
    }
  }

  const cityState = [city, state].filter(Boolean).join(' - ');

  if (streetPart && cityState) {
    return `${streetPart}, ${cityState}`;
  } else if (streetPart) {
    return streetPart;
  } else if (cityState) {
    return cityState;
  }

  return '';
}

export function Logbook() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'trips' | 'checklist'>('trips');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeatureTrigger>('diario_ilimitado');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTripToExport, setSelectedTripToExport] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Identificador único do piloto ativo para isolamento estrito de dados no diário
  const currentPilotKey = user?.id || profile?.id || user?.email || 'guest';
  const currentPilotSet = useMemo(() => {
    return new Set<string>([
      user?.id,
      profile?.id,
      user?.email,
      profile?.email
    ].filter(Boolean).map(s => String(s).toLowerCase()));
  }, [user?.id, profile?.id, user?.email, profile?.email]);

  const userStorageKey = `motolegado_logs_${currentPilotKey}`;

  // Valida se o registro pertence estritamente ao piloto ativo
  const belongsToCurrentPilot = (log: LogEntry): boolean => {
    if (!log) return false;
    if (!log.pilot_id) return true;
    return currentPilotSet.has(log.pilot_id.toLowerCase());
  };

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Filtros de Data para o Histórico e Métricas do Diário
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [quickDatePreset, setQuickDatePreset] = useState<'all' | 'last30' | 'last90' | 'thisMonth' | 'season2026' | 'custom'>('all');
  const [showMetricsPanel, setShowMetricsPanel] = useState<boolean>(true);

  // Aplica predefinições rápidas de período de data
  const handleApplyPreset = (preset: 'all' | 'last30' | 'last90' | 'thisMonth' | 'season2026') => {
    setQuickDatePreset(preset);
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDateFilter('');
      setEndDateFilter('');
      return;
    }

    if (preset === 'last30') {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDateFilter(past30.toISOString().split('T')[0]);
      setEndDateFilter(todayIso);
      return;
    }

    if (preset === 'last90') {
      const past90 = new Date();
      past90.setDate(today.getDate() - 90);
      setStartDateFilter(past90.toISOString().split('T')[0]);
      setEndDateFilter(todayIso);
      return;
    }

    if (preset === 'thisMonth') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setStartDateFilter(`${year}-${month}-01`);
      setEndDateFilter(todayIso);
      return;
    }

    if (preset === 'season2026') {
      setStartDateFilter('2026-01-01');
      setEndDateFilter('2026-12-31');
      return;
    }
  };

  // Filtro de Categoria ('all' ou nome da categoria)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const handleClearDateFilters = () => {
    setStartDateFilter('');
    setEndDateFilter('');
    setQuickDatePreset('all');
  };

  // Filtragem dos roteiros com base no período [startDateFilter, endDateFilter] e categoria
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtro por Categoria predefinida
      if (selectedCategoryFilter !== 'all') {
        const cat = log.category || 'Viagem';
        if (cat.toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      // Filtro por Data
      if (startDateFilter || endDateFilter) {
        return isDateWithinRange(log.date, startDateFilter, endDateFilter);
      }

      return true;
    });
  }, [logs, selectedCategoryFilter, startDateFilter, endDateFilter]);

  const isDateFilterActive = Boolean(startDateFilter || endDateFilter);

  // Rótulo amigável do período ativo
  const formattedPeriodLabel = useMemo(() => {
    if (!startDateFilter && !endDateFilter) return 'Histórico Completo';
    const s = startDateFilter ? (parseLogDate(startDateFilter)?.toLocaleDateString('pt-BR') || startDateFilter) : '';
    const e = endDateFilter ? (parseLogDate(endDateFilter)?.toLocaleDateString('pt-BR') || endDateFilter) : '';

    if (s && e) return `${s} a ${e}`;
    if (s) return `A partir de ${s}`;
    if (e) return `Até ${e}`;
    return 'Período Personalizado';
  }, [startDateFilter, endDateFilter]);

  // Cálculos de métricas e estatísticas para exibição no Diário de Bordo (chamados incondicionalmente no topo)
  const totalKmCalculated = useMemo(() => {
    return logs.reduce((acc, curr) => {
      const num = parseInt(curr.distance, 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [logs]);

  const filteredKmCalculated = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => {
      const num = parseInt(curr.distance, 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [filteredLogs]);

  const filteredMinutesCalculated = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => {
      return acc + parseDurationToMinutes(curr.duration);
    }, 0);
  }, [filteredLogs]);

  const filteredDurationFormatted = useMemo(() => {
    return formatMinutesToReadable(filteredMinutesCalculated);
  }, [filteredMinutesCalculated]);

  const filteredPhotosCount = useMemo(() => {
    return filteredLogs.reduce((acc, curr) => {
      const proofs = curr.documentaryProofs?.length || 0;
      const extraPhotos = curr.photos?.length || 0;
      return acc + Math.max(proofs, extraPhotos, curr.image ? 1 : 0);
    }, 0);
  }, [filteredLogs]);

  const defaultStartPoint = getDefaultStartPoint(profile);

  // Form State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Viagem');
  const [origin, setOrigin] = useState(() => defaultStartPoint);
  const [destination, setDestination] = useState('');
  const [stages, setStages] = useState<TripStage[]>([]);
  const [mapsUrl, setMapsUrl] = useState<string>('');
  const [date, setDate] = useState('');
  const [bike, setBike] = useState(profile?.motorcycle || '');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [period, setPeriod] = useState<TripPeriod>('day');
  const [climates, setClimates] = useState<string[]>(['sun']);
  const [climate, setClimate] = useState('sun');
  const [road, setRoad] = useState('Tapete (Perfeita)');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [documentaryProofs, setDocumentaryProofs] = useState<DocumentaryProof[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTripTarget, setCameraTripTarget] = useState<{ id?: string; title?: string; destination?: string } | null>(null);
  const [lightboxProof, setLightboxProof] = useState<DocumentaryProof | null>(null);
  const [lightboxTripTitle, setLightboxTripTitle] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const tripPhotoInputRef = useRef<HTMLInputElement>(null);
  const directCaptureInputRef = useRef<HTMLInputElement>(null);

  const handleToggleClimate = (climateId: string) => {
    setClimates(prev => {
      if (prev.includes(climateId)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== climateId);
      } else {
        return [...prev, climateId];
      }
    });
  };

  // Roteiros cadastrados para seleção direta no Diário de Bordo
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Carrega roteiros para o seletor
  useEffect(() => {
    const loadRoutes = () => {
      try {
        const saved = localStorage.getItem('motolegado_routes_v3') || localStorage.getItem('motolegado_routes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAvailableRoutes(parsed);
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao carregar roteiros:', err);
      }
      setAvailableRoutes([]);
    };

    loadRoutes();
    window.addEventListener('routes-updated', loadRoutes);
    window.addEventListener('storage', loadRoutes);
    return () => {
      window.removeEventListener('routes-updated', loadRoutes);
      window.removeEventListener('storage', loadRoutes);
    };
  }, []);

  // Lógica principal: quando um roteiro é selecionado, calcula e auto-preenche distância, duração e dados
  const handleSelectRouteForEntry = (routeId: string) => {
    setSelectedRouteId(routeId);
    if (!routeId) return;

    const targetRoute = availableRoutes.find(r => r.id === routeId);
    if (!targetRoute) return;

    // 1. Título do roteiro
    if (targetRoute.name) {
      setTitle(targetRoute.name.toUpperCase());
    }

    // 2. Destino e Ponto de Partida
    const dest = targetRoute.mapsAddress || targetRoute.endPoint || '';
    if (dest) {
      setDestination(dest);
    }
    if (targetRoute.startPoint) {
      setOrigin(targetRoute.startPoint);
    } else if (defaultStartPoint && (!origin || origin === '')) {
      setOrigin(defaultStartPoint);
    }

    // 3. Notas e Descrição
    if (targetRoute.description) {
      setContent(targetRoute.description);
    }

    // 4. Foto de Capa
    if (targetRoute.image) {
      setImage(targetRoute.image);
    }

    // 5. Link Google Maps
    if (targetRoute.mapsUrl) {
      setMapsUrl(targetRoute.mapsUrl);
    }

    // 6. CÁLCULO E AUTO-PREENCHIMENTO DE DISTÂNCIA E DURAÇÃO
    const metrics = estimateRouteMetrics(targetRoute);
    setDistance(metrics.distance);
    setDuration(metrics.duration);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  // Se redirecionado a partir de um Roteiro, preenche automaticamente os dados e abre o formulário
  useEffect(() => {
    const routeTitle = searchParams.get('routeTitle');
    if (routeTitle) {
      setTitle(routeTitle.toUpperCase());
      const dest = searchParams.get('routeDest') || '';
      if (dest) setDestination(dest);
      const orig = searchParams.get('routeOrigin') || '';
      if (orig) setOrigin(orig);
      const desc = searchParams.get('routeDesc') || '';
      if (desc) setContent(desc);
      const img = searchParams.get('routeImg') || '';
      if (img) setImage(img);
      const mUrl = searchParams.get('routeMaps') || '';
      if (mUrl) setMapsUrl(mUrl);

      // Preenchimento garantido de distância e duração
      let dist = searchParams.get('routeDist') || '';
      let dur = searchParams.get('routeDuration') || '';

      // Tenta localizar o roteiro cadastrado correspondente para métricas mais apuradas
      const matched = availableRoutes.find(r => 
        (r.name && r.name.toLowerCase() === routeTitle.toLowerCase()) ||
        (r.mapsAddress && dest && r.mapsAddress.toLowerCase() === dest.toLowerCase())
      );

      if (matched) {
        setSelectedRouteId(matched.id);
        const m = estimateRouteMetrics(matched);
        if (!dist || dist.trim() === '' || dist === '0') dist = m.distance;
        if (!dur || dur.trim() === '') dur = m.duration;
      }

      // Se a distância veio vazia ou zerada, extrai do texto ou calcula
      if (!dist || dist.trim() === '' || dist === '0') {
        const fullTxt = `${routeTitle} ${dest} ${desc}`;
        const match = fullTxt.match(/(\d{1,4}(?:[.,]\d+)?)\s*(?:km|kms|quilômetros|quilometros)\b/i);
        dist = match ? match[1].replace(',', '.') : '150';
      }

      // Se a duração veio vazia, calcula com base na velocidade média de moto (65 km/h)
      if (!dur || dur.trim() === '') {
        const distNum = parseFloat(dist.replace(/\D/g, '')) || 150;
        const totalMinutes = Math.round((distNum / 65) * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        dur = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`;
      }

      setDistance(dist.replace(/\D/g, '') || '150');
      setDuration(dur);
      setDate(new Date().toISOString().split('T')[0]);
      setIsFormOpen(true);
      if (searchParams.get('openCamera') === 'true') {
        setCameraTripTarget({
          title: routeTitle.toUpperCase(),
          destination: dest
        });
        setIsCameraModalOpen(true);
      }
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('openCamera') === 'true') {
      setIsFormOpen(true);
      setIsCameraModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, availableRoutes]);

  // Sincroniza dinamicamente ponto de partida e moto quando o perfil for atualizado ou carregado
  useEffect(() => {
    const syncDefaults = () => {
      const def = getDefaultStartPoint(profile);
      if (def && (!origin || origin === '')) {
        setOrigin(def);
      }
      if (profile?.motorcycle && (!bike || bike === '')) {
        setBike(profile.motorcycle);
      }
    };
    syncDefaults();

    window.addEventListener('motolegado_profile_updated', syncDefaults);
    window.addEventListener('storage', syncDefaults);
    return () => {
      window.removeEventListener('motolegado_profile_updated', syncDefaults);
      window.removeEventListener('storage', syncDefaults);
    };
  }, [profile]);

  const isProOrBonificado = Boolean(
    isUserProOrBonificado(profile) ||
    profile?.is_pro ||
    profile?.plan_type === 'bonificado' ||
    profile?.plan_type === 'pago' ||
    profile?.role === 'admin' ||
    user?.email?.toLowerCase().trim() === 'ciceroranieri@gmail.com' ||
    profile?.email?.toLowerCase().trim() === 'ciceroranieri@gmail.com' ||
    user?.email?.toLowerCase().includes('admin')
  );

  // Contagem precisa de registros do mês atual considerando qualquer formato de data (DD/MM/AAAA ou ISO)
  const thisMonthLogsCount = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();
    return logs.filter(l => {
      const d = parseLogDate(l.date);
      if (!d) return false;
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    }).length;
  }, [logs]);

  const isFreeLimitReached = !isProOrBonificado && thisMonthLogsCount >= 5;

  const handleOpenForm = () => {
    if (isFreeLimitReached) {
      setUpgradeFeature('diario_ilimitado');
      setIsUpgradeModalOpen(true);
      return;
    }
    const def = getDefaultStartPoint(profile);
    setEditingLogId(null);
    setTitle('');
    setCategory('Viagem');
    setOrigin(def);
    setDestination('');
    setStages([]);
    setMapsUrl('');
    setDate(new Date().toLocaleDateString('pt-BR'));
    setBike(profile?.motorcycle || '');
    setDistance('');
    setDuration('');
    setPeriod('day');
    setClimates(['sun']);
    setClimate('sun');
    setRoad('Tapete (Perfeita)');
    setRating(5);
    setContent('');
    setImage('');
    setDocumentaryProofs([]);
    setSelectedRouteId('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEditLog = (log: LogEntry) => {
    setEditingLogId(log.id);
    setTitle(log.title || '');
    setCategory(log.category || 'Viagem');
    setOrigin(log.origin || '');
    setDestination(log.destination || '');
    setStages(log.stages ? [...log.stages] : []);
    setMapsUrl(log.mapsUrl || '');
    setDate(log.date || '');
    setBike(log.bike || profile?.motorcycle || '');
    setDistance(log.distance ? log.distance.replace(/\D/g, '') : '');
    setDuration(log.duration || '');
    const parsedPeriod = parseLogPeriod(log);
    const parsedClimates = parseLogClimates(log);
    setPeriod(parsedPeriod);
    setClimates(parsedClimates);
    setClimate(parsedClimates.join(', '));
    setRoad(log.road || 'Tapete (Perfeita)');
    setRating(log.rating ?? 5);
    setContent(log.content || '');
    setImage(log.image || '');
    setDocumentaryProofs(log.documentaryProofs ? [...log.documentaryProofs] : []);
    setSelectedRouteId('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteLog = async (targetId: string) => {
    const updated = logs.filter((l) => l.id !== targetId);
    setLogs(updated);
    localStorage.setItem(userStorageKey, JSON.stringify(updated));
    localStorage.setItem('motolegado_logs', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('motolegado_logs_updated', { detail: { pilotId: currentPilotKey, logs: updated } }));
    window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
    window.dispatchEvent(new Event('storage'));

    // Sincroniza exclusão no MySQL da Hostinger
    deleteTripFromHostinger(targetId).catch(err => {
      console.warn('Aviso ao sincronizar exclusão com Hostinger:', err);
    });

    setLogToDelete(null);
  };

  const handleOpenReportModal = (singleTrip?: LogEntry) => {
    setSelectedTripToExport(singleTrip || null);
    setIsReportModalOpen(true);
  };

  const handleAttachProofs = (newProofs: DocumentaryProof[]) => {
    if (cameraTripTarget && cameraTripTarget.id) {
      // Adicionando fotos da câmera a uma viagem já concluída
      const targetId = cameraTripTarget.id;
      const targetTrip = logs.find(l => l.id === targetId);
      
      const currentProofs = targetTrip?.documentaryProofs || [];
      const mergedProofs = [...currentProofs, ...newProofs];
      const newPhotoUrls = newProofs.map((p) => p.url);
      const currentPhotos = (targetTrip?.photos || [targetTrip?.image || '']).filter(p => p && !p.includes('images.unsplash.com'));
      const mergedPhotos = Array.from(new Set([...newPhotoUrls, ...currentPhotos, ...(targetTrip?.photos || [])])).filter(Boolean);
      const isStockCover = !targetTrip?.image || targetTrip.image.includes('images.unsplash.com');
      
      const updatedTrip: LogEntry = {
        ...(targetTrip || ({} as LogEntry)),
        id: targetId,
        pilot_id: targetTrip?.pilot_id || currentPilotKey,
        documentaryProofs: mergedProofs,
        photos: mergedPhotos,
        // Se a capa era genérica/Unsplash, a nova foto real do usuário torna-se a capa
        image: isStockCover && newPhotoUrls.length > 0 ? newPhotoUrls[0] : (targetTrip?.image || newPhotoUrls[0])
      };

      setLogs((prev) => {
        const updated = prev.map((log) => (log.id === targetId ? updatedTrip : log));
        localStorage.setItem(userStorageKey, JSON.stringify(updated));
        localStorage.setItem('motolegado_logs', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('motolegado_logs_updated', { detail: { pilotId: currentPilotKey, logs: updated } }));
        window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
        window.dispatchEvent(new Event('storage'));
        return updated;
      });

      // Sincroniza imediatamente com o banco de dados MySQL da Hostinger
      saveLogsToStorage(updatedTrip, true).catch(err => {
        console.warn('Erro ao sincronizar nova prova documental no MySQL:', err);
      });
      setCameraTripTarget(null);
    } else {
      // Adicionando fotos ao formulário atual
      setDocumentaryProofs((prev) => [...prev, ...newProofs]);
      // A foto enviada pelo usuário TEM PRIORIDADE TOTAL como capa da viagem
      if (newProofs.length > 0) {
        setImage(newProofs[0].url);
      }
    }
  };

  const handleDirectCaptureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'trips',
        userId: user?.id || 'pilot',
      });

      if (result.success && result.url) {
        const now = new Date();
        const newProof: DocumentaryProof = {
          id: `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: result.url,
          type: 'arrival',
          caption: 'Foto de prova documental tirada pelo celular',
          timestamp: `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          location: title || destination || undefined,
          hasWatermark: false
        };
        // A foto tirada pelo usuário se torna a capa principal imediatamente
        setImage(result.url);
        handleAttachProofs([newProof]);
      } else {
        alert(result.error || 'Erro ao processar imagem.');
      }
    } catch (err) {
      console.error('Erro na foto da câmera:', err);
      alert('Falha ao processar foto da câmera.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleTripPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const addedProofs: DocumentaryProof[] = [];
    let firstUploadedUrl = '';

    try {
      for (const file of Array.from(files)) {
        const result = await uploadImageToStorage(file, {
          folder: 'trips',
          userId: user?.id || 'pilot',
        });

        if (result.success && result.url) {
          if (!firstUploadedUrl) firstUploadedUrl = result.url;
          const now = new Date();
          const cleanFileName = file.name ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
          addedProofs.push({
            id: `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url: result.url,
            type: 'arrival',
            caption: cleanFileName ? `Foto: ${cleanFileName}` : 'Foto anexada da galeria',
            timestamp: `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            location: title || destination || undefined,
            hasWatermark: false
          });
        }
      }

      if (firstUploadedUrl) {
        // A foto real enviada pelo usuário se torna a capa principal
        setImage(firstUploadedUrl);
      }

      if (addedProofs.length > 0) {
        handleAttachProofs(addedProofs);
      } else {
        alert('Não foi possível processar a foto selecionada.');
      }
    } catch (err) {
      console.error('Erro no upload da foto da viagem:', err);
      alert('Falha ao processar a foto.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Carregamento estritamente isolado para o piloto ativo
  useEffect(() => {
    // 1. Limpa o estado imediatamente ao trocar de usuário para NUNCA exibir registros de outro piloto
    setLogs([]);

    // 2. Carrega estritamente os logs locais do piloto atual
    let localLogs: LogEntry[] = [];
    const savedUserLogs = localStorage.getItem(userStorageKey);
    if (savedUserLogs) {
      try {
        const parsed = JSON.parse(savedUserLogs);
        if (Array.isArray(parsed)) {
          localLogs = parsed.filter(belongsToCurrentPilot);
          setLogs(localLogs);
        }
      } catch (e) {
        console.error('Error loading logbook from user storage', e);
      }
    } else {
      // Fallback para storage legado filtrando OBRIGATORIAMENTE pelo piloto atual
      const legacySaved = localStorage.getItem('motolegado_logs');
      if (legacySaved) {
        try {
          const parsed = JSON.parse(legacySaved);
          if (Array.isArray(parsed)) {
            localLogs = parsed.filter(belongsToCurrentPilot);
            setLogs(localLogs);
          }
        } catch {}
      }
    }

    // 3. Carregar e sincronizar viagens estritamente deste piloto no MySQL da Hostinger
    const activePilotId = user?.id || profile?.id || user?.email;
    if (activePilotId) {
      getTripsFromHostinger(activePilotId)
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

              const isStockUrl = (u?: string) => !u || u.includes('images.unsplash.com');
              const realUserPhoto = photos.find(p => !isStockUrl(p));
              const realProofPhoto = Array.isArray(checklist?.documentaryProofs)
                ? checklist.documentaryProofs.find((p: any) => !isStockUrl(p?.url))?.url
                : null;
              const resolvedCover = (!isStockUrl(checklist?.image) ? checklist?.image : null) || realUserPhoto || realProofPhoto || checklist?.image || photos[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

              // Formata data do MySQL (YYYY-MM-DD) de forma amigável para exibição brasileira (DD/MM/AAAA)
              let rawDate = t.start_date ? String(t.start_date).split('T')[0] : (t.date || '');
              let displayDate = rawDate;
              if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                const [y, m, d] = rawDate.split('-');
                displayDate = `${d}/${m}/${y}`;
              }

              return {
                id: String(t.id),
                pilot_id: t.pilot_id ? String(t.pilot_id) : currentPilotKey,
                title: t.title || 'Viagem Registrada',
                category: checklist?.category || t.category || 'Viagem',
                date: displayDate || new Date().toLocaleDateString('pt-BR'),
                origin: t.start_location || t.origin || '',
                destination: t.destination || '',
                distance: String(Math.round(parseFloat(t.distance_km) || 0)),
                duration: checklist?.duration || t.duration || '2h 30min',
                bike: t.motorcycle_used || t.bike_model || profile?.motorcycle || 'Motocicleta',
                period: checklist?.period || t.period || (checklist?.climate === 'moon' || t.climate === 'moon' ? 'night' : 'day'),
                climates: Array.isArray(checklist?.climates) ? checklist.climates : (Array.isArray(t.climates) ? t.climates : parseLogClimates({ climate: checklist?.climate || t.climate })),
                climate: checklist?.climate || t.climate || 'sun',
                road: checklist?.road || t.road || 'Tapete (Perfeita)',
                rating: checklist?.rating || t.rating || 5,
                content: t.description || checklist?.content || t.notes || '',
                image: resolvedCover,
                stages: Array.isArray(checklist?.stages) ? checklist.stages : (Array.isArray(t.stages) ? t.stages : []),
                mapsUrl: checklist?.mapsUrl || t.maps_url || undefined,
                photos: photos.length > 0 ? photos : (resolvedCover ? [resolvedCover] : []),
                documentaryProofs: Array.isArray(checklist?.documentaryProofs) ? checklist.documentaryProofs : []
              };
            });

            // Mescla sem perda de dados e evitando duplicações por ID (apenas do piloto atual)
            const merged: LogEntry[] = [];
            const seenIds = new Set<string>();

            mappedLogs.forEach(ml => {
              seenIds.add(ml.id);

              // Tenta localizar versão local correspondente para enriquecer dados
              const localMatch = localLogs.find(l => l.id === ml.id);
              if (localMatch) {
                const combinedPhotos = Array.from(new Set([...(ml.photos || []), ...(localMatch.photos || [])]));
                const combinedProofs = (ml.documentaryProofs && ml.documentaryProofs.length > 0)
                  ? ml.documentaryProofs
                  : (localMatch.documentaryProofs || []);
                const isStock = (u?: string) => !u || u.includes('images.unsplash.com');
                const combinedCover = (!isStock(ml.image) ? ml.image : null) 
                  || (!isStock(localMatch.image) ? localMatch.image : null)
                  || ml.image 
                  || localMatch.image;

                // Preserva dados preenchidos localmente caso o banco tenha campos nulos/vazios
                merged.push({
                  ...ml,
                  title: ml.title || localMatch.title,
                  origin: ml.origin || localMatch.origin,
                  destination: ml.destination || localMatch.destination,
                  content: ml.content || localMatch.content,
                  bike: (ml.bike && ml.bike !== 'Motocicleta') ? ml.bike : (localMatch.bike || ml.bike),
                  distance: (ml.distance && ml.distance !== '0') ? ml.distance : (localMatch.distance || ml.distance),
                  category: ml.category || localMatch.category,
                  duration: ml.duration || localMatch.duration,
                  period: ml.period || localMatch.period || 'day',
                  climates: ml.climates || localMatch.climates || ['sun'],
                  climate: ml.climate || localMatch.climate,
                  road: ml.road || localMatch.road,
                  rating: ml.rating || localMatch.rating,
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

            // Preserva registros locais que ainda não foram sincronizados com o banco
            localLogs.forEach(ll => {
              if (!seenIds.has(ll.id)) {
                seenIds.add(ll.id);
                merged.push(ll);
              }
            });

            merged.sort((a, b) => {
              const timeA = parseLogDate(a.date)?.getTime() || 0;
              const timeB = parseLogDate(b.date)?.getTime() || 0;
              return timeB - timeA;
            });

            setLogs(merged);
            localStorage.setItem(userStorageKey, JSON.stringify(merged));
          } else {
            setLogs(localLogs);
            localStorage.setItem(userStorageKey, JSON.stringify(localLogs));
          }
        })
        .catch((err) => {
          console.warn('Sincronização offline ou aguardando resposta da Hostinger:', err);
          setLogs(localLogs);
        });
    } else {
      setLogs(localLogs);
    }
  }, [user?.id, profile?.id, user?.email, profile?.email, currentPilotKey]);

  const saveLogsToStorage = async (entry: LogEntry, isEdit: boolean = false) => {
    const finalEntry: LogEntry = {
      ...entry,
      pilot_id: entry.pilot_id || currentPilotKey
    };

    // Carrega registros locais atuais para evitar qualquer perda por closure desatualizada
    let baseLogs: LogEntry[] = [];
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) baseLogs = parsed.filter(belongsToCurrentPilot);
      }
    } catch {}
    if (baseLogs.length === 0) {
      baseLogs = logs.filter(belongsToCurrentPilot);
    }

    let updated: LogEntry[];
    if (isEdit) {
      updated = baseLogs.map((l) => (l.id === finalEntry.id ? finalEntry : l));
    } else {
      updated = [finalEntry, ...baseLogs.filter(l => l.id !== finalEntry.id)];
    }
    setLogs(updated);
    localStorage.setItem(userStorageKey, JSON.stringify(updated));
    localStorage.setItem('motolegado_logs', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('motolegado_logs_updated', { detail: { pilotId: currentPilotKey, logs: updated } }));
    window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
    window.dispatchEvent(new Event('storage'));

    // Sincronização direta e resiliente com o MySQL da Hostinger com mapeamento completo de colunas
    try {
      // Converte data para formato SQL YYYY-MM-DD sem erro de timezone
      let sqlDate = '';
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(finalEntry.date)) {
        const parts = finalEntry.date.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].slice(0, 4);
        sqlDate = `${year}-${month}-${day}`;
      } else if (/^\d{4}-\d{1,2}-\d{1,2}/.test(finalEntry.date)) {
        sqlDate = finalEntry.date.slice(0, 10);
      } else {
        const d = parseLogDate(finalEntry.date) || new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        sqlDate = `${year}-${month}-${day}`;
      }

      await syncTripToHostinger({
        id: finalEntry.id,
        pilot_id: finalEntry.pilot_id || currentPilotKey,
        title: finalEntry.title,
        origin: finalEntry.origin,
        start_location: finalEntry.origin,
        destination: finalEntry.destination,
        distance_km: parseFloat(finalEntry.distance?.replace(/[^\d.]/g, '') || '0') || 0,
        start_date: sqlDate,
        motorcycle_used: finalEntry.bike,
        description: finalEntry.content,
        content: finalEntry.content,
        image: finalEntry.image,
        photos: finalEntry.photos || (finalEntry.image ? [finalEntry.image] : []),
        category: finalEntry.category,
        duration: finalEntry.duration,
        climate: finalEntry.climate,
        road: finalEntry.road,
        rating: finalEntry.rating,
        stages: finalEntry.stages,
        mapsUrl: finalEntry.mapsUrl,
        documentaryProofs: finalEntry.documentaryProofs,
        checklist_data: {
          stages: finalEntry.stages,
          mapsUrl: finalEntry.mapsUrl,
          documentaryProofs: finalEntry.documentaryProofs,
          image: finalEntry.image,
          category: finalEntry.category,
          duration: finalEntry.duration,
          period: finalEntry.period,
          climates: finalEntry.climates,
          climate: finalEntry.climate,
          road: finalEntry.road,
          rating: finalEntry.rating,
          content: finalEntry.content
        }
      });
    } catch (err) {
      console.warn('Aviso ao sincronizar viagem com a Hostinger:', err);
    }
  };

  const handleFinish = async () => {
    if (isUploadingPhoto) {
      alert('Aguarde o envio da foto ser concluído antes de salvar o lançamento.');
      return;
    }

    let cleanTitle = title.trim();
    if (!cleanTitle) {
      if (origin && destination) {
        cleanTitle = `${origin} a ${destination}`.toUpperCase();
      } else if (destination) {
        cleanTitle = `Roteiro para ${destination}`.toUpperCase();
      } else {
        setFormError('Por favor, informe o título da viagem para continuar.');
        return;
      }
    }
    setFormError(null);
    setIsSaving(true);

    try {
      let formattedDate = date;
      if (date && date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          const [y, m, d] = parts;
          formattedDate = `${d}/${m}/${y}`;
        }
      }

      const validStages = stages.filter(s => s.name && s.name.trim().length > 0);
      
      const isStockUrl = (url?: string) => !url || url.includes('images.unsplash.com');

      // Foto enviada pelo usuário em Provas Documentais ou na Capa tem prioridade MÁXIMA
      const userProofPhoto = documentaryProofs.find(p => p.url && !isStockUrl(p.url))?.url;
      const userDirectCover = image && !isStockUrl(image) ? image : null;

      // Se o usuário enviou uma foto, ela DEVE ser a capa principal do card
      const finalCover = userProofPhoto 
        || userDirectCover 
        || (documentaryProofs.length > 0 ? documentaryProofs[0].url : null) 
        || image 
        || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';

      // Organiza fotos para que as fotos reais do usuário sempre fiquem em primeiro lugar
      const proofUrls = documentaryProofs.map(p => p.url).filter(Boolean);
      const allPhotos = Array.from(new Set([finalCover, ...proofUrls].filter(Boolean)));

      const entryId = editingLogId || Date.now().toString();

      const finalClimates = climates.length > 0 ? climates : ['sun'];
      const primaryClimateString = finalClimates.join(', ');

      const entryToSave: LogEntry = {
        id: entryId,
        pilot_id: currentPilotKey,
        title: cleanTitle.toUpperCase(),
        category: category || 'Viagem',
        date: formattedDate || new Date().toLocaleDateString('pt-BR'),
        origin: origin || 'Cidade de Origem',
        destination: destination || 'Cidade de Destino',
        distance: distance ? distance.replace(/\D/g, '') || '100' : '100',
        duration: duration || '2h 30min',
        bike: bike || profile?.motorcycle || 'Motocicleta',
        period,
        climates: finalClimates,
        climate: primaryClimateString,
        road,
        rating,
        content: content || 'Viagem concluída com sucesso e registrada no diário de bordo com comprovação fotográfica.',
        image: finalCover,
        stages: validStages,
        mapsUrl: mapsUrl || undefined,
        photos: allPhotos,
        documentaryProofs: documentaryProofs
      };

      await saveLogsToStorage(entryToSave, Boolean(editingLogId));

      // Reseta quaisquer filtros de data ou categoria para garantir que a viagem recém-registrada apareça imediatamente no topo da lista!
      handleClearDateFilters();
      setSelectedCategoryFilter('all');

      // Pequena pausa para garantir feedback visual agradável da gravação
      await new Promise(resolve => setTimeout(resolve, 500));

      setSuccessToast(editingLogId ? 'Lançamento atualizado com sucesso no Diário de Bordo!' : 'Registro cadastrado com sucesso no seu Diário de Bordo!');

      // Reset Form
      setEditingLogId(null);
      setTitle('');
      setCategory('Viagem');
      setOrigin('');
      setDestination('');
      setStages([]);
      setMapsUrl('');
      setDistance('');
      setDuration('');
      setPeriod('day');
      setClimates(['sun']);
      setClimate('sun');
      setContent('');
      setImage('');
      setDocumentaryProofs([]);
      setSelectedRouteId('');
      setFormError(null);
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Erro ao salvar no Diário de Bordo:', err);
      setFormError('Falha ao processar o salvamento do registro. Por favor, tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAiStory = () => {
    const t = title || 'Giro pelo Interior';
    const o = origin || 'Florianópolis';
    const d = destination || 'Serra Catarinense';
    const km = distance || '220';
    
    setContent(`Diário de bordo: "${t}". Partida ao amanhecer em ${o} com destino a ${d}. O trecho de ${km}km surpreendeu pela excelente fluidez do tráfego e trechos de curvas envolventes. Parada estratégica no mirante para fotos e um café quente. A moto manteve desempenho exemplar durante toda a travessia, consolidando mais um registro memorável no diário de bordo do MotoLegado.`);
  };

  // Indicador visual de carregamento durante salvamento no diário
  const savingIndicatorOverlay = (
    <AnimatePresence>
      {isSaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            className="relative p-8 rounded-3xl bg-slate-900 border border-orange-500/40 shadow-2xl shadow-orange-500/20 flex flex-col items-center max-w-sm w-full space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
              <Loader2 size={32} className="animate-spin text-orange-500" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                {editingLogId ? 'Atualizando Diário' : 'Salvando no Diário'}
              </h4>
              <p className="text-xs text-slate-400">
                Sincronizando telemetria, fotos e dados com o banco de dados...
              </p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Toast flutuante de sucesso
  const floatingSuccessToast = (
    <AnimatePresence>
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 right-6 z-[110] flex items-center gap-3 px-5 py-4 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md text-emerald-200 max-w-md"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 pr-2">
            <p className="text-xs font-black uppercase tracking-wider text-white">Diário de Bordo</p>
            <p className="text-[11px] text-emerald-300 font-medium">{successToast}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isFormOpen) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 min-h-screen">
        {savingIndicatorOverlay}
        {floatingSuccessToast}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/profile')}
              className="mb-3 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Perfil do Piloto</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase">
              DIÁRIO DE <span className="text-orange-500">BORDO</span>
            </h1>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/40 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] overflow-hidden"
        >
          {/* Form Header */}
          <div className="p-5 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                editingLogId ? "bg-amber-600 shadow-md shadow-amber-600/30" : "bg-orange-600 shadow-md shadow-orange-600/30"
              )}>
                 {editingLogId ? <Pencil size={18} /> : <Compass size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white italic uppercase">
                    {editingLogId ? 'EDITAR LANÇAMENTO NO DIÁRIO' : 'GRAVAR NOVA LENDA'}
                  </h2>
                  {editingLogId && (
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase not-italic">
                      Modo Edição
                    </span>
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                  {editingLogId 
                    ? 'ATUALIZE AS INFORMAÇÕES, ROTAS E FOTOS DESTA VIAGEM' 
                    : 'PREENCHA OS DADOS TÉCNICOS DA SUA JORNADA'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsFormOpen(false);
                setEditingLogId(null);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-10">
            {/* Route Selector (Auto-populates Title, Destination, Distance & Duration) */}
            {availableRoutes.length > 0 && (
              <div className="space-y-2.5 p-4 sm:p-5 bg-gradient-to-r from-orange-500/10 via-slate-900/40 to-slate-900/60 border border-orange-500/30 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Navigation size={14} className="text-orange-500" />
                    SELECIONAR ROTEIRO CADASTRADO (CÁLCULO AUTOMÁTICO DE KM & TEMPO)
                  </label>
                  {selectedRouteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRouteId('');
                      }}
                      className="text-[9px] font-black text-slate-400 hover:text-white uppercase transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      ✕ Limpar Roteiro
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedRouteId}
                    onChange={(e) => handleSelectRouteForEntry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-orange-500/50 focus:border-orange-500 rounded-xl py-3.5 px-4 text-xs font-bold text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Escolha um roteiro para auto-preencher distância, tempo e destino --</option>
                    {availableRoutes.map((r) => {
                      const m = estimateRouteMetrics(r);
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} • {m.distance} KM • {m.duration} ({r.difficulty})
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedRouteId ? (
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 ml-1">
                    <Sparkles size={12} />
                    Roteiro selecionado! Distância ({distance} KM) e Duração ({duration}) calculadas e preenchidas automaticamente.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 ml-1">
                    Ao selecionar um roteiro, o título, destino, link do mapa, fotos, distância e duração de pilotagem serão calculados e preenchidos automaticamente.
                  </p>
                )}
              </div>
            )}

            {/* Title & Category Input Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Title Input */}
              <div className="lg:col-span-8 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                  TÍTULO DO ROTEIRO / NOME DO REGISTRO
                </label>
                <div className="relative group">
                  <Compass className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:scale-110 transition-transform" size={18} />
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Dê um nome para sua aventura ou registro (ex: Tour das Serras, Revisão dos 10.000km)"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Category Dropdown (Campo de Seleção) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                    <Tag size={13} className="text-orange-500" />
                    CATEGORIA DO REGISTRO
                  </label>
                  <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">
                    {category}
                  </span>
                </div>
                <div className="relative group">
                  <select 
                    id="logbook-category-dropdown"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 focus:border-orange-500 rounded-2xl py-5 pl-5 pr-12 text-sm font-black text-white focus:outline-none transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="Viagem" className="bg-slate-950 text-white font-bold py-2">🧭 Viagem</option>
                    <option value="Passeio" className="bg-slate-950 text-white font-bold py-2">🏍️ Passeio</option>
                    <option value="Encontro" className="bg-slate-950 text-white font-bold py-2">👥 Encontro</option>
                    <option value="Manutenção" className="bg-slate-950 text-white font-bold py-2">🔧 Manutenção</option>
                    <option value="Outro" className="bg-slate-950 text-white font-bold py-2">🏷️ Outro</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-orange-500 group-hover:scale-110 transition-transform">
                    <ChevronDown size={18} />
                  </div>
                </div>

                {/* Atalhos Rápidos de Categorias Predefinidas */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    { id: 'Viagem', label: 'Viagem', icon: Compass, color: 'text-orange-400' },
                    { id: 'Passeio', label: 'Passeio', icon: Bike, color: 'text-emerald-400' },
                    { id: 'Encontro', label: 'Encontro', icon: Users, color: 'text-purple-400' },
                    { id: 'Manutenção', label: 'Manutenção', icon: Wrench, color: 'text-amber-400' },
                  ].map((catItem) => {
                    const CatIcon = catItem.icon;
                    const isSelected = category === catItem.id;
                    return (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => setCategory(catItem.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border",
                          isSelected
                            ? "bg-orange-500 text-slate-950 border-orange-400 font-black shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                        )}
                      >
                        <CatIcon size={11} className={isSelected ? "text-slate-950" : catItem.color} />
                        <span>{catItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Technical Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">LOCAL DE PARTIDA</label>
                  {defaultStartPoint && (
                    <button
                      type="button"
                      onClick={() => setOrigin(defaultStartPoint)}
                      className="text-[9px] font-black uppercase text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 cursor-pointer bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded-md border border-orange-500/20"
                      title="Usar endereço padrão cadastrado no perfil"
                    >
                      <MapPin size={10} className="text-orange-400" />
                      <span>Endereço Padrão</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={defaultStartPoint || "De onde partiu?"} 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
                {origin && defaultStartPoint && origin === defaultStartPoint ? (
                  <p className="text-[10px] text-emerald-400 font-bold ml-1 flex items-center gap-1">
                    ✓ Ponto de partida padrão carregado do cadastro
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-medium ml-1">
                    {defaultStartPoint ? 'Você pode alterar o local de partida se necessário.' : 'Defina seu ponto de partida padrão nas Configurações de Perfil.'}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DATA DO ROTEIRO</label>
                <DateInput 
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  placeholder="Selecione a data"
                  className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">MOTO UTILIZADA</label>
                <div className="relative">
                  <Bike className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={bike}
                    onChange={(e) => setBike(e.target.value)}
                    placeholder="Iron 883" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DESTINO FINAL</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Aonde chegou?" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DISTÂNCIA TOTAL (KM)</label>
                  {distance && (
                    <span className="text-[9px] font-bold text-orange-400 font-mono">
                      {distance.replace(/\D/g, '')} KM
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Compass className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50 rotate-45" size={16} />
                  <input 
                    type="text" 
                    value={distance}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDistance(val);
                      const num = parseInt(val.replace(/\D/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        const totalMinutes = Math.round((num / 65) * 60);
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        setDuration(hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`);
                      }
                    }}
                    placeholder="Ex: 288" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50 font-mono" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">DURAÇÃO DA VIAGEM</label>
                  {distance && (
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(distance.replace(/\D/g, ''), 10);
                        if (!isNaN(num) && num > 0) {
                          const totalMinutes = Math.round((num / 65) * 60);
                          const hours = Math.floor(totalMinutes / 60);
                          const mins = totalMinutes % 60;
                          setDuration(hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`);
                        }
                      }}
                      className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase flex items-center gap-1 cursor-pointer transition-colors"
                      title="Recalcular tempo estimado com base na velocidade de pilotagem em viagem (65 km/h com paradas)"
                    >
                      <Sparkles size={10} />
                      <span>Recalcular Tempo</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50" size={16} />
                  <input 
                    type="text" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: 4h 24min" 
                    className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 pl-14 text-[13px] font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50 font-mono" 
                  />
                </div>
              </div>
            </div>

            {/* Gerenciador de Etapas e Paradas da Rota (com importação do Google Maps) */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
              <TripStagesManager
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                stages={stages}
                setStages={setStages}
                setTitle={setTitle}
                currentTitle={title}
                onMapsUrlGenerated={(url) => setMapsUrl(url)}
                setDistance={setDistance}
                setDuration={setDuration}
              />
            </div>

            {/* Bloco de Condições: Período do Roteiro e Clima (Múltipla Seleção) */}
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-slate-950/60 border border-slate-800/80 shadow-inner space-y-6">
              
              {/* Opção 1: Período do Roteiro (De dia / De noite / O dia todo) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    1. Período do Roteiro
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Quando o trajeto foi realizado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(TRIP_PERIOD_CONFIG) as TripPeriod[]).map((pKey) => {
                    const pConfig = TRIP_PERIOD_CONFIG[pKey];
                    const isSelected = period === pKey;
                    const IconComp = pConfig.icon;

                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => setPeriod(pKey)}
                        className={cn(
                          "relative flex items-center sm:flex-col sm:justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-left sm:text-center group",
                          isSelected
                            ? "bg-slate-900 border-orange-500 ring-1 ring-orange-500/50 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 hidden sm:block" />
                        )}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 transition-transform group-hover:scale-105 shrink-0",
                          isSelected ? pConfig.bg : "bg-slate-900"
                        )}>
                          <IconComp size={18} className={isSelected ? pConfig.color : "text-slate-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "block text-xs sm:text-sm font-black tracking-tight",
                            isSelected ? "text-white" : "text-slate-300"
                          )}>
                            {pConfig.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5 truncate">
                            {pConfig.subLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px bg-slate-800/80" />

              {/* Opção 2: Clima da Viagem (Múltipla Seleção) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    2. Condições Climáticas (Múltipla Escolha)
                  </label>
                  <span className="text-[11px] text-orange-400/95 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-orange-500" />
                    Pode marcar mais de um tipo de clima (ex: sol e chuva no mesmo dia)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {WEATHER_CONDITIONS.map((cond) => {
                    const isSelected = climates.includes(cond.id);
                    const CondIcon = cond.icon;

                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => handleToggleClimate(cond.id)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-3 rounded-xl sm:rounded-2xl border transition-all text-center group cursor-pointer select-none",
                          isSelected
                            ? cn("border-2 shadow-md", cond.activeBorder, "bg-slate-900/90")
                            : "bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        )}
                        title={`Clique para marcar/desmarcar ${cond.label}`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-xs">
                            <Check size={10} className="text-slate-950 stroke-[3]" />
                          </div>
                        )}
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110",
                          isSelected ? cond.bg : "bg-slate-900/60"
                        )}>
                          <CondIcon size={18} className={isSelected ? cond.color : "text-slate-500"} />
                        </div>
                        <span className={cn(
                          "text-[11px] sm:text-xs font-bold leading-tight",
                          isSelected ? "text-white" : "text-slate-400"
                        )}>
                          {cond.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Linha com Estado da Estrada e Avaliação da Rota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">ESTADO DA ESTRADA</label>
                <select 
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  className="w-full bg-slate-950/30 border border-slate-800 rounded-2xl py-4 px-6 text-[13px] font-bold text-white focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                >
                  <option value="Tapete (Perfeita)">Tapete (Perfeita)</option>
                  <option value="Razoável">Razoável</option>
                  <option value="Crítica (Buracos)">Crítica (Buracos)</option>
                  <option value="Chão Batido / Terra">Chão Batido / Terra</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center md:text-left">AVALIAÇÃO DA ROTA</label>
                <div className="flex items-center justify-center md:justify-start gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star size={22} className={cn(s <= rating ? "text-orange-500 fill-orange-500" : "text-slate-800")} />
                    </button>
                  ))}
                  <span className="text-xs font-black text-orange-400 ml-2">
                    {rating}/5.0
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Provas Documentais da Câmera & Relato */}
            <div className="space-y-6 pt-6">
              {/* Seção Destacada de Prova Documental Fotográfica */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-500">
                      <Camera size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic tracking-wide flex items-center gap-2">
                        PROVAS DOCUMENTAIS DO ROTEIRO
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full not-italic tracking-normal flex items-center gap-1">
                          <ShieldCheck size={10} /> CÂMERA & CERTIFICAÇÃO
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tire fotos da chegada, odômetro, mirantes e paradas com carimbo oficial de data e rota.
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação de Câmera */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTripTarget({
                          title: title || 'Roteiro',
                          destination: destination || ''
                        });
                        setIsCameraModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <Camera size={15} />
                      <span>Tirar Foto com a Câmera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => directCaptureInputRef.current?.click()}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Acionar câmera nativa do celular diretamente"
                    >
                      <Layers size={14} className="text-orange-500" />
                      <span>Câmera do Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => tripPhotoInputRef.current?.click()}
                      className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Escolher arquivo da galeria"
                    >
                      <span>Galeria</span>
                    </button>
                  </div>
                </div>

                {/* Inputs ocultos de upload */}
                <input
                  type="file"
                  ref={tripPhotoInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleTripPhotoUpload}
                />
                <input
                  type="file"
                  ref={directCaptureInputRef}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleDirectCaptureUpload}
                />

                {/* Galeria de Provas Anexadas no Formulário */}
                {documentaryProofs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                      <span>{documentaryProofs.length} {documentaryProofs.length === 1 ? 'Foto Documental Anexada' : 'Fotos Documentais Anexadas'}</span>
                      <span className="text-[10px] text-slate-500 font-bold lowercase italic">clique na foto para ampliar em tela cheia</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {documentaryProofs.map((proof) => {
                        const typeInfo = PROOF_TYPES.find((t) => t.id === proof.type) || {
                          icon: '📸',
                          label: 'Foto de Rota'
                        };
                        const isCover = image === proof.url;

                        return (
                          <div
                            key={proof.id}
                            className={cn(
                              "relative bg-slate-900 border rounded-2xl overflow-hidden group transition-all",
                              isCover ? "border-orange-500 shadow-md shadow-orange-500/10" : "border-slate-800 hover:border-slate-700"
                            )}
                          >
                            <div 
                              className="aspect-[4/3] w-full overflow-hidden bg-black cursor-pointer relative"
                              onClick={() => {
                                setLightboxProof(proof);
                                setLightboxTripTitle(title || 'Roteiro');
                              }}
                            >
                              <img
                                src={proof.url}
                                alt={proof.caption || typeInfo.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-xs flex items-center gap-1">
                                <span>{typeInfo.icon}</span>
                                <span>{typeInfo.label}</span>
                              </div>

                              {isCover && (
                                <div className="absolute bottom-2 left-2 bg-orange-600 text-white rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest shadow-md">
                                  ⭐ Capa Principal
                                </div>
                              )}
                            </div>

                            <div className="p-3 space-y-2">
                              {proof.caption && (
                                <p className="text-[11px] font-medium text-slate-300 line-clamp-2">
                                  "{proof.caption}"
                                </p>
                              )}
                              <p className="text-[9px] font-bold text-slate-500 truncate">
                                {proof.timestamp}
                              </p>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => setImage(proof.url)}
                                    className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                                  >
                                    Definir como Capa
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocumentaryProofs((prev) => {
                                      const remaining = prev.filter((p) => p.id !== proof.id);
                                      if (image === proof.url) {
                                        setImage(remaining.length > 0 ? remaining[0].url : '');
                                      }
                                      return remaining;
                                    });
                                  }}
                                  className="text-[10px] font-bold text-red-400 hover:text-red-300 ml-auto flex items-center gap-1"
                                >
                                  <Trash2 size={11} /> Excluir
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">
                      Nenhuma foto de prova documental anexada ainda.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Clique em <strong>"Tirar Foto com a Câmera"</strong> para fotografar sua chegada, o odômetro ou sua moto no mirante com carimbo oficial.
                    </p>
                  </div>
                )}
              </div>

              {/* Grid: Foto de Capa Adicional & Relato do Piloto */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">FOTO DE CAPA PRINCIPAL DO CARD</label>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() => !isUploadingPhoto && tripPhotoInputRef.current?.click()}
                      className={cn(
                        "w-full aspect-[2/1] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
                        image 
                          ? "border-slate-800 bg-slate-950 shadow-lg" 
                          : "border-dashed border-slate-800/80 bg-slate-900/20 hover:border-orange-500/50 hover:bg-slate-900/40"
                      )}
                    >
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={32} className="text-orange-500 animate-spin" />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Enviando foto da viagem...</span>
                        </div>
                      ) : image ? (
                        <>
                          <img src={image} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                              <Camera size={16} className="text-orange-500" />
                              Trocar Foto de Capa
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center p-4">
                          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                            <Camera size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                              Capa do Roteiro (ou selecione das provas acima)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <input 
                      type="text" 
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Ou cole uma URL externa se preferir..." 
                      className="w-full bg-slate-950/30 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">O RELATO DO PILOTO</label>
                    <button 
                      type="button"
                      onClick={handleGenerateAiStory}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-full text-[8px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all group cursor-pointer"
                    >
                      <Sparkles size={10} className="group-hover:rotate-12 transition-transform" />
                      IA: GERAR RELATO
                    </button>
                  </div>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Conte os detalhes da aventura, os obstáculos e a emoção de cada curva..."
                    className="w-full min-h-[160px] sm:min-h-[200px] bg-slate-950/30 border border-slate-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 text-sm font-medium text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/50 resize-y leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-bold animate-in fade-in">
                <X size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-4 sm:gap-8 pt-6 sm:pt-10 border-t border-slate-800">
               <button 
                 type="button"
                 onClick={() => {
                   setIsFormOpen(false);
                   setEditingLogId(null);
                   setFormError(null);
                 }}
                 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors py-2 text-center cursor-pointer"
                >
                 {editingLogId ? 'CANCELAR EDIÇÃO' : 'DESCARTAR'}
               </button>
               <button 
                 type="button"
                 onClick={handleFinish}
                 disabled={isSaving}
                 className={cn(
                   "w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl group transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
                   editingLogId 
                     ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20" 
                     : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
                 )}
               >
                 {isSaving ? (
                   <>
                     <Loader2 size={18} className="text-white animate-spin" />
                     <span className="text-[11px] font-black text-white uppercase tracking-widest">
                       {editingLogId ? 'SALVANDO...' : 'REGISTRANDO...'}
                     </span>
                   </>
                 ) : editingLogId ? (
                   <>
                     <Check size={18} className="text-white group-hover:scale-110 transition-transform" />
                     <span className="text-[11px] font-black text-white uppercase tracking-widest">SALVAR ALTERAÇÕES</span>
                   </>
                 ) : (
                   <>
                     <Send size={18} className="text-white group-hover:translate-x-1 transition-transform" />
                     <span className="text-[11px] font-black text-white uppercase tracking-widest">FINALIZAR REGISTRO</span>
                   </>
                 )}
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-12 bg-slate-950 min-h-screen">
      {savingIndicatorOverlay}
      {floatingSuccessToast}
      {/* Header Section */}
      <header className="border-b border-slate-800/60 pb-6 sm:pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
           <button
             onClick={() => navigate('/profile')}
             className="mb-3 inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group"
           >
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
             <span>Voltar ao Perfil do Piloto</span>
           </button>
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
             DIÁRIO DE <span className="text-orange-500">BORDO</span>
           </h1>
           <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             ONDE CADA KM RODADO VIRA UMA LENDA IMORTAL
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Plan Quota Badge */}
          {!isProOrBonificado ? (
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center gap-2">
              <span className="text-slate-400">Modo Gratuito:</span>
              <span className={cn(
                "font-bold",
                thisMonthLogsCount >= 5 ? "text-rose-400 font-black" : "text-emerald-400"
              )}>
                {thisMonthLogsCount}/5 viagens este mês
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-2">
              <Sparkles size={13} className="text-amber-400" />
              <span className="font-bold">
                Viagens Ilimitadas ({profile?.plan_type === 'bonificado' ? '🎁 Modo Bonificado' : '🔥 Pro VIP'})
              </span>
            </div>
          )}

          <button 
            type="button"
            onClick={() => handleOpenReportModal()}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/70 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg group shrink-0 active:scale-95"
            title="Exportar diário de bordo com roteiros e etapas concluídas em formato PDF para impressão ou arquivo"
          >
            <FileDown size={17} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <span>EXPORTAR DIÁRIO</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-600/20 text-orange-400 font-bold border border-orange-500/30 font-mono">
              PDF
            </span>
          </button>

          <button 
            onClick={handleOpenForm}
            className="w-full sm:w-auto btn-primary"
          >
            <Plus size={16} />
            <span>NOVO REGISTRO</span>
          </button>
        </div>
      </header>

      {/* Toast de Confirmação de Gravação / Edição */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-400 text-xs font-bold shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}

      {/* Sub-navigation Tabs: Diário de Bordo vs Checklist Pré-Viagem vs Exportação de Relatórios */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('trips')}
            className={cn(
              "flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'trips'
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <BookOpen size={15} />
            <span>Histórico de Viagens</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full font-mono">
              {isDateFilterActive ? `${filteredLogs.length}/${logs.length}` : logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              "flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'checklist'
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <ClipboardCheck size={15} />
            <span>Checklist Pré-Viagem</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Essencial</span>
          </button>
        </div>

        {/* Action: Exportar Diário */}
        <button
          onClick={() => handleOpenReportModal()}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md group shrink-0 w-full sm:w-auto"
          title="Exportar roteiros e etapas concluídas em formato PDF para impressão ou arquivo"
        >
          <FileDown size={15} className="text-orange-500 group-hover:scale-110 transition-transform" />
          <span>Exportar Diário</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold">
            PDF & Impressão
          </span>
        </button>
      </div>

      {activeTab === 'checklist' ? (
        <TripChecklist 
          onClose={() => setActiveTab('trips')}
          onTripStartReady={() => {
            setActiveTab('trips');
            handleOpenForm();
          }}
        />
      ) : (
        <>
          {/* Painel de Filtros de Período de Data e Métricas */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-500 shrink-0">
                  <Filter size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                    Filtros de Data & Período
                    {isDateFilterActive && (
                      <span className="text-[9px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full not-italic">
                        Filtro Ativo
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Defina a data de início e fim para analisar métricas, gráficos e viagens por períodos específicos.
                  </p>
                </div>
              </div>

              {/* Ações Rápidas: Alternar Gráficos e Limpar Filtros */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                {isDateFilterActive && (
                  <button
                    type="button"
                    onClick={handleClearDateFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold uppercase transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-95"
                    title="Limpar todos os filtros de data e ver histórico completo"
                  >
                    <RotateCcw size={12} className="text-orange-400" />
                    <span>Limpar Filtros</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMetricsPanel(!showMetricsPanel)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                    showMetricsPanel
                      ? "bg-orange-600/20 border-orange-500/40 text-orange-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  )}
                  title={showMetricsPanel ? "Ocultar painel gráfico de telemetria" : "Exibir gráficos Recharts de KM e tempo"}
                >
                  <TrendingUp size={13} />
                  <span>{showMetricsPanel ? "Ocultar Gráficos" : "Ver Gráficos"}</span>
                </button>
              </div>
            </div>

            {/* Inputs de Data (Início e Fim) + Presets de Períodos Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
              {/* Data Início */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-orange-500" />
                  Data de Início:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setQuickDatePreset('custom');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none transition-colors"
                  />
                  {startDateFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDateFilter('');
                        setQuickDatePreset('custom');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                      title="Limpar data inicial"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Data Fim */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-orange-500" />
                  Data de Fim:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setQuickDatePreset('custom');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none transition-colors"
                  />
                  {endDateFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setEndDateFilter('');
                        setQuickDatePreset('custom');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                      title="Limpar data final"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Períodos Rápidos (Presets) */}
              <div className="sm:col-span-2 lg:col-span-6 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Compass size={12} className="text-cyan-400" />
                  Atalhos de Período:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('all')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border",
                      !isDateFilterActive && quickDatePreset === 'all'
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    Todo o Histórico ({logs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('last30')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border",
                      quickDatePreset === 'last30'
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    Últimos 30 Dias
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('last90')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border",
                      quickDatePreset === 'last90'
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    Últimos 90 Dias
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('thisMonth')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border",
                      quickDatePreset === 'thisMonth'
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    Este Mês
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('season2026')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border",
                      quickDatePreset === 'season2026'
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    Temporada 2026
                  </button>
                </div>
              </div>
            </div>

            {/* Filtro por Categoria */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag size={12} className="text-orange-400" />
                  Filtrar por Categoria:
                </label>
                {selectedCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className="text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X size={11} /> Limpar filtro de categoria
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Todas as Categorias', icon: Filter },
                  { id: 'Viagem', label: 'Viagem', icon: Compass },
                  { id: 'Passeio', label: 'Passeio', icon: Bike },
                  { id: 'Encontro', label: 'Encontro', icon: Users },
                  { id: 'Manutenção', label: 'Manutenção', icon: Wrench },
                  { id: 'Outro', label: 'Outro', icon: Tag },
                ].map((catOpt) => {
                  const isSelected = selectedCategoryFilter === catOpt.id;
                  const count = catOpt.id === 'all' 
                    ? logs.length 
                    : logs.filter(l => (l.category || 'Viagem').toLowerCase() === catOpt.id.toLowerCase()).length;
                  const Icon = catOpt.icon;
                  return (
                    <button
                      key={catOpt.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(catOpt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5",
                        isSelected
                          ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20 font-black"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                      )}
                    >
                      <Icon size={12} />
                      <span>{catOpt.label}</span>
                      <span className="text-[9px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo Dinâmico do Período */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isDateFilterActive || selectedCategoryFilter !== 'all' ? "bg-orange-500 animate-pulse" : "bg-emerald-500"
                )} />
                <span className="text-[11px] font-mono">
                  {isDateFilterActive || selectedCategoryFilter !== 'all' ? (
                    <>
                      {selectedCategoryFilter !== 'all' && (
                        <span className="text-orange-400 font-bold mr-1.5 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                          {selectedCategoryFilter}
                        </span>
                      )}
                      Período: <strong className="text-white">{formattedPeriodLabel}</strong> • Exibindo <strong className="text-orange-400 font-bold">{filteredLogs.length}</strong> de {logs.length} registros
                    </>
                  ) : (
                    <>
                      Exibindo <strong className="text-white">todos os {logs.length} registros</strong> do diário de bordo
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>Distância: <strong className="text-amber-400">{filteredKmCalculated} KM</strong></span>
                <span>•</span>
                <span>Tempo: <strong className="text-cyan-400">{filteredDurationFormatted}</strong></span>
              </div>
            </div>
          </div>

          {/* Gráfico Recharts de Telemetria com Métricas do Período Selecionado */}
          {showMetricsPanel && (
            <div className="w-full">
              <RouteMetricsPanel
                logs={filteredLogs}
                onNewTripClick={handleOpenForm}
                badgeText="TELEMETRIA DO DIÁRIO"
                periodLabel={isDateFilterActive ? formattedPeriodLabel : undefined}
                title={
                  <>
                    PAINEL DE <span className="text-orange-500">QUILOMETRAGEM & TEMPO</span> {isDateFilterActive ? "NO PERÍODO" : "ACUMULADO"}
                  </>
                }
                subtitle={
                  isDateFilterActive
                    ? `Telemetria e gráficos consolidados para o período filtrado (${formattedPeriodLabel}).`
                    : "Monitoramento gráfico do total de quilômetros rodados e horas acumuladas nas rotas do piloto."
                }
              />
            </div>
          )}

          {logs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full aspect-[21/9] min-h-[350px] sm:min-h-[500px] border-2 border-dashed border-slate-800/40 rounded-3xl sm:rounded-[3rem] flex flex-col items-center justify-center bg-slate-900/5 overflow-hidden p-6"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,0,0.03)_0%,transparent_70%)]" />
              
              <div className="relative flex flex-col items-center text-center px-4 max-w-2xl">
                <div 
                  onClick={handleOpenForm}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-white mb-6 sm:mb-10 shadow-2xl group cursor-pointer hover:border-orange-500/50 transition-all"
                >
                  <Send size={24} className="sm:w-8 sm:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter mb-4 sm:mb-6">
                  O ASFALTO ESTÁ CHAMANDO
                </h2>
                
                <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.25em] leading-relaxed">
                  SUA LENDA AINDA NÃO FOI ESCRITA. CLIQUE NO BOTÃO DE NOVO <br className="hidden md:block" />
                  REGISTRO PARA COMEÇAR SUA HISTÓRIA.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-8 sm:mt-12">
                  <button 
                    onClick={handleOpenForm}
                    className="flex items-center gap-2 text-[10px] font-black text-white bg-orange-600 hover:bg-orange-500 px-4 py-2.5 rounded-xl uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <Map size={14} />
                    Criar meu primeiro registro
                  </button>
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <ClipboardCheck size={14} />
                    Ver Checklist Pré-Viagem
                  </button>
                </div>
              </div>
            </motion.div>
          ) : filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-dashed border-slate-800/80 rounded-2xl sm:rounded-3xl p-8 sm:p-14 text-center bg-slate-900/20 space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 text-orange-500 flex items-center justify-center mx-auto shadow-xl">
                <Filter size={26} className="text-orange-500" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight">
                  Nenhum roteiro encontrado neste período
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  Não encontramos viagens registradas no período de <strong className="text-white">{formattedPeriodLabel}</strong>. Você possui <strong className="text-orange-400 font-bold">{logs.length}</strong> {logs.length === 1 ? 'roteiro' : 'roteiros'} em outras datas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClearDateFilters}
                  className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-orange-600/30 active:scale-95"
                >
                  <RotateCcw size={14} />
                  Ver Todos os {logs.length} Roteiros
                </button>
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Plus size={14} />
                  Cadastrar Roteiro Neste Período
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {filteredLogs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={log.id}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden group hover:border-orange-500/20 transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Image Side */}
                    <div className="lg:col-span-4 aspect-video lg:aspect-auto relative overflow-hidden">
                       <img src={log.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={log.title} />
                       <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent lg:hidden" />
                    </div>
                    
                    {/* Content Side */}
                    <div className="lg:col-span-8 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6 lg:space-y-8">
                       <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">{log.date}</p>
                                {(() => {
                                  const cat = log.category || 'Viagem';
                                  const catCfg = LOGBOOK_CATEGORIES.find(c => c.id.toLowerCase() === cat.toLowerCase()) || LOGBOOK_CATEGORIES[0];
                                  const CatIcon = catCfg.icon;
                                  return (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                      catCfg.badgeBg,
                                      catCfg.badgeBorder,
                                      catCfg.badgeText
                                    )}>
                                      <CatIcon size={10} />
                                      {cat}
                                    </span>
                                  );
                                })()}
                              </div>
                              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">{log.title}</h3>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={14} className={cn("fill-current", idx < log.rating ? "text-orange-500" : "text-slate-800")} />
                              ))}
                            </div>
                          </div>

                          {/* Resumo de Telemetria e Condições da Viagem Cadastradas no Diário */}
                          {(() => {
                            const pKey = parseLogPeriod(log);
                            const pCfg = TRIP_PERIOD_CONFIG[pKey] || TRIP_PERIOD_CONFIG.day;
                            const PIcon = pCfg.icon;
                            const cList = parseLogClimates(log);

                            return (
                              <div className="py-3 sm:py-4 px-3 sm:px-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                                {/* Linha 1: ORIGEM ➔ DESTINO em linha individual para que apareça toda a informação */}
                                <div className="w-full">
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <MapPin size={11} className="text-orange-500 shrink-0" />
                                    <span>ORIGEM ➔ DESTINO</span>
                                  </p>
                                  <p className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight flex flex-wrap items-center gap-2" title={`${log.origin} ➔ ${log.destination}`}>
                                    <span className="text-slate-100">{log.origin || 'Origem não informada'}</span>
                                    <span className="text-orange-500 font-black">➔</span>
                                    <span className="text-slate-100">{log.destination || 'Destino não informado'}</span>
                                  </p>
                                </div>

                                {/* Linha 2: DISTÂNCIA TOTAL, TEMPO ESTIMADO, ESTADO DA ESTRADA numa linha abaixo de ORIGEM DESTINO */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2.5 border-t border-slate-800/50">
                                  <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">DISTÂNCIA TOTAL</p>
                                    <p className="text-xs sm:text-sm font-black text-white uppercase italic font-mono">{log.distance} KM</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">TEMPO ESTIMADO</p>
                                    <p className="text-xs sm:text-sm font-black text-white uppercase italic">{log.duration}</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">ESTADO DA ESTRADA</p>
                                    <p className="text-xs sm:text-sm font-black text-orange-400 uppercase italic truncate" title={log.road}>
                                      {log.road}
                                    </p>
                                  </div>
                                </div>

                                {/* Linha 3: Condições mantidas na parte de cima do card */}
                                <div className="pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                      CONDIÇÕES:
                                    </span>

                                    {/* Badge Período */}
                                    <span 
                                      className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
                                        pCfg.bg, pCfg.border, pCfg.color
                                      )}
                                      title={`Turno do Roteiro: ${pCfg.label} (${pCfg.subLabel})`}
                                    >
                                      <PIcon size={12} />
                                      <span>{pCfg.label}</span>
                                    </span>

                                    {/* Badges de Clima(s) Múltiplo(s) */}
                                    {cList.map(cId => {
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
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
                                            bg, border, color
                                          )}
                                          title={`Condição climática: ${label}`}
                                        >
                                          <CIcon size={12} />
                                          <span>{label}</span>
                                        </span>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                                    <span className="text-slate-500 uppercase text-[8px] tracking-wider">AVALIAÇÃO:</span>
                                    <span className="font-mono text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-bold">
                                      {log.rating || 5}.0 ★
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          <p className="text-xs sm:text-sm font-medium text-slate-400 leading-relaxed italic">
                            "{log.content}"
                          </p>

                          {/* Se houver etapas cadastradas, exibe a timeline de paradas */}
                          {log.stages && log.stages.length > 0 && (
                            <div className="pt-3 pb-1 border-t border-slate-800/50 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                  <Navigation size={13} className="text-orange-500" />
                                  Etapas & Paradas do Roteiro ({log.stages.length})
                                </span>
                                <a
                                  href={log.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(log.origin)}&destination=${encodeURIComponent(log.destination)}&waypoints=${log.stages.map(s => encodeURIComponent(s.name)).join('|')}&travelmode=driving`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-lg border border-sky-500/30"
                                >
                                  <ExternalLink size={11} />
                                  <span>Abrir no Google Maps</span>
                                </a>
                              </div>

                              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                                <span className="text-[10px] font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 shrink-0">
                                  🏁 {log.origin.split('/')[0]}
                                </span>
                                {log.stages.map((st, sidx) => {
                                  const conf = STAGE_TYPE_CONFIG[st.type] || STAGE_TYPE_CONFIG.scenic;
                                  const Icon = conf.icon;
                                  return (
                                    <div key={st.id || sidx} className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-orange-500 font-bold text-xs">➔</span>
                                      <span 
                                        title={st.notes ? `${st.name} (${st.notes})` : st.name}
                                        className={cn(
                                          "text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all shadow-sm",
                                          conf.bg, conf.color, conf.border
                                        )}
                                      >
                                        <Icon size={12} />
                                        <span>{st.name}</span>
                                      </span>
                                    </div>
                                  );
                                })}
                                <span className="text-orange-500 font-bold text-xs shrink-0">➔</span>
                                <span className="text-[10px] font-bold text-slate-300 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 shrink-0">
                                  🚩 {log.destination.split('/')[0]}
                                </span>
                              </div>
                            </div>
                          )}
                       </div>

                       <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sm:pt-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                               <Bike size={16} />
                             </div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{log.bike}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Botão Editar Lançamento */}
                            <button
                              type="button"
                              onClick={() => handleEditLog(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 group/edit"
                              title="Editar informações, etapas, notas ou fotos desta viagem"
                            >
                              <Pencil size={12} className="group-hover/edit:rotate-12 transition-transform" />
                              <span>Editar</span>
                            </button>

                            {/* Botão Excluir Lançamento */}
                            <button
                              type="button"
                              onClick={() => setLogToDelete(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 group/del"
                              title="Excluir este lançamento do seu diário de bordo"
                            >
                              <Trash2 size={12} className="group-hover/del:scale-110 transition-transform" />
                              <span>Excluir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCameraTripTarget({
                                  id: log.id,
                                  title: log.title,
                                  destination: log.destination
                                });
                                setIsCameraModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Tirar nova foto com a câmera para anexar como prova documental a esta viagem"
                            >
                              <Camera size={13} />
                              <span>+ Prova Fotográfica</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReportModal(log)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-orange-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Exportar este roteiro e suas etapas concluídas em formato PDF ou impressão"
                            >
                              <FileDown size={13} className="text-orange-500" />
                              <span>Exportar Roteiro</span>
                            </button>

                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Provas Documentais Fotográficas Anexadas */}
                  {((log.documentaryProofs && log.documentaryProofs.length > 0) || (log.photos && log.photos.length > 1)) && (
                    <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          Provas Fotográficas Certificadas ({log.documentaryProofs?.length || log.photos?.length || 0})
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 lowercase italic hidden sm:inline">
                          clique na foto para visualizar carimbo oficial e telemetria
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                        {log.documentaryProofs && log.documentaryProofs.length > 0 ? (
                          log.documentaryProofs.map((proof) => {
                            const tInfo = PROOF_TYPES.find(t => t.id === proof.type) || { icon: '📸', label: 'Prova' };
                            return (
                              <div
                                key={proof.id}
                                onClick={() => {
                                  setLightboxProof(proof);
                                  setLightboxTripTitle(log.title);
                                }}
                                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 hover:border-orange-500 cursor-pointer shrink-0 group/proof transition-all shadow-md bg-black"
                                title={`${tInfo.label} - ${proof.caption || 'Clique para ampliar'}`}
                              >
                                <img src={proof.url} alt={tInfo.label} className="w-full h-full object-cover group-hover/proof:scale-110 transition-transform duration-300" />
                                <div className="absolute top-1 left-1 bg-slate-950/80 border border-slate-700/80 rounded px-1.5 py-0.5 text-[8px] font-black text-white flex items-center gap-1 backdrop-blur-xs">
                                  <span>{tInfo.icon}</span>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[7px] font-bold text-slate-300 px-1 py-0.5 truncate text-center backdrop-blur-xs">
                                  {tInfo.label}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          log.photos?.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => {
                                setLightboxProof({
                                  id: `proof_legacy_${pIdx}`,
                                  url: photoUrl,
                                  type: 'general',
                                  caption: `Registro fotográfico #${pIdx + 1} da viagem`,
                                  timestamp: log.date
                                });
                                setLightboxTripTitle(log.title);
                              }}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 hover:border-orange-500 cursor-pointer shrink-0 group/proof transition-all shadow-md bg-black"
                            >
                              <img src={photoUrl} alt="Foto" className="w-full h-full object-cover group-hover/proof:scale-110 transition-transform duration-300" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Stats Overlay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { 
                label: isDateFilterActive ? 'Roteiros no Período' : 'Total de Registros', 
                value: filteredLogs.length.toString().padStart(2, '0'),
                helper: isDateFilterActive ? `de ${logs.length} no histórico` : 'todas as viagens'
              },
              { 
                label: isDateFilterActive ? 'Km Rodados no Período' : 'Km Rodados Acumulados', 
                value: `${filteredKmCalculated} KM`,
                helper: isDateFilterActive ? `${totalKmCalculated} KM histórico total` : 'odômetro acumulado'
              },
              { 
                label: isDateFilterActive ? 'Tempo no Período' : 'Tempo Acumulado', 
                value: filteredDurationFormatted,
                helper: 'tempo total de pilotagem'
              },
              { 
                label: 'Fotos & Provas', 
                value: filteredPhotosCount.toString().padStart(2, '0'),
                helper: 'registros documentais'
              },
            ].map((stat, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-900/40 border border-slate-800/60 text-center flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-orange-500 tracking-tighter italic">{stat.value}</p>
                </div>
                <p className="text-[10px] font-mono text-slate-600 mt-2">{stat.helper}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature={upgradeFeature} 
      />

      <TripReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedTripToExport(null);
        }}
        logs={filteredLogs}
        pilotName={profile?.name || user?.user_metadata?.full_name || 'Piloto MotoLegado'}
        pilotClub={profile?.club_name || 'Piloto Independente'}
        pilotMotorcycle={profile?.motorcycle || 'Motocicleta Cadastrada'}
        pilotId={profile?.id || user?.id}
        initialSelectedTripId={selectedTripToExport?.id}
      />

      {/* Modal da Câmera de Prova Documental */}
      <DocumentaryCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setCameraTripTarget(null);
        }}
        onAttachProofs={handleAttachProofs}
        routeTitle={cameraTripTarget?.title || title || 'Roteiro'}
        destination={cameraTripTarget?.destination || destination || ''}
        pilotName={profile?.name || user?.user_metadata?.full_name || 'Piloto MotoLegado'}
        pilotMotorcycle={bike || profile?.motorcycle || 'Motocicleta'}
      />

      {/* Modal Lightbox para Ampliar Provas e Visualizar Carimbo */}
      <ProofLightboxModal
        isOpen={Boolean(lightboxProof)}
        onClose={() => setLightboxProof(null)}
        proof={lightboxProof}
        tripTitle={lightboxTripTitle}
      />

      {/* Modal de Confirmação de Exclusão de Lançamento */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-slate-950 border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden"
          >
            {/* Top accent glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">
                  Excluir Lançamento
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tem certeza que deseja excluir esta viagem do seu diário de bordo? Esta ação é irreversível e removerá este registro do seu diário e dos gráficos de telemetria.
                </p>
              </div>
            </div>

            {/* Preview do Card a ser excluído */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-orange-400 font-bold">{logToDelete.date}</span>
                <span className="text-slate-400">{logToDelete.distance} KM • {logToDelete.duration}</span>
              </div>
              <p className="text-sm font-black text-white uppercase italic truncate">
                {logToDelete.title}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {logToDelete.origin.split('/')[0]} ➔ {logToDelete.destination.split('/')[0]}
              </p>
              {((logToDelete.documentaryProofs && logToDelete.documentaryProofs.length > 0) || (logToDelete.photos && logToDelete.photos.length > 0)) && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Camera size={12} className="text-orange-400" />
                  <span>
                    {(logToDelete.documentaryProofs?.length || 0) + (logToDelete.photos?.length || 0)} fotos / provas anexadas
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLog(logToDelete.id)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95"
              >
                <Trash2 size={14} />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

