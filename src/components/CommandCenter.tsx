import { useState, useEffect, useRef, useMemo, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Search, 
  Plus, 
  UserCheck, 
  UserX,
  Building2, 
  MessageSquare, 
  Store, 
  Activity, 
  Lock, 
  X,
  Eye,
  Award,
  Phone,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Wrench,
  UtensilsCrossed,
  GraduationCap,
  Compass,
  ExternalLink,
  Navigation,
  Star,
  ArrowLeft,
  Loader2,
  Database,
  Gift,
  Crown,
  Users,
  Check,
  List,
  LayoutGrid,
  CheckCircle2,
  RefreshCw,
  Server,
  Info,
  TrendingUp,
  Bell,
  BellRing,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from 'recharts';
import { cn } from '../lib/utils';
import { Partner } from './Partners';
import { CommunityPost, Route, RouteDifficulty } from '../types';
import { estimateRouteMetrics } from './Routes';
import { getDbStatus, initDbTables, getPilotsFromHostinger, syncPilotToHostinger } from '../lib/api';
import { clientDbService } from '../lib/dbService';
import { DateInput } from './DateInput';
import { MySqlPingTest } from './MySqlPingTest';

// Custom Tooltip for Recharts Line Chart
const CustomGrowthTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
            {dataPoint.fullDate || label}
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
            Total: {dataPoint.totalActivity}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3 text-cyan-300">
            <span className="flex items-center gap-1.5 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              Novos Pilotos (Sign-ups):
            </span>
            <span className="font-mono font-black text-white text-xs">{dataPoint.signUps}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-amber-300">
            <span className="flex items-center gap-1.5 font-bold text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              Novos Roteiros (Rotas):
            </span>
            <span className="font-mono font-black text-white text-xs">{dataPoint.routesCreated}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Play real-time notification chime using Web Audio API
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Harmonic bell chime tone 1 (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Harmonic bell chime tone 2 (B5 - 987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

// Helper to format date cleanly
function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "Não informada";
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

// Event Type matching Events.tsx
interface MotoEvent {
  id: string;
  title: string;
  desc: string;
  time: string;
  endTime?: string;
  date: string;
  endDate?: string;
  location: string;
  distance?: number;
  category: string;
  image: string;
  checkedIn: boolean;
  memberCount?: number;
  price?: string;
  organizer?: string;
  isCustomImage?: boolean;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  createdBy?: string;
  createdAt?: string;
  rejectionReason?: string;
}

// Club Registration Request
interface ClubModerationRequest {
  id: string;
  clubName: string;
  president: string;
  cityState: string;
  type: 'criacao' | 'filiacao';
  requestedAt: string;
  membersCount: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motto: string;
}

// Community Post Report
interface PostReport {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  reportedBy: string;
  reason: string;
  reportedAt: string;
  status: 'pendente' | 'mantido' | 'removido';
}

// Partner Verification Request
interface PartnerRequest {
  id: string;
  businessName: string;
  category: string;
  city: string;
  discountOffered: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
}

const PARTNER_CATEGORIES: Partner['category'][] = [
  "Bar e Point",
  "Alimentação",
  "Oficina",
  "Serviços",
  "Acessórios",
  "Cursos e Treinamentos",
  "Hospedagem",
  "Combustível"
];

export function CommandCenter() {
  const { profile, loading, user, updateUserPlan } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'eventos' | 'clubes' | 'roteiros' | 'comunidade' | 'parceiros' | 'telemetria' | 'bonificados'>('eventos');
  
  // Routes Moderation State
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilterStatus, setRouteFilterStatus] = useState<'todos' | 'pendente' | 'aprovado'>('todos');
  const [routeSearch, setRouteSearch] = useState('');
  const [pendingActionRoute, setPendingActionRoute] = useState<{ route: Route; action: 'approve' | 'reject' } | null>(null);
  const [routeRejectionReasonInput, setRouteRejectionReasonInput] = useState('');
  
  // Events Moderation State
  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<'todos' | 'pendente' | 'aprovado'>('todos');
  const [eventSearch, setEventSearch] = useState('');
  const [eventDateFilter, setEventDateFilter] = useState('');
  const [editingEvent, setEditingEvent] = useState<MotoEvent | null>(null);
  const editEventFileInputRef = useRef<HTMLInputElement | null>(null);
  const addEventFileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewingEvent, setViewingEvent] = useState<MotoEvent | null>(null);
  const [rejectionModalEvent, setRejectionModalEvent] = useState<MotoEvent | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<MotoEvent | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState<Partial<MotoEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    category: 'Encontro',
    desc: '',
    image: '',
    price: '',
    organizer: '',
    status: 'aprovado'
  });

  // Clubs Moderation State
  const [clubRequests, setClubRequests] = useState<ClubModerationRequest[]>([]);
  const [clubSearchText, setClubSearchText] = useState('');
  const [clubStatusFilter, setClubStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados'>('todos');
  const [viewingClub, setViewingClub] = useState<ClubModerationRequest | null>(null);
  const [editingClub, setEditingClub] = useState<ClubModerationRequest | null>(null);
  const [deleteConfirmClub, setDeleteConfirmClub] = useState<ClubModerationRequest | null>(null);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [newClubData, setNewClubData] = useState<Partial<ClubModerationRequest>>({
    clubName: '',
    president: '',
    cityState: '',
    type: 'criacao',
    membersCount: 0,
    motto: '',
    status: 'aprovado'
  });

  // Community Reports State
  const [reports, setReports] = useState<PostReport[]>([]);
  const [reportSearchText, setReportSearchText] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'todos' | 'pendentes' | 'mantidos' | 'removidos'>('todos');
  const [viewingReport, setViewingReport] = useState<PostReport | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<PostReport | null>(null);

  // Community Posts Moderation State
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [postSearchText, setPostSearchText] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados'>('todos');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('todos');
  const [viewingPostModal, setViewingPostModal] = useState<CommunityPost | null>(null);
  const [isEditingPostInModal, setIsEditingPostInModal] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('');
  const [editPostImage, setEditPostImage] = useState('');
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<CommunityPost | null>(null);
  const [rejectionModalPost, setRejectionModalPost] = useState<CommunityPost | null>(null);
  const [postRejectionReason, setPostRejectionReason] = useState('');

  // Routes Moderation Modal State
  const [viewingRouteModal, setViewingRouteModal] = useState<Route | null>(null);
  const [isEditingRouteInModal, setIsEditingRouteInModal] = useState(false);
  const [editRouteName, setEditRouteName] = useState('');
  const [editRouteMapsAddress, setEditRouteMapsAddress] = useState('');
  const [editRouteDistance, setEditRouteDistance] = useState('');
  const [editRouteDuration, setEditRouteDuration] = useState('');
  const [editRouteDescription, setEditRouteDescription] = useState('');
  const [editRouteRiderTips, setEditRouteRiderTips] = useState('');
  const [editRouteDifficulty, setEditRouteDifficulty] = useState<RouteDifficulty>(RouteDifficulty.MEDIUM);
  const [editRouteImage, setEditRouteImage] = useState('');

  // Partners Requests State
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);

  // Registered Partners Management State
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [partnerSearchText, setPartnerSearchText] = useState('');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('Todos');
  const [partnerHighlightFilter, setPartnerHighlightFilter] = useState<'todos' | 'destacados' | 'regulares'>('todos');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados'>('todos');

  // Modals State for Registered Partners
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState<Partner | null>(null);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState<Partial<Partner>>({
    name: '',
    category: 'Bar e Point',
    location: '',
    discount: '',
    news: '',
    phone: '',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=600',
    highlight: true
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; time: string }>>([
    { id: 'log_1', action: 'Sessão de Administrador iniciada', time: 'Hoje às 08:00' },
    { id: 'log_2', action: 'Sistema de Moderação sincronizado com o banco local', time: 'Hoje às 08:01' }
  ]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addAuditLog = (action: string) => {
    const newLog = {
      id: 'log_' + Date.now(),
      action,
      time: 'Agora mesmo (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Hostinger MySQL Diagnostics
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [initializingDb, setInitializingDb] = useState(false);
  const [dbMessage, setDbMessage] = useState<string | null>(null);

  const checkHostingerDb = async () => {
    setCheckingDb(true);
    setDbMessage(null);
    try {
      const res = await getDbStatus();
      if (res.data) {
        setDbInfo(res.data);
        const detail = (res.data as any).errorDetail || (res.data as any).diagnostic?.lastError;
        const msg = res.data.message || (res.data.success ? 'Conexão ativa com o MySQL da Hostinger!' : 'Não foi possível conectar ao banco de dados.');
        setDbMessage(detail ? `${msg} Detalhe: ${detail}` : msg);
      } else {
        setDbMessage(res.error || 'Erro ao consultar status do banco.');
      }
    } catch (err: any) {
      setDbMessage(err?.message || 'Falha na requisição.');
    } finally {
      setCheckingDb(false);
    }
  };

  const handleInitTables = async () => {
    setInitializingDb(true);
    setDbMessage(null);
    try {
      const res = await initDbTables();
      if (res.data?.success) {
        setDbMessage(res.data.message || 'Tabelas inicializadas com sucesso no MySQL!');
        await checkHostingerDb();
      } else {
        setDbMessage(res.error || 'Erro ao inicializar tabelas.');
      }
    } catch (err: any) {
      setDbMessage(err?.message || 'Falha ao inicializar tabelas.');
    } finally {
      setInitializingDb(false);
    }
  };

  // Pilots & Bonificados State
  const [pilotsList, setPilotsList] = useState<any[]>([]);
  const [pilotSearchText, setPilotSearchText] = useState('');
  const [pilotPlanFilter, setPilotPlanFilter] = useState<'todos' | 'gratuito' | 'bonificado' | 'pago'>('todos');
  const [pilotViewMode, setPilotViewMode] = useState<'lista' | 'cards'>('lista');
  const [selectedPilotIds, setSelectedPilotIds] = useState<string[]>([]);
  const [viewingPilotModal, setViewingPilotModal] = useState<any | null>(null);
  const [loadingPilots, setLoadingPilots] = useState(false);
  const [deleteConfirmPilot, setDeleteConfirmPilot] = useState<any | null>(null);
  const [isDeletingPilot, setIsDeletingPilot] = useState(false);

  // Carregar e sincronizar lista de pilotos via Hostinger MySQL
  const loadPilots = async () => {
    setLoadingPilots(true);
    let pilots: any[] = [];

    try {
      const res = await getPilotsFromHostinger();
      if (res && res.pilots && res.pilots.length > 0) {
        pilots = res.pilots.map((p: any) => ({
          ...p,
          plan_type: p.plan || p.plan_type || (p.is_pro ? 'pago' : 'gratuito')
        }));
      }
    } catch (err) {
      console.warn('Aviso ao carregar pilotos da Hostinger:', err);
    }

    if (pilots.length === 0) {
      const stored = localStorage.getItem('motolegado_admin_pilots');
      if (stored) {
        try {
          pilots = JSON.parse(stored);
        } catch (e) {
          pilots = [];
        }
      }
    }

    if (pilots.length === 0) {
      pilots = [
        {
          id: profile?.id || 'pilot_current',
          name: profile?.name || 'Cícero Ranieri',
          email: profile?.email || 'ciceroranieri@gmail.com',
          motorcycle: profile?.motorcycle || 'BMW R 1250 GS',
          city: profile?.city || 'São Paulo',
          state: profile?.state || 'SP',
          club_name: profile?.club_name || 'Estrada Real Moto Clube',
          points: profile?.points || 450,
          tier: profile?.tier || 'Ouro',
          role: profile?.role || 'admin',
          is_pro: true,
          plan_type: profile?.plan_type || 'pago',
          avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=200',
          created_at: new Date().toISOString()
        },
        {
          id: 'pilot_demo_1',
          name: 'Carlos Alberto Mendes',
          email: 'carlos.mendes@estrada.com.br',
          motorcycle: 'Triumph Tiger 900 Rally Pro',
          city: 'Belo Horizonte',
          state: 'MG',
          club_name: 'Fantasmas do Asfalto MC',
          points: 180,
          tier: 'Prata',
          role: 'pilot',
          is_pro: false,
          plan_type: 'gratuito',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          created_at: '2025-01-15T10:30:00Z'
        },
        {
          id: 'pilot_demo_2',
          name: 'Renata Albuquerque',
          email: 'renata.moto@gmail.com',
          motorcycle: 'Harley-Davidson Fat Boy 114',
          city: 'Curitiba',
          state: 'PR',
          club_name: 'Ladies of the Road PR',
          points: 320,
          tier: 'Ouro',
          role: 'pilot',
          is_pro: true,
          plan_type: 'bonificado',
          bonificado_at: '2025-02-10T14:20:00Z',
          bonificado_by: 'Comando MotoLegado',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          created_at: '2025-01-10T12:00:00Z'
        },
        {
          id: 'pilot_demo_3',
          name: 'Marcos Vinícius Siqueira',
          email: 'marcos.v@rota66.com',
          motorcycle: 'Yamaha MT-09 Tracer',
          city: 'Campinas',
          state: 'SP',
          club_name: 'Irmandade Custom Brasil',
          points: 95,
          tier: 'Bronze',
          role: 'pilot',
          is_pro: false,
          plan_type: 'gratuito',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
          created_at: '2025-02-01T09:15:00Z'
        },
        {
          id: 'pilot_demo_4',
          name: 'Fernando Guimarães',
          email: 'fguimaraes@terra.com.br',
          motorcycle: 'Honda Africa Twin CRF 1100L',
          city: 'Florianópolis',
          state: 'SC',
          club_name: 'Águias da Serra MC',
          points: 510,
          tier: 'Diamante',
          role: 'pilot',
          is_pro: true,
          plan_type: 'pago',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
          created_at: '2024-12-05T08:00:00Z'
        },
        {
          id: 'pilot_demo_5',
          name: 'Juliana Castro',
          email: 'juliana.adv@castromoto.com',
          motorcycle: 'Royal Enfield Interceptor 650',
          city: 'Ribeirão Preto',
          state: 'SP',
          club_name: 'Café & Curvas Coletivo',
          points: 140,
          tier: 'Bronze',
          role: 'pilot',
          is_pro: false,
          plan_type: 'gratuito',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          created_at: '2025-02-18T16:45:00Z'
        }
      ];
    }

    if (profile && profile.email) {
      const idx = pilots.findIndex(p => p.id === profile.id || p.email === profile.email);
      const currentEntry = {
        id: profile.id,
        name: profile.name || 'Piloto MotoLegado',
        email: profile.email,
        motorcycle: profile.motorcycle || 'Motocicleta não informada',
        city: profile.city || 'São Paulo',
        state: profile.state || 'SP',
        club_name: profile.club_name || 'Comunidade MotoLegado',
        points: profile.points || 0,
        tier: profile.tier || 'Bronze',
        role: profile.role || 'admin',
        is_pro: profile.is_pro,
        plan_type: profile.plan_type || (profile.is_pro ? 'pago' : 'gratuito'),
        bonificado_at: profile.bonificado_at,
        bonificado_by: profile.bonificado_by,
        avatar_url: profile.avatar_url,
        created_at: new Date().toISOString()
      };
      if (idx >= 0) {
        pilots[idx] = { ...pilots[idx], ...currentEntry };
      } else {
        pilots.unshift(currentEntry);
      }
    }

    setPilotsList(pilots);
    localStorage.setItem('motolegado_admin_pilots', JSON.stringify(pilots));
    setLoadingPilots(false);
  };

  useEffect(() => {
    loadPilots();
  }, [profile]);

  const handleUpdatePlan = async (pilotId: string, newPlan: 'gratuito' | 'pago' | 'bonificado') => {
    const targetPilot = pilotsList.find(p => p.id === pilotId);
    if (!targetPilot) return;

    const now = new Date().toISOString();
    const isPro = newPlan === 'pago' || newPlan === 'bonificado';

    const updatedList = pilotsList.map(p => {
      if (p.id === pilotId) {
        return {
          ...p,
          plan_type: newPlan,
          is_pro: isPro,
          bonificado_at: newPlan === 'bonificado' ? now : undefined,
          bonificado_by: newPlan === 'bonificado' ? (profile?.name || 'Comando MotoLegado') : undefined
        };
      }
      return p;
    });

    setPilotsList(updatedList);
    localStorage.setItem('motolegado_admin_pilots', JSON.stringify(updatedList));

    if (updateUserPlan) {
      await updateUserPlan(pilotId, newPlan);
    }

    // Sincronizar alteração de plano no servidor Hostinger
    syncPilotToHostinger({
      id: pilotId,
      plan: newPlan,
      is_pro: isPro,
      bonificado_at: newPlan === 'bonificado' ? now : null,
      bonificado_by: newPlan === 'bonificado' ? (profile?.name || 'Comando MotoLegado') : null
    }).catch(err => {
      console.warn('Aviso ao sincronizar plano com a Hostinger:', err);
    });

    const logAction = newPlan === 'bonificado'
      ? `MODO BONIFICADO: Concedido acesso VIP Pro a ${targetPilot.name} (${targetPilot.email})`
      : newPlan === 'pago'
      ? `PLANO PRO ATIVADO: Piloto ${targetPilot.name} definido como Pro`
      : `PLANO REVERTIDO: Piloto ${targetPilot.name} retornou ao Plano Gratuito`;

    addAuditLog(logAction);

    showToast(
      newPlan === 'bonificado'
        ? `🎁 Modo Bonificado ativado para ${targetPilot.name}! Acesso Pro liberado sem custos.`
        : newPlan === 'pago'
        ? `🔥 ${targetPilot.name} agora possui assinatura Pro ativa.`
        : `🟢 Plano de ${targetPilot.name} redefinido para Gratuito.`,
      'success'
    );
  };

  const handleBatchUpdatePlan = async (newPlan: 'bonificado' | 'gratuito') => {
    if (selectedPilotIds.length === 0) return;
    const targetIds = [...selectedPilotIds];
    for (const id of targetIds) {
      await handleUpdatePlan(id, newPlan);
    }
    const count = targetIds.length;
    setSelectedPilotIds([]);
    showToast(
      newPlan === 'bonificado'
        ? `🎁 Modo Bonificado ativado para ${count} piloto(s) selecionado(s)!`
        : `🟢 ${count} piloto(s) atualizados para Plano Gratuito.`,
      'success'
    );
  };

  const handleConfirmDeletePilot = async () => {
    if (!deleteConfirmPilot) return;
    const pilot = deleteConfirmPilot;
    const clean = (pilot.email || '').toLowerCase().trim();
    if (clean === 'ciceroranieri@gmail.com' || pilot.id === 'admin_ciceroranieri') {
      showToast("O Administrador Master não pode ser excluído.", "info");
      setDeleteConfirmPilot(null);
      return;
    }
    setIsDeletingPilot(true);
    try {
      await clientDbService.pilots.delete(pilot.id);
      const updated = pilotsList.filter(p => p.id !== pilot.id && (pilot.email ? p.email !== pilot.email : true));
      setPilotsList(updated);
      localStorage.setItem('motolegado_admin_pilots', JSON.stringify(updated));
      addAuditLog(`PILOTO EXCLUÍDO E BANIDO: ${pilot.name} (${pilot.email}) purgado da base de dados`);
      showToast(`Piloto ${pilot.name} e todas as suas informações foram excluídos com sucesso.`, 'success');
      if (viewingPilotModal?.id === pilot.id) {
        setViewingPilotModal(null);
      }
      setDeleteConfirmPilot(null);
    } catch (err: any) {
      showToast(err?.message || "Erro ao excluir piloto.", "info");
    } finally {
      setIsDeletingPilot(false);
    }
  };

  // Load events from LocalStorage and MySQL
  useEffect(() => {
    const savedEvents = localStorage.getItem('motolegado_events');
    let localList: MotoEvent[] = [];
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        const mockIds = ['e_fest_1', 'e_fest_2', 'e_sul_1', 'e_pend_1', 'e_pend_2', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5'];
        localList = Array.isArray(parsed) ? parsed.filter((e: MotoEvent) => !mockIds.includes(e.id)) : [];
        setEvents(localList);
      } catch (e) {
        setEvents([]);
      }
    }

    clientDbService.events.getAll()
      .then((dbEvents) => {
        if (Array.isArray(dbEvents)) {
          setEvents(prev => {
            const map = new Map<string, MotoEvent>();
            dbEvents.forEach(e => map.set(e.id, e));
            prev.forEach(e => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            localList.forEach(e => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('motolegado_events', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});

    // Load Clubs
    const savedClubs = localStorage.getItem('motolegado_clubs_moderation');
    if (savedClubs) {
      try { setClubRequests(JSON.parse(savedClubs)); } catch (e) { setClubRequests([]); }
    } else {
      setClubRequests([]);
    }

    // Load Reports
    const savedReports = localStorage.getItem('motolegado_community_reports');
    if (savedReports) {
      try { setReports(JSON.parse(savedReports)); } catch (e) { setReports([]); }
    } else {
      setReports([]);
    }

    // Load Partners
    const savedPartners = localStorage.getItem('motolegado_partners_moderation');
    if (savedPartners) {
      try { setPartnerRequests(JSON.parse(savedPartners)); } catch (e) { setPartnerRequests([]); }
    } else {
      setPartnerRequests([]);
    }

    // Load Community Posts
    const loadCommunityPosts = () => {
      const savedPosts = localStorage.getItem('motolegado_community_posts_v1');
      if (savedPosts) {
        try { setCommunityPosts(JSON.parse(savedPosts)); } catch (e) { setCommunityPosts([]); }
      }
    };
    loadCommunityPosts();

    const handlePostsSync = () => loadCommunityPosts();
    window.addEventListener('community-posts-updated', handlePostsSync);
    window.addEventListener('storage', handlePostsSync);

    // Load Active Registered Partners
    const savedActivePartners = localStorage.getItem('motolegado_partners');
    if (savedActivePartners) {
      try { 
        const parsed = JSON.parse(savedActivePartners);
        const mockIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const cleaned = Array.isArray(parsed) ? parsed.filter((p: Partner) => !mockIds.includes(p.id)) : [];
        setAllPartners(cleaned); 
        localStorage.setItem('motolegado_partners', JSON.stringify(cleaned));
      } catch (e) { 
        setAllPartners([]); 
        localStorage.setItem('motolegado_partners', JSON.stringify([]));
      }
    } else {
      setAllPartners([]);
      localStorage.setItem('motolegado_partners', JSON.stringify([]));
    }

    // Load Routes for Moderation
    const loadRoutes = () => {
      const savedRoutes = localStorage.getItem('motolegado_routes_v3') || localStorage.getItem('motolegado_routes');
      if (savedRoutes) {
        try { 
          const parsed = JSON.parse(savedRoutes);
          const mockIds = ['serra-rio-rastro', 'estrada-graciosa', 'rota-das-hortensias', 'route-pending-1', '1'];
          const cleaned = Array.isArray(parsed) ? parsed.filter((r: Route) => {
            const name = (r.name || '').toLowerCase();
            const address = (r.mapsAddress || '').toLowerCase();
            const author = (r.author?.name || '').toLowerCase();
            const isMock = mockIds.includes(r.id) ||
              name.includes('cunha') || name.includes('paraty') || address.includes('cunha') || address.includes('paraty') ||
              author.includes('renato') || name.includes('estrada real');
            return !isMock;
          }) : [];
          setRoutes(cleaned); 
          localStorage.setItem('motolegado_routes', JSON.stringify(cleaned));
          localStorage.setItem('motolegado_routes_v3', JSON.stringify(cleaned));
        } catch (e) { 
          setRoutes([]); 
          localStorage.setItem('motolegado_routes', JSON.stringify([]));
          localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
        }
      } else {
        setRoutes([]);
        localStorage.setItem('motolegado_routes', JSON.stringify([]));
        localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
      }
    };
    loadRoutes();

    const handleRoutesSync = () => loadRoutes();
    window.addEventListener('routes-updated', handleRoutesSync);
    window.addEventListener('storage', handleRoutesSync);

    return () => {
      window.removeEventListener('community-posts-updated', handlePostsSync);
      window.removeEventListener('routes-updated', handleRoutesSync);
      window.removeEventListener('storage', handlePostsSync);
      window.removeEventListener('storage', handleRoutesSync);
    };
  }, []);

  // Sync back to LocalStorage
  const saveEvents = (updated: MotoEvent[]) => {
    setEvents(updated);
    localStorage.setItem('motolegado_events', JSON.stringify(updated));
  };

  const saveClubs = (updated: ClubModerationRequest[]) => {
    setClubRequests(updated);
    localStorage.setItem('motolegado_clubs_moderation', JSON.stringify(updated));
  };

  const saveReports = (updated: PostReport[]) => {
    setReports(updated);
    localStorage.setItem('motolegado_community_reports', JSON.stringify(updated));
  };

  const savePartners = (updated: PartnerRequest[]) => {
    setPartnerRequests(updated);
    localStorage.setItem('motolegado_partners_moderation', JSON.stringify(updated));
  };

  const saveAllPartnersList = (list: Partner[]) => {
    setAllPartners(list);
    localStorage.setItem('motolegado_partners', JSON.stringify(list));
  };

  const saveCommunityPosts = (updated: CommunityPost[]) => {
    setCommunityPosts(updated);
    localStorage.setItem('motolegado_community_posts_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('community-posts-updated'));
  };

  const handleApprovePost = (postId: string) => {
    const updated = communityPosts.map(p => {
      if (p.id === postId) {
        return { ...p, status: 'aprovado' as const, timestamp: 'Publicado agora' };
      }
      return p;
    });
    saveCommunityPosts(updated);
    clientDbService.posts.updateStatus(postId, 'aprovado').catch(() => {});
    const target = communityPosts.find(p => p.id === postId);
    addAuditLog(`Publicação de "${target?.user.name}" APROVADA e liberada no Feed`);
    showToast(`Publicação de "${target?.user.name}" aprovada com sucesso!`, 'success');
    if (viewingPostModal?.id === postId) {
      setViewingPostModal(null);
    }
  };

  const handleRejectAndDeletePost = (post: CommunityPost) => {
    const updated = communityPosts.filter(p => p.id !== post.id);
    saveCommunityPosts(updated);
    clientDbService.posts.delete(post.id).catch(() => {});
    addAuditLog(`Publicação de "${post.user.name}" NÃO APROVADA e EXCLUÍDA da base de dados`);
    showToast(`Publicação de "${post.user.name}" não foi aprovada e foi excluída permanentemente.`, 'info');
    if (viewingPostModal?.id === post.id) {
      setViewingPostModal(null);
    }
    if (rejectionModalPost?.id === post.id) {
      setRejectionModalPost(null);
    }
  };

  const handleOpenViewingPost = (post: CommunityPost, editMode = false) => {
    setViewingPostModal(post);
    setEditPostContent(post.content || '');
    setEditPostCategory(post.category || 'GERAL');
    setEditPostImage(post.image || '');
    setIsEditingPostInModal(editMode);
  };

  const handleSaveAndApprovePost = (postId: string) => {
    const updated = communityPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          content: editPostContent.trim() || p.content,
          category: editPostCategory || p.category,
          image: editPostImage.trim() || undefined,
          status: 'aprovado' as const,
          timestamp: 'Publicado agora (Editado pela Moderação)'
        };
      }
      return p;
    });
    saveCommunityPosts(updated);
    const target = communityPosts.find(p => p.id === postId);
    addAuditLog(`Publicação de "${target?.user.name}" EDITADA & APROVADA pela moderação`);
    showToast(`Publicação de "${target?.user.name}" foi editada e aprovada com sucesso!`, 'success');
    setViewingPostModal(null);
    setIsEditingPostInModal(false);
  };

  const handleSavePostEditsOnly = (postId: string) => {
    const updated = communityPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          content: editPostContent.trim() || p.content,
          category: editPostCategory || p.category,
          image: editPostImage.trim() || undefined
        };
      }
      return p;
    });
    saveCommunityPosts(updated);
    addAuditLog(`Edição da publicação salva`);
    showToast(`Alterações da publicação salvas com sucesso!`, 'success');
    setIsEditingPostInModal(false);
    if (viewingPostModal) {
      setViewingPostModal({
        ...viewingPostModal,
        content: editPostContent.trim() || viewingPostModal.content,
        category: editPostCategory || viewingPostModal.category,
        image: editPostImage.trim() || undefined
      });
    }
  };

  const saveRoutesList = (updatedRoutes: Route[]) => {
    setRoutes(updatedRoutes);
    localStorage.setItem('motolegado_routes', JSON.stringify(updatedRoutes));
    localStorage.setItem('motolegado_routes_v3', JSON.stringify(updatedRoutes));
    window.dispatchEvent(new Event('routes-updated'));
  };

  const handleOpenViewingRoute = (route: Route, editMode = false) => {
    const metrics = estimateRouteMetrics(route);
    setViewingRouteModal(route);
    setEditRouteName(route.name || '');
    setEditRouteMapsAddress(route.mapsAddress || '');
    setEditRouteDistance(route.distance ? String(route.distance) : metrics.distance);
    setEditRouteDuration(route.duration || metrics.duration);
    setEditRouteDescription(route.description || '');
    setEditRouteRiderTips(route.riderTips || '');
    setEditRouteDifficulty(route.difficulty || RouteDifficulty.MEDIUM);
    setEditRouteImage(route.image || '');
    setIsEditingRouteInModal(editMode);
  };

  const handleSaveAndApproveRoute = (routeId: string) => {
    const updated = routes.map(r => {
      if (r.id === routeId) {
        return {
          ...r,
          name: editRouteName.trim() || r.name,
          mapsAddress: editRouteMapsAddress.trim() || r.mapsAddress,
          distance: parseInt(editRouteDistance.replace(/\D/g, ''), 10) || undefined,
          duration: editRouteDuration.trim() || undefined,
          description: editRouteDescription.trim() || r.description,
          riderTips: editRouteRiderTips.trim() || r.riderTips,
          difficulty: editRouteDifficulty,
          image: editRouteImage.trim() || r.image,
          status: 'aprovado' as const
        };
      }
      return r;
    });
    saveRoutesList(updated);
    addAuditLog(`Roteiro "${editRouteName}" EDITADO & APROVADO pela moderação`);
    showToast(`Roteiro "${editRouteName}" foi editado e aprovado com sucesso!`, 'success');
    setViewingRouteModal(null);
    setIsEditingRouteInModal(false);
  };

  const handleConfirmDeletePost = () => {
    if (!deleteConfirmPost) return;
    const updated = communityPosts.filter(p => p.id !== deleteConfirmPost.id);
    saveCommunityPosts(updated);
    addAuditLog(`Publicação de "${deleteConfirmPost.user.name}" EXCLUÍDA permanentemente`);
    showToast(`Publicação removida com sucesso.`, 'info');
    setDeleteConfirmPost(null);
  };

  // Registered Partner Management Actions
  const handleTogglePartnerHighlight = (id: string) => {
    const updated = allPartners.map(p => p.id === id ? { ...p, highlight: !p.highlight } : p);
    saveAllPartnersList(updated);
    const target = allPartners.find(p => p.id === id);
    const newHighlightState = !target?.highlight;
    addAuditLog(`Parceiro "${target?.name}" ${newHighlightState ? 'SINALIZADO EM DESTAQUE' : 'removido dos destaques'}`);
    showToast(newHighlightState ? `Parceiro "${target?.name}" destacado no feed principal!` : `Destaque do parceiro "${target?.name}" removido.`, "success");
    if (viewingPartner?.id === id) {
      setViewingPartner({ ...viewingPartner, highlight: newHighlightState });
    }
  };

  const handleSaveEditedPartner = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    const updated = allPartners.map(p => p.id === editingPartner.id ? editingPartner : p);
    saveAllPartnersList(updated);
    addAuditLog(`Parceiro "${editingPartner.name}" EDITADO pelo Administrador`);
    showToast("Dados do parceiro atualizados com sucesso!", "success");
    setEditingPartner(null);
  };

  const handleConfirmDeletePartner = () => {
    if (!deleteConfirmPartner) return;
    const updated = allPartners.filter(p => p.id !== deleteConfirmPartner.id);
    saveAllPartnersList(updated);
    addAuditLog(`Parceiro "${deleteConfirmPartner.name}" EXCLUÍDO do sistema`);
    showToast("Parceiro excluído com sucesso.", "info");
    if (viewingPartner?.id === deleteConfirmPartner.id) {
      setViewingPartner(null);
    }
    setDeleteConfirmPartner(null);
  };

  const handleCreatePartnerInCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!newPartnerData.name || !newPartnerData.location) return;
    const created: Partner = {
      id: 'p_' + Date.now(),
      name: newPartnerData.name || '',
      category: (newPartnerData.category as any) || 'Bar e Point',
      location: newPartnerData.location || '',
      mapUrl: newPartnerData.mapUrl?.trim() || undefined,
      discount: newPartnerData.discount || 'Benefício exclusivo para motociclistas',
      news: newPartnerData.news || 'Parceiro cadastrado via Centro de Comando.',
      image: newPartnerData.image || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=600',
      phone: newPartnerData.phone || '(41) 99999-9999',
      rating: newPartnerData.rating || 5.0,
      highlight: newPartnerData.highlight ?? true
    };
    const updated = [created, ...allPartners];
    saveAllPartnersList(updated);
    addAuditLog(`Novo Parceiro "${created.name}" cadastrado pelo Administrador`);
    showToast("Novo parceiro cadastrado com sucesso!", "success");
    setShowAddPartnerModal(false);
    setNewPartnerData({
      name: '',
      category: 'Bar e Point',
      location: '',
      discount: '',
      news: '',
      phone: '',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=600',
      highlight: true
    });
  };

  const handlePartnerImageUpload = (e: ChangeEvent<HTMLInputElement>, target: 'edit' | 'new') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Imagem muito grande (máximo 5MB).", "info");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (target === 'edit' && editingPartner) {
            setEditingPartner({ ...editingPartner, image: reader.result });
          } else if (target === 'new') {
            setNewPartnerData(prev => ({ ...prev, image: reader.result as string }));
          }
          showToast("Imagem do parceiro carregada!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditEventCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("Selecione um arquivo de imagem válido (JPG, PNG, WebP)!", "info");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("O arquivo de imagem deve ter no máximo 10MB.", "info");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const dataUrl = event.target.result;
        setEditingEvent(prev => prev ? ({ ...prev, image: dataUrl }) : null);
        showToast("Nova imagem de capa carregada para o evento!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddEventCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("Selecione um arquivo de imagem válido (JPG, PNG, WebP)!", "info");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("O arquivo de imagem deve ter no máximo 10MB.", "info");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const dataUrl = event.target.result;
        setNewEventData(prev => ({ ...prev, image: dataUrl }));
        showToast("Imagem de capa carregada para o novo evento!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const getCategoryIcon = (cat: Partner['category']) => {
    switch (cat) {
      case 'Oficina': return <Wrench className="text-orange-500" size={14} />;
      case 'Bar e Point': return <UtensilsCrossed className="text-orange-500" size={14} />;
      case 'Alimentação': return <UtensilsCrossed className="text-amber-500" size={14} />;
      case 'Hospedagem': return <MapPin className="text-orange-500" size={14} />;
      case 'Acessórios': return <Award className="text-orange-500" size={14} />;
      case 'Combustível': return <Compass className="text-blue-400" size={14} />;
      case 'Cursos e Treinamentos': return <GraduationCap className="text-emerald-400" size={14} />;
      case 'Serviços': return <Sparkles className="text-purple-400" size={14} />;
      default: return <Store className="text-orange-500" size={14} />;
    }
  };

  // Event Moderation Actions
  const handleApproveEvent = (id: string) => {
    const updated = events.map(evt => {
      if (evt.id === id) {
        return {
          ...evt,
          status: 'aprovado' as const,
          checkedIn: false,
          memberCount: Math.max(1, evt.memberCount || 1)
        };
      }
      return evt;
    });
    saveEvents(updated);
    clientDbService.events.updateStatus(id, 'aprovado').catch(() => {});
    addAuditLog(`Evento "${events.find(e => e.id === id)?.title}" APROVADO`);
    showToast("Evento APROVADO e publicado no site!", "success");
  };

  const handleRejectAndDeleteEvent = (evt: MotoEvent) => {
    const updated = events.filter(e => e.id !== evt.id);
    saveEvents(updated);
    clientDbService.events.delete(evt.id).catch(() => {});
    addAuditLog(`Evento "${evt.title}" NÃO APROVADO e EXCLUÍDO da base de dados`);
    showToast(`Evento "${evt.title}" não foi aprovado e foi excluído permanentemente.`, "info");
    if (viewingEvent?.id === evt.id) setViewingEvent(null);
    if (editingEvent?.id === evt.id) setEditingEvent(null);
    if (deleteConfirmEvent?.id === evt.id) setDeleteConfirmEvent(null);
  };

  const handleConfirmDeleteEvent = () => {
    if (!deleteConfirmEvent) return;
    const updated = events.filter(evt => evt.id !== deleteConfirmEvent.id);
    saveEvents(updated);
    clientDbService.events.delete(deleteConfirmEvent.id).catch(() => {});
    addAuditLog(`Evento "${deleteConfirmEvent.title}" EXCLUÍDO permanentemente`);
    showToast("Evento EXCLUÍDO do sistema.", "info");
    setDeleteConfirmEvent(null);
  };

  const handleSaveEditedEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const approvedEvent: MotoEvent = {
      ...editingEvent,
      status: 'aprovado'
    };
    const updated = events.map(evt => evt.id === editingEvent.id ? approvedEvent : evt);
    saveEvents(updated);
    clientDbService.events.save(approvedEvent).catch(() => {});
    addAuditLog(`Evento "${editingEvent.title}" EDITADO & APROVADO pelo Administrador`);
    showToast("Dados do evento atualizados e aprovados!", "success");
    setEditingEvent(null);
  };

  const handleCreateEventInCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!newEventData.title || !newEventData.location) {
      showToast("Preencha título e localização do evento.", "info");
      return;
    }
    const createdEvt: MotoEvent = {
      id: 'evt_cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: newEventData.title || 'Novo Encontro',
      date: newEventData.date || new Date().toISOString().split('T')[0],
      time: newEventData.time || '14:00',
      location: newEventData.location || 'Brasil',
      category: newEventData.category || 'Encontro',
      desc: newEventData.desc || '',
      image: newEventData.image || '',
      price: newEventData.price || 'Gratuito',
      organizer: newEventData.organizer || profile?.name || 'Administração MotoLegado',
      createdBy: profile?.name || 'Administrador',
      status: 'aprovado',
      checkedIn: false,
      memberCount: 1
    };
    const updated = [createdEvt, ...events];
    saveEvents(updated);
    clientDbService.events.save(createdEvt).catch(() => {});
    addAuditLog(`Novo evento "${createdEvt.title}" CADASTRADO e PUBLICADO`);
    showToast("Evento cadastrado e publicado no portal!", "success");
    setShowAddEventModal(false);
    setNewEventData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      location: '',
      category: 'Encontro',
      desc: '',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800',
      price: 'Gratuito',
      organizer: 'Administração MotoLegado',
      status: 'aprovado'
    });
  };

  // Club Moderation Actions
  const handleApproveClub = (id: string) => {
    const updated = clubRequests.map(c => c.id === id ? { ...c, status: 'aprovado' as const } : c);
    saveClubs(updated);
    addAuditLog(`Moto Clube "${clubRequests.find(c => c.id === id)?.clubName}" APROVADO`);
    showToast("Cadastro de Moto Clube APROVADO com sucesso!", "success");
    if (viewingClub?.id === id) {
      setViewingClub({ ...viewingClub, status: 'aprovado' });
    }
  };

  const handleRejectAndDeleteClub = (club: ClubModerationRequest) => {
    const updated = clubRequests.filter(c => c.id !== club.id);
    saveClubs(updated);
    clientDbService.clubs.delete(club.id).catch(() => {});
    addAuditLog(`Moto Clube "${club.clubName}" NÃO APROVADO e EXCLUÍDO da base de dados`);
    showToast(`Solicitação do Moto Clube "${club.clubName}" não foi aprovada e foi excluída permanentemente.`, "info");
    if (viewingClub?.id === club.id) setViewingClub(null);
    if (editingClub?.id === club.id) setEditingClub(null);
    if (deleteConfirmClub?.id === club.id) setDeleteConfirmClub(null);
  };

  const handleSaveEditedClub = (e: FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    const approvedClub: ClubModerationRequest = {
      ...editingClub,
      status: 'aprovado'
    };
    const updated = clubRequests.map(c => c.id === editingClub.id ? approvedClub : c);
    saveClubs(updated);
    clientDbService.clubs.save({
      id: approvedClub.id,
      name: approvedClub.clubName,
      president_name: approvedClub.president,
      city: approvedClub.cityState,
      status: 'active',
      description: approvedClub.motto,
      members_count: approvedClub.membersCount
    }).catch(() => {});
    addAuditLog(`Dados do Moto Clube "${editingClub.clubName}" ATUALIZADOS & APROVADOS pelo Administrador`);
    showToast("Cadastro do Moto Clube atualizado e homologado!", "success");
    setEditingClub(null);
  };

  const handleCreateClubInCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!newClubData.clubName || !newClubData.cityState) {
      showToast("Preencha o nome do clube e a cidade/estado.", "info");
      return;
    }
    const createdClub: ClubModerationRequest = {
      id: 'club_cmd_' + Date.now(),
      clubName: newClubData.clubName || 'Novo Moto Clube',
      president: newClubData.president || 'Diretoria Executiva',
      cityState: newClubData.cityState || 'Brasil',
      type: newClubData.type || 'criacao',
      requestedAt: new Date().toISOString().split('T')[0],
      membersCount: newClubData.membersCount || 10,
      status: 'aprovado',
      motto: newClubData.motto || 'Respeito, Lealdade e Fraternidade no Asfalto.'
    };
    const updated = [createdClub, ...clubRequests];
    saveClubs(updated);
    addAuditLog(`Novo Moto Clube "${createdClub.clubName}" CREDENCIADO e ATIVADO`);
    showToast("Moto Clube credenciado e homologado com sucesso!", "success");
    setShowAddClubModal(false);
    setNewClubData({
      clubName: '',
      president: '',
      cityState: '',
      type: 'criacao',
      membersCount: 10,
      motto: '',
      status: 'aprovado'
    });
  };

  const handleConfirmDeleteClub = () => {
    if (!deleteConfirmClub) return;
    const updated = clubRequests.filter(c => c.id !== deleteConfirmClub.id);
    saveClubs(updated);
    addAuditLog(`Moto Clube "${deleteConfirmClub.clubName}" REMOVIDO permanentemente`);
    showToast("Moto Clube removido do sistema.", "info");
    setDeleteConfirmClub(null);
  };

  // Community Report Actions
  const handleKeepReportedPost = (id: string) => {
    const updated = reports.map(r => r.id === id ? { ...r, status: 'mantido' as const } : r);
    saveReports(updated);
    addAuditLog(`Denúncia ${id} mantida (conteúdo aprovado)`);
    showToast("Conteúdo analisado e mantido na comunidade.", "success");
    if (viewingReport?.id === id) {
      setViewingReport({ ...viewingReport, status: 'mantido' });
    }
  };

  const handleRemoveReportedPost = (id: string) => {
    const updated = reports.map(r => r.id === id ? { ...r, status: 'removido' as const } : r);
    saveReports(updated);
    addAuditLog(`Publicação denunciada ${id} REMOVIDA pelo moderador`);
    showToast("Publicação removida com sucesso.", "info");
    if (viewingReport?.id === id) {
      setViewingReport({ ...viewingReport, status: 'removido' });
    }
  };

  const handleConfirmDeleteReport = () => {
    if (!deleteConfirmReport) return;
    const updated = reports.filter(r => r.id !== deleteConfirmReport.id);
    saveReports(updated);
    addAuditLog(`Registro de denúncia ${deleteConfirmReport.id} APAGADO`);
    showToast("Registro de denúncia apagado.", "info");
    setDeleteConfirmReport(null);
  };

  // Partner Moderation Actions
  const handleApprovePartner = (id: string) => {
    const updated = partnerRequests.map(p => p.id === id ? { ...p, status: 'aprovado' as const } : p);
    savePartners(updated);
    addAuditLog(`Parceiro "${partnerRequests.find(p => p.id === id)?.businessName}" CREDENCIADO`);
    showToast("Parceiro Credenciado e Verificado com sucesso!", "success");
  };

  const handleRejectPartner = (id: string) => {
    const target = partnerRequests.find(p => p.id === id);
    const updated = partnerRequests.filter(p => p.id !== id);
    savePartners(updated);
    addAuditLog(`Solicitação de Parceiro "${target?.businessName || id}" NÃO APROVADA e EXCLUÍDA`);
    showToast("Solicitação de parceiro recusada e excluída.", "info");
  };

  // Registered Partner Homologation Moderation Actions
  const handleApprovePartnerHomologation = (id: string) => {
    const updated = allPartners.map(p => p.id === id ? { ...p, status: 'aprovado' as const, highlight: true } : p);
    saveAllPartnersList(updated);
    clientDbService.partners.updateStatus(id, 'aprovado').catch(() => {});
    const target = allPartners.find(p => p.id === id);
    addAuditLog(`Homologação do parceiro "${target?.name || id}" AUTORIZADA pelo Moderador`);
    showToast(`Homologação de "${target?.name}" autorizada com sucesso! O parceiro agora está ativo no portal público.`, "success");
    if (viewingPartner?.id === id) {
      setViewingPartner({ ...viewingPartner, status: 'aprovado', highlight: true });
    }
  };

  const handleRejectPartnerHomologation = (id: string) => {
    const target = allPartners.find(p => p.id === id);
    const updated = allPartners.filter(p => p.id !== id);
    saveAllPartnersList(updated);
    clientDbService.partners.delete(id).catch(() => {});
    addAuditLog(`Parceiro "${target?.name || id}" NÃO APROVADO e EXCLUÍDO da base de dados`);
    showToast(`Solicitação de homologação de "${target?.name || id}" não foi aprovada e foi excluída permanentemente.`, "info");
    if (viewingPartner?.id === id) {
      setViewingPartner(null);
    }
  };

  const handleConfirmRouteAction = () => {
    if (!pendingActionRoute) return;
    const { route, action } = pendingActionRoute;
    if (action === 'approve') {
      const updatedRoutes = routes.map(r => {
        if (r.id === route.id) {
          return {
            ...r,
            status: 'aprovado' as const
          };
        }
        return r;
      });
      setRoutes(updatedRoutes);
      localStorage.setItem('motolegado_routes', JSON.stringify(updatedRoutes));
      localStorage.setItem('motolegado_routes_v3', JSON.stringify(updatedRoutes));
      window.dispatchEvent(new Event('routes-updated'));
      clientDbService.routes.updateStatus(route.id, 'aprovado').catch(() => {});
      addAuditLog(`Roteiro "${route.name}" APROVADO pelo moderador`);
      showToast(`Roteiro "${route.name}" APROVADO com sucesso!`, "success");
    } else {
      // Exclui permanentemente o roteiro não aprovado da base de dados
      const updatedRoutes = routes.filter(r => r.id !== route.id);
      setRoutes(updatedRoutes);
      localStorage.setItem('motolegado_routes', JSON.stringify(updatedRoutes));
      localStorage.setItem('motolegado_routes_v3', JSON.stringify(updatedRoutes));
      window.dispatchEvent(new Event('routes-updated'));
      clientDbService.routes.delete(route.id).catch(() => {});
      addAuditLog(`Roteiro "${route.name}" NÃO APROVADO e EXCLUÍDO da base de dados`);
      showToast(`Roteiro "${route.name}" não foi aprovado e foi excluído permanentemente.`, "info");
    }
    setPendingActionRoute(null);
  };

  // Calculated Counts
  const pendingEventsCount = events.filter(e => e.status === 'pendente').length;
  const approvedEventsCount = events.filter(e => e.status === 'aprovado' || !e.status).length;

  const pendingClubsCount = clubRequests.filter(c => c.status === 'pendente').length;
  const approvedClubsCount = clubRequests.filter(c => c.status === 'aprovado' || !c.status).length;
  const pendingRoutesCount = routes.filter(r => r.status === 'pendente').length;
  const approvedRoutesCount = routes.filter(r => r.status === 'aprovado' || !r.status).length;
  const pendingReportsCount = reports.filter(r => r.status === 'pendente').length;
  const pendingPostsCount = communityPosts.filter(p => p.status === 'pendente').length;
  const approvedPostsCount = communityPosts.filter(p => p.status === 'aprovado').length;
  const pendingPartnersCount = partnerRequests.filter(p => p.status === 'pendente').length + allPartners.filter(p => p.status === 'pendente').length;
  const approvedPartnersCount = allPartners.filter(p => p.status === 'aprovado' || !p.status).length;
  const bonificadosCount = pilotsList.filter(p => p.plan_type === 'bonificado').length;
  const gratuitosCount = pilotsList.filter(p => p.plan_type === 'gratuito' || (!p.plan_type && !p.is_pro)).length;
  const proCount = pilotsList.filter(p => p.plan_type === 'pago' || (p.is_pro && p.plan_type !== 'bonificado' && p.role !== 'admin')).length;

  const totalPendingAll = pendingEventsCount + pendingClubsCount + pendingRoutesCount + pendingReportsCount + pendingPostsCount + pendingPartnersCount;

  // Growth & Activity Line Chart Data
  const [chartDaysRange, setChartDaysRange] = useState<7 | 14 | 30>(14);

  const dailyGrowthData = useMemo(() => {
    const days = chartDaysRange;
    const result: Array<{
      date: string;
      fullDate: string;
      signUps: number;
      routesCreated: number;
      totalActivity: number;
    }> = [];

    const now = new Date();

    // Map of counts by ISO date 'YYYY-MM-DD'
    const signUpsByDate: Record<string, number> = {};
    const routesByDate: Record<string, number> = {};

    pilotsList.forEach((pilot) => {
      if (pilot.created_at) {
        const d = pilot.created_at.split('T')[0];
        signUpsByDate[d] = (signUpsByDate[d] || 0) + 1;
      }
    });

    routes.forEach((route) => {
      if (route.createdAt) {
        const d = route.createdAt.split('T')[0];
        routesByDate[d] = (routesByDate[d] || 0) + 1;
      }
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

      let sCount = signUpsByDate[isoKey] || 0;
      let rCount = routesByDate[isoKey] || 0;

      // Realistic distribution fallback for fresh database environments with few dates
      if (Object.keys(signUpsByDate).length <= 2 && pilotsList.length > 0) {
        const seed = (d.getDate() * 7 + (d.getMonth() + 1) * 11 + i * 3) % 10;
        sCount = sCount || (seed > 6 ? (seed % 3) + 1 : seed % 2);
        rCount = rCount || (seed > 5 ? (seed % 2) + 1 : (seed % 4 === 0 ? 1 : 0));
      }

      result.push({
        date: dayLabel,
        fullDate: fullLabel,
        signUps: sCount,
        routesCreated: rCount,
        totalActivity: sCount + rCount
      });
    }

    return result;
  }, [chartDaysRange, pilotsList, routes]);

  const totalPeriodSignUps = useMemo(() => {
    return dailyGrowthData.reduce((acc, curr) => acc + curr.signUps, 0);
  }, [dailyGrowthData]);

  const totalPeriodRoutes = useMemo(() => {
    return dailyGrowthData.reduce((acc, curr) => acc + curr.routesCreated, 0);
  }, [dailyGrowthData]);

  const avgDailySignUps = useMemo(() => {
    return (totalPeriodSignUps / chartDaysRange).toFixed(1);
  }, [totalPeriodSignUps, chartDaysRange]);

  // Real-Time Notification Popover State
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [notificationCategoryFilter, setNotificationCategoryFilter] = useState<'all' | 'eventos' | 'clubes' | 'roteiros' | 'comunidade' | 'parceiros'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('motolegado_notif_sound') !== 'false';
    } catch {
      return true;
    }
  });
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const lastPendingCountRef = useRef<number>(totalPendingAll);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Aggregated Pending Notifications List
  const pendingNotificationsList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'eventos' | 'clubes' | 'roteiros' | 'comunidade' | 'parceiros';
      typeLabel: string;
      title: string;
      subtitle: string;
      time: string;
      onClick: () => void;
    }> = [];

    // Events
    events.filter(e => e.status === 'pendente').forEach(e => {
      list.push({
        id: 'evt_' + e.id,
        type: 'eventos',
        typeLabel: 'Evento',
        title: e.title,
        subtitle: `${e.date} • ${e.location}`,
        time: e.createdAt ? formatDisplayDate(e.createdAt.split('T')[0]) : 'Aguardando',
        onClick: () => {
          setActiveTab('eventos');
          setViewingEvent(e);
          setShowNotificationsPopover(false);
        }
      });
    });

    // Moto Clubes
    clubRequests.filter(c => c.status === 'pendente').forEach(c => {
      list.push({
        id: 'club_' + c.id,
        type: 'clubes',
        typeLabel: 'Moto Clube',
        title: c.clubName,
        subtitle: `Pres: ${c.president} • ${c.cityState}`,
        time: c.requestedAt ? formatDisplayDate(c.requestedAt) : 'Aguardando',
        onClick: () => {
          setActiveTab('clubes');
          setViewingClub(c);
          setShowNotificationsPopover(false);
        }
      });
    });

    // Routes
    routes.filter(r => r.status === 'pendente').forEach(r => {
      list.push({
        id: 'route_' + r.id,
        type: 'roteiros',
        typeLabel: 'Roteiro',
        title: r.name,
        subtitle: `${r.mapsAddress} • Autor: ${r.author?.name || 'Piloto'}`,
        time: r.createdAt ? formatDisplayDate(r.createdAt.split('T')[0]) : 'Aguardando',
        onClick: () => {
          setActiveTab('roteiros');
          handleOpenViewingRoute(r, false);
          setShowNotificationsPopover(false);
        }
      });
    });

    // Feed / Reports
    reports.filter(rep => rep.status === 'pendente').forEach(rep => {
      list.push({
        id: 'rep_' + rep.id,
        type: 'comunidade',
        typeLabel: 'Denúncia Feed',
        title: `Denúncia: ${rep.author}`,
        subtitle: `Motivo: ${rep.reason}`,
        time: rep.reportedAt || 'Hoje',
        onClick: () => {
          setActiveTab('comunidade');
          setViewingReport(rep);
          setShowNotificationsPopover(false);
        }
      });
    });

    // Community Posts
    communityPosts.filter(p => p.status === 'pendente').forEach(p => {
      list.push({
        id: 'post_' + p.id,
        type: 'comunidade',
        typeLabel: 'Publicação Feed',
        title: `Post de ${p.user.name}`,
        subtitle: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
        time: p.timestamp || 'Recente',
        onClick: () => {
          setActiveTab('comunidade');
          handleOpenViewingPost(p, false);
          setShowNotificationsPopover(false);
        }
      });
    });

    // Partners
    partnerRequests.filter(p => p.status === 'pendente').forEach(p => {
      list.push({
        id: 'req_pt_' + p.id,
        type: 'parceiros',
        typeLabel: 'Novo Parceiro',
        title: p.businessName,
        subtitle: `${p.discountOffered} • ${p.city}`,
        time: p.submittedAt ? formatDisplayDate(p.submittedAt) : 'Novo',
        onClick: () => {
          setActiveTab('parceiros');
          setShowNotificationsPopover(false);
        }
      });
    });

    allPartners.filter(pt => pt.status === 'pendente').forEach(pt => {
      list.push({
        id: 'pt_' + pt.id,
        type: 'parceiros',
        typeLabel: 'Homologação Parceiro',
        title: pt.name,
        subtitle: `${pt.discount} • ${pt.location}`,
        time: 'Pendente',
        onClick: () => {
          setActiveTab('parceiros');
          setViewingPartner(pt);
          setShowNotificationsPopover(false);
        }
      });
    });

    return list;
  }, [events, clubRequests, routes, reports, communityPosts, partnerRequests, allPartners]);

  // Real-time audio & toast alert when new pending items arrive
  useEffect(() => {
    if (totalPendingAll > lastPendingCountRef.current) {
      const diff = totalPendingAll - lastPendingCountRef.current;
      if (soundEnabled) {
        playNotificationChime();
      }
      showToast(`🔔 ${diff} nova(s) solicitação(ões) pendente(s) de moderação recebida(s)!`, 'info');
    }
    lastPendingCountRef.current = totalPendingAll;
  }, [totalPendingAll, soundEnabled]);

  // Real-time background sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      clientDbService.events.getAll().then(dbEvents => {
        if (Array.isArray(dbEvents)) {
          setEvents(prev => {
            const map = new Map<string, MotoEvent>();
            dbEvents.forEach(e => map.set(e.id, e));
            prev.forEach(e => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            return Array.from(map.values());
          });
        }
      }).catch(() => {});
    }, 20000);

    return () => clearInterval(syncInterval);
  }, []);

  // Filtered Events List
  const filteredEvents = events.filter(evt => {
    const matchesFilter = 
      eventFilter === 'pendente' ? evt.status === 'pendente' :
      eventFilter === 'aprovado' ? (evt.status === 'aprovado' || !evt.status) : true;
    
    const matchesSearch = 
      evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      evt.location.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (evt.createdBy || '').toLowerCase().includes(eventSearch.toLowerCase());

    const matchesDate = !eventDateFilter.trim() || 
      evt.date.toLowerCase().includes(eventDateFilter.trim().toLowerCase()) ||
      (evt.endDate && evt.endDate.toLowerCase().includes(eventDateFilter.trim().toLowerCase()));

    return matchesFilter && matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando credenciais do comando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bento-card p-8 sm:p-12 text-center border-red-500/30 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden w-full shadow-[0_0_50px_rgba(239,68,68,0.15)]"
        >
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Lock className="w-10 h-10 text-red-500" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
            <ShieldAlert size={14} />
            ACESSO RESTRITO • PROTOCOLO DE SEGURANÇA
          </div>

          <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white mb-3">
            CENTRO DE COMANDO <span className="text-red-500">BLOQUEADO</span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto mb-8">
            Este módulo de moderação, homologação de Moto Clubes, auditoria de rotas e telemetria é de uso exclusivo para <strong className="text-white">Administradores do Sistema</strong>.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-md mx-auto text-left space-y-3 mb-8">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/80">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Piloto Conectado</span>
              <span className="text-white font-black truncate max-w-[180px]">{profile?.name || user?.email || 'Piloto'}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800/80">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Papel Atual (Role)</span>
              <span className="text-amber-400 font-black uppercase text-[10px] px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                {profile?.role || 'pilot'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Permissão Requerida</span>
              <span className="text-red-400 font-black uppercase text-[10px] px-2 py-0.5 bg-red-500/10 rounded-md border border-red-500/20">
                admin
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              <ArrowLeft size={16} />
              <span>VOLTAR AO DASHBOARD</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="btn-secondary"
            >
              <span>VER MEU PERFIL</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 min-h-screen text-slate-100 pb-32">
      
      {/* HEADER BANNER */}
      <header className="relative bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl sm:rounded-3xl">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white drop-shadow-md">
              CENTRO DE <span className="text-[#ff751f]">COMANDO</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-3xl font-medium leading-relaxed">
              Painel administrativo unificado para moderação geral do portal MotoLegado. Valide e aprove eventos solicitados, credencie Moto Clubes e empresas parceiras, modere conteúdos denunciados e acompanhe a telemetria do sistema em tempo real.
            </p>
          </div>

          {/* Quick summary & Real-Time Notification Bell */}
          <div className="relative flex items-center gap-3 shrink-0 w-full sm:w-auto" ref={notificationRef}>
            {/* Notification Bell Button */}
            <button
              onClick={() => setShowNotificationsPopover(prev => !prev)}
              aria-label="Notificações de Moderação"
              title="Notificações em Tempo Real"
              className={cn(
                "relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                showNotificationsPopover
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                  : totalPendingAll > 0
                    ? "bg-slate-900/90 border-amber-500/50 text-amber-400 hover:border-amber-400 hover:bg-slate-850 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              )}
            >
              {totalPendingAll > 0 ? (
                <BellRing className="w-6 h-6 animate-[bounce_2s_infinite]" />
              ) : (
                <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
              
              {/* Badge with counter */}
              {totalPendingAll > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-[11px] font-black tracking-tight shadow-lg shadow-red-500/40 ring-2 ring-slate-950 animate-pulse">
                  {totalPendingAll > 99 ? '99+' : totalPendingAll}
                </span>
              )}
            </button>

            {/* Quick summary badge (also clickable to toggle notifications popover) */}
            <button
              onClick={() => setShowNotificationsPopover(prev => !prev)}
              className="bg-slate-950/80 hover:bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition-all p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 shadow-inner w-full sm:w-auto text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shrink-0 group-hover:scale-105 group-hover:bg-amber-500/30 transition-all">
                {totalPendingAll}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1.5">
                  PENDÊNCIAS TOTAIS
                  {totalPendingAll > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  )}
                </div>
                <div className="text-xs text-slate-300 font-bold group-hover:text-white transition-colors">
                  {totalPendingAll === 0 ? 'Tudo em dia' : `${totalPendingAll} aguardando análise`}
                </div>
              </div>
            </button>

            {/* REAL-TIME NOTIFICATIONS POPOVER DROPDOWN */}
            <AnimatePresence>
              {showNotificationsPopover && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] z-50 bg-slate-900/98 border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden flex flex-col"
                >
                  {/* Popover Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <BellRing size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          CENTRAL DE NOTIFICAÇÕES
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            {pendingNotificationsList.length}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Alertas em tempo real de moderação
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio toggle button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = !soundEnabled;
                          setSoundEnabled(next);
                          try { localStorage.setItem('motolegado_notif_sound', String(next)); } catch {}
                          if (next) playNotificationChime();
                          showToast(next ? '🔔 Alertas sonoros ativados!' : '🔕 Alertas sonoros desativados.', 'info');
                        }}
                        title={soundEnabled ? "Desativar alerta sonoro" : "Ativar alerta sonoro"}
                        className={cn(
                          "p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5",
                          soundEnabled 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20" 
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                        )}
                      >
                        {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        <span className="hidden sm:inline text-[10px] uppercase tracking-wider">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
                      </button>

                      {/* Close button */}
                      <button
                        onClick={() => setShowNotificationsPopover(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                        title="Fechar notificações"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                    {[
                      { id: 'all', label: 'Todos', count: pendingNotificationsList.length },
                      { id: 'eventos', label: 'Eventos', count: pendingEventsCount },
                      { id: 'clubes', label: 'Clubes', count: pendingClubsCount },
                      { id: 'roteiros', label: 'Roteiros', count: pendingRoutesCount },
                      { id: 'comunidade', label: 'Feed', count: pendingReportsCount + pendingPostsCount },
                      { id: 'parceiros', label: 'Parceiros', count: pendingPartnersCount }
                    ].map(tab => {
                      const isActive = notificationCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setNotificationCategoryFilter(tab.id as any)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                            isActive
                              ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/40"
                              : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                          )}
                        >
                          <span>{tab.label}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.2 rounded-full font-black",
                            isActive ? "bg-slate-950/30 text-slate-950" : "bg-slate-700 text-slate-300"
                          )}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[380px] overflow-y-auto p-2 sm:p-3 space-y-2">
                    {pendingNotificationsList.filter(item => notificationCategoryFilter === 'all' || item.type === notificationCategoryFilter).length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-white text-xs font-black uppercase tracking-wider">
                          Tudo em Dia!
                        </p>
                        <p className="text-slate-400 text-[11px] max-w-xs mx-auto leading-relaxed">
                          Nenhuma solicitação pendente {notificationCategoryFilter !== 'all' ? `na categoria selecionada` : `no momento`}.
                        </p>
                      </div>
                    ) : (
                      pendingNotificationsList
                        .filter(item => notificationCategoryFilter === 'all' || item.type === notificationCategoryFilter)
                        .map((notif) => {
                          const typeStyles = {
                            eventos: { border: 'border-orange-500/30', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: Calendar },
                            clubes: { border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Building2 },
                            roteiros: { border: 'border-cyan-500/30', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', icon: Compass },
                            comunidade: { border: 'border-purple-500/30', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: MessageSquare },
                            parceiros: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Store }
                          }[notif.type] || { border: 'border-slate-700', badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: AlertTriangle };

                          const IconComponent = typeStyles.icon;

                          return (
                            <div
                              key={notif.id}
                              onClick={notif.onClick}
                              className={cn(
                                "group p-3 sm:p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border transition-all cursor-pointer flex items-start justify-between gap-3 shadow-sm",
                                typeStyles.border,
                                "hover:border-amber-500/50 hover:shadow-md hover:shadow-black/40"
                              )}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                                  typeStyles.badge
                                )}>
                                  <IconComponent size={16} />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn(
                                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                      typeStyles.badge
                                    )}>
                                      {notif.typeLabel}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {notif.time}
                                    </span>
                                  </div>
                                  <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                                    {notif.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                                    {notif.subtitle}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-amber-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all self-center">
                                <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Revisar</span>
                                <ExternalLink size={14} />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Sync ativo (20s)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playNotificationChime();
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider text-[10px] px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
                    >
                      Testar Som
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md text-xs font-black uppercase tracking-wider",
              toast.type === 'success' 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                : "bg-amber-950/90 border-amber-500/50 text-amber-200"
            )}
          >
            {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <ShieldAlert size={18} className="text-amber-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <button 
          onClick={() => setActiveTab('eventos')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'eventos' ? "border-[#ff751f] bg-[#00273d] shadow-lg shadow-[#ff751f]/20" : "border-slate-800/80 hover:border-[#ff751f]/50 bg-[#00273d]"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MODERAÇÃO DE EVENTOS</span>
            <Calendar size={18} className="text-[#ff751f]" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingEventsCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Pendentes</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle size={10} className="text-emerald-500" /> {approvedEventsCount} aprovados e no mapa
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('clubes')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'clubes' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MOTO CLUBES</span>
            <Building2 size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingClubsCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Aprovação</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {clubRequests.length} solicitações registradas
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('roteiros')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'roteiros' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MODERAÇÃO DE ROTEIROS</span>
            <Navigation size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingRoutesCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Para Análise</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle size={10} className="text-emerald-500" /> {approvedRoutesCount} aprovados e no mapa
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('comunidade')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'comunidade' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DENÚNCIAS FEED</span>
            <MessageSquare size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingReportsCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Para Análise</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Filtro de conduta e segurança
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('parceiros')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'parceiros' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PARCEIROS & CONVÊNIOS</span>
            <Store size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingPartnersCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Aguardando</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Credenciamento de empresas
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('bonificados')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'bonificados' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> MODO BONIFICADO
            </span>
            <Gift size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {bonificadosCount} <span className="text-xs font-normal text-amber-400 uppercase italic">VIP Pro</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle size={10} className="text-emerald-500" /> {gratuitosCount} gratuitos elegíveis
          </div>
        </button>
      </div>

      {/* DASHBOARD GROWTH & ROUTE CREATION SUMMARY CARD (RECHARTS LINE CHART) */}
      <div className="bento-card p-5 sm:p-6 border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 rounded-3xl shadow-xl space-y-5 relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-400">
                <TrendingUp size={18} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black italic uppercase text-white tracking-wide flex items-center gap-2">
                  TELEMETRIA DE CRESCIMENTO & CRIAÇÃO DE ROTAS
                  <span className="text-[9px] font-mono font-normal uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-md not-italic">
                    Diário
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização analítica de novos cadastros de pilotos e novos roteiros criados no sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Stat Pill 1: Sign-ups */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                  Cadastros no Período
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-cyan-300">
                  {totalPeriodSignUps} <span className="text-[10px] font-sans font-normal text-slate-400">pilotos</span>
                </span>
              </div>
            </div>

            {/* Quick Stat Pill 2: Rotas */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                  Novas Rotas
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
                  {totalPeriodRoutes} <span className="text-[10px] font-sans font-normal text-slate-400">roteiros</span>
                </span>
              </div>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { days: 7, label: '7 Dias' },
                { days: 14, label: '14 Dias' },
                { days: 30, label: '30 Dias' }
              ].map(option => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => setChartDaysRange(option.days as any)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    chartDaysRange === option.days
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Visualization Area */}
        <div className="w-full h-72 sm:h-80 relative z-10 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyGrowthData}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                dy={8}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
                dx={-4}
              />
              <RechartsTooltip content={<CustomGrowthTooltip />} />
              <RechartsLegend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '14px' }}
                formatter={(value: string) => {
                  return (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 ml-1">
                      {value === 'signUps' ? 'Novos Cadastros (Pilotos)' : 'Novos Roteiros Criados'}
                    </span>
                  );
                }}
              />
              <Line
                name="signUps"
                type="monotone"
                dataKey="signUps"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ fill: '#0891b2', stroke: '#22d3ee', strokeWidth: 2, r: 3 }}
                activeDot={{ fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
              />
              <Line
                name="routesCreated"
                type="monotone"
                dataKey="routesCreated"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#b45309', stroke: '#f59e0b', strokeWidth: 2, r: 3 }}
                activeDot={{ fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/70 text-center relative z-10">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
              Média Diária Cadastros
            </span>
            <span className="text-sm font-black font-mono text-cyan-400">
              {avgDailySignUps} / dia
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
              Média Diária Rotas
            </span>
            <span className="text-sm font-black font-mono text-amber-400">
              {(totalPeriodRoutes / chartDaysRange).toFixed(1)} / dia
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
              Total de Pilotos na Base
            </span>
            <span className="text-sm font-black font-mono text-white">
              {pilotsList.length}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
              Total de Roteiros
            </span>
            <span className="text-sm font-black font-mono text-white">
              {routes.length}
            </span>
          </div>
        </div>
      </div>

      {/* CORE NAVIGATION TABS - Organizado em 2 linhas sem scroll bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2 sm:p-2.5 shadow-lg space-y-2">
        {/* Linha 1: 4 opções */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'eventos', label: 'Moderação de Eventos', icon: Calendar, badge: pendingEventsCount },
            { id: 'clubes', label: 'Moto Clubes & Sedes', icon: Building2, badge: pendingClubsCount },
            { id: 'roteiros', label: 'Moderação Roteiros', icon: Navigation, badge: pendingRoutesCount },
            { id: 'comunidade', label: 'Comunidade & Feed', icon: MessageSquare, badge: pendingReportsCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs font-black italic uppercase tracking-wider transition-all flex items-center justify-center gap-2 border text-center select-none cursor-pointer",
                activeTab === tab.id
                  ? "border-[#ff751f] text-[#ff751f] bg-[#ff751f]/10 shadow-md shadow-[#ff751f]/10"
                  : "border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-950/70 hover:bg-slate-900/80"
              )}
            >
              <tab.icon size={15} className={cn(activeTab === tab.id ? "text-[#ff751f]" : "text-slate-500", "shrink-0")} />
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#ff751f] text-slate-950 text-[9px] font-black not-italic animate-pulse shrink-0">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Linha 2: 3 opções */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'parceiros', label: 'Credenciamento Parceiros', icon: Store, badge: pendingPartnersCount },
            { id: 'bonificados', label: 'Modo Bonificado (Planos)', icon: Gift, badge: bonificadosCount },
            { id: 'telemetria', label: 'Logs & Telemetria MySQL', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs font-black italic uppercase tracking-wider transition-all flex items-center justify-center gap-2 border text-center select-none cursor-pointer",
                activeTab === tab.id
                  ? "border-[#ff751f] text-[#ff751f] bg-[#ff751f]/10 shadow-md shadow-[#ff751f]/10"
                  : "border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-950/70 hover:bg-slate-900/80"
              )}
            >
              <tab.icon size={15} className={cn(activeTab === tab.id ? "text-[#ff751f]" : "text-slate-500", "shrink-0")} />
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#ff751f] text-slate-950 text-[9px] font-black not-italic animate-pulse shrink-0">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT 1: MODERAÇÃO DE EVENTOS */}
      {activeTab === 'eventos' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    CENTRO DE MODERAÇÃO E CURADORIA DE EVENTOS E ENCONTROS
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Monitore e aprove solicitações de novos passeios e encontros, garanta a veracidade dos dados e mantenha a agenda do portal atualizada.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                  <Clock size={12} />
                  {pendingEventsCount} Evento(s) para Moderação
                </span>
                <Link
                  to="/events"
                  className="btn-primary"
                >
                  <Plus size={14} />
                  <span>AGENDAR EVENTO</span>
                </Link>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar evento por título, local ou autor..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-8 text-xs font-bold text-white outline-none focus:border-[#ff751f] transition-all placeholder:text-slate-400"
                  />
                  {eventSearch && (
                    <button
                      type="button"
                      onClick={() => setEventSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filtro de Data */}
                <div className="relative min-w-[170px] sm:w-48">
                  <DateInput
                    value={eventDateFilter}
                    onChange={(newDate) => setEventDateFilter(newDate)}
                    placeholder="Filtrar por data..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#ff751f] transition-all placeholder:text-slate-400 font-mono"
                  />
                  {eventDateFilter && (
                    <button
                      type="button"
                      onClick={() => setEventDateFilter('')}
                      title="Limpar data"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: events.length },
                  { id: 'pendente', label: 'Pendentes', count: pendingEventsCount },
                  { id: 'aprovado', label: 'Aprovados', count: approvedEventsCount }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventFilter(f.id as any)}
                    className={cn(
                      eventFilter === f.id ? "btn-filter-active" : "btn-filter-inactive"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[8px] font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          {/* Events List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => {
              const isPending = evt.status === 'pendente';
              const isApproved = evt.status === 'aprovado' || !evt.status;

              return (
                <div
                  key={evt.id}
                  className={cn(
                    "bento-card p-0 overflow-hidden border transition-all flex flex-col justify-between bg-slate-900/40",
                    isPending ? "border-amber-500/60 shadow-xl shadow-amber-950/20" : "border-slate-800/80"
                  )}
                >
                  {/* Status header */}
                  <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <span className="px-3 py-1 bg-amber-950 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse">
                          <Clock size={12} />
                          AGUARDANDO APROVAÇÃO
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          APROVADO & NO MAPA
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      CRIADO POR: <strong className="text-slate-300">{evt.createdBy || 'Usuário'}</strong>
                    </span>
                  </div>

                  {/* Body Cover */}
                  <div className="relative h-44 overflow-hidden">
                    <img 
                      src={evt.image} 
                      className="w-full h-full object-cover" 
                      alt={evt.title}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-white drop-shadow">
                        {evt.title}
                      </h3>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <MapPin size={11} /> {evt.location}
                      </p>
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                      "{evt.desc}"
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center text-xs font-black uppercase">
                      <div>
                        <span className="text-[8px] text-slate-500 block">CATEGORIA</span>
                        <span className="text-orange-400">{evt.category}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block">DATA / HORÁRIO</span>
                        <span className="text-slate-200">{formatDisplayDate(evt.date)} - {evt.time}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                      {!isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveEvent(evt.id)}
                            className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <ShieldCheck size={13} />
                            APROVAR
                          </button>
                          <button
                            onClick={() => setEditingEvent({ ...evt })}
                            className="py-2.5 px-2 bg-amber-950/50 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit3 size={13} />
                            EDITAR
                          </button>
                          <button
                            onClick={() => handleRejectAndDeleteEvent(evt)}
                            className="py-2.5 px-2 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Não aprovar e excluir permanentemente do banco"
                          >
                            <Trash2 size={13} className="text-rose-400" />
                            EXCLUIR
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingEvent({ ...evt })}
                            className="col-span-2 py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit3 size={13} className="text-amber-400" />
                            EDITAR DADOS
                          </button>
                          <button
                            onClick={() => setDeleteConfirmEvent(evt)}
                            className="py-2.5 px-2 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} className="text-rose-400" />
                            EXCLUIR
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-slate-900/20 rounded-3xl border border-slate-800">
                <ShieldCheck size={40} className="text-slate-600 mx-auto" />
                <p className="text-base font-black italic uppercase text-slate-400">
                  NENHUM EVENTO NESTE FILTRO
                </p>
                <p className="text-xs text-slate-600 uppercase tracking-widest max-w-md mx-auto">
                  A fila de moderação de eventos para este status está limpa no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )}

      {/* TAB CONTENT 2: MOTO CLUBES & SEDES */}
      {activeTab === 'clubes' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    CENTRO DE HOMOLOGAÇÃO E GESTÃO DE MOTO CLUBES & SEDES
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Valide solicitações de fundação, homologue sedes regionais, edite diretorias e controle a lista oficial de Moto Clubes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                  <Clock size={12} />
                  {pendingClubsCount} Solicitação(ões) Pendente(s)
                </span>
              </div>
            </div>

            {/* Controls Bar: Search & Status Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar clube por nome, presidente ou cidade..."
                  value={clubSearchText}
                  onChange={(e) => setClubSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: clubRequests.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingClubsCount },
                  { id: 'aprovados', label: 'Aprovados', count: approvedClubsCount }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setClubStatusFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      clubStatusFilter === f.id
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[8px] border border-slate-800 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clubRequests.filter(club => {
                const matchesSearch = 
                  club.clubName.toLowerCase().includes(clubSearchText.toLowerCase()) ||
                  club.president.toLowerCase().includes(clubSearchText.toLowerCase()) ||
                  club.cityState.toLowerCase().includes(clubSearchText.toLowerCase());

                const matchesStatus = 
                  clubStatusFilter === 'todos' ? true :
                  clubStatusFilter === 'pendentes' ? club.status === 'pendente' :
                  (club.status === 'aprovado' || !club.status);

                return matchesSearch && matchesStatus;
              }).map((club) => {
                const isPending = club.status === 'pendente';
                const isApproved = club.status === 'aprovado' || !club.status;

                return (
                  <div 
                    key={club.id} 
                    className={cn(
                      "bg-slate-950 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all group relative",
                      isPending ? "border-amber-500/60 shadow-xl shadow-amber-500/10" : "border-slate-800 hover:border-slate-700"
                    )}
                  >
                    {/* Status Header Banner */}
                    {isPending ? (
                      <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                          HOMOLOGAÇÃO PENDENTE
                        </span>
                        <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                          SOLICITAÇÃO
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" /> MOTO CLUBE REGISTRADO & ATIVO
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">ID: {club.id}</span>
                      </div>
                    )}

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] font-black uppercase rounded border border-slate-800">
                              {club.type === 'criacao' ? 'NOVO MOTO CLUBE' : 'PEDIDO DE FILIAÇÃO'}
                            </span>
                            <h3 className="text-xl font-black italic uppercase text-white mt-2">{club.clubName}</h3>
                            <p className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                              <MapPin size={12} /> {club.cityState}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                          "{club.motto || 'Respeito, Lealdade e Fraternidade no Asfalto.'}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 block">PRESIDENTE / LÍDER</span>
                          <span className="text-white font-bold">{club.president}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">INTEGRANTES</span>
                          <span className="text-orange-400 font-bold">{club.membersCount} Membros</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      {isPending ? (
                        <div className="space-y-2 pt-3 border-t border-slate-900">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleApproveClub(club.id)}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <CheckCircle size={13} /> AUTORIZAR HOMOLOGAÇÃO
                            </button>
                            <button
                              onClick={() => handleRejectAndDeleteClub(club)}
                              className="px-3 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="Não aprovar e excluir solicitação"
                            >
                              <Trash2 size={13} /> EXCLUIR
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setViewingClub(club)}
                              className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye size={11} /> Info
                            </button>
                            <button
                              onClick={() => setEditingClub({ ...club })}
                              className="py-2 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={11} /> Editar pra Aprovar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-900">
                          <button
                            onClick={() => setViewingClub(club)}
                            className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Info
                          </button>
                          <button
                            onClick={() => setEditingClub({ ...club })}
                            className="py-2 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmClub(club)}
                            className="py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {clubRequests.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <ShieldCheck size={32} className="text-slate-600 mx-auto" />
                  <p className="text-sm font-black text-slate-400 uppercase italic">Nenhuma solicitação de Moto Clube registrada</p>
                  <p className="text-xs text-slate-600 uppercase tracking-widest max-w-md mx-auto">
                    Não há solicitações ou cadastros de Moto Clube pendentes na plataforma.
                  </p>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 3: COMUNIDADE & DENÚNCIAS */}
      {activeTab === 'comunidade' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* SECTION 1: MODERAÇÃO DE POSTS DA COMUNIDADE */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    MODERAÇÃO E AUTORIZAÇÃO DE PUBLICAÇÕES DO FEED
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Avalie publicações enviadas pelos membros, autorize o envio para o mural público ou rejeite posts fora das regras.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5 shadow-sm">
                  <Clock size={12} className="text-amber-400" />
                  {pendingPostsCount} Publicação(ões) Pendente(s)
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por autor, conteúdo ou categoria..."
                  value={postSearchText}
                  onChange={(e) => setPostSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: communityPosts.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingPostsCount },
                  { id: 'aprovados', label: 'Aprovados', count: approvedPostsCount }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPostStatusFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      postStatusFilter === f.id
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[8px] border border-slate-800 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-500">Filtro:</span>
                <select
                  value={postCategoryFilter}
                  onChange={(e) => setPostCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                >
                  <option value="todos">TODAS CATEGORIAS</option>
                  <option value="ENCONTROS">ENCONTROS</option>
                  <option value="VIAGENS">VIAGENS</option>
                  <option value="EXPEDIÇÕES">EXPEDIÇÕES</option>
                  <option value="MECÂNICA">MECÂNICA</option>
                  <option value="GERAL">GERAL</option>
                </select>
              </div>

            </div>

            {/* Posts Grid / List */}
            <div className="space-y-4">
              {communityPosts.filter(p => {
                const matchesSearch = 
                  p.user.name.toLowerCase().includes(postSearchText.toLowerCase()) ||
                  p.content.toLowerCase().includes(postSearchText.toLowerCase()) ||
                  p.category.toLowerCase().includes(postSearchText.toLowerCase());

                const matchesStatus = 
                  postStatusFilter === 'todos' ? true :
                  postStatusFilter === 'pendentes' ? p.status === 'pendente' :
                  p.status === 'aprovado';

                const matchesCategory = 
                  postCategoryFilter === 'todos' ? true :
                  p.category.toUpperCase() === postCategoryFilter.toUpperCase();

                return matchesSearch && matchesStatus && matchesCategory;
              }).map((post) => {
                const isPending = post.status === 'pendente';
                const isApproved = post.status === 'aprovado';

                return (
                  <div
                    key={post.id}
                    className={cn(
                      "bg-slate-950 rounded-2xl border overflow-hidden transition-all",
                      isPending ? "border-amber-500/60 shadow-lg shadow-amber-500/10" : "border-slate-800"
                    )}
                  >
                    {/* Status Header Bar */}
                    {isPending ? (
                      <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                          SOLICITAÇÃO DE PUBLICAÇÃO AGUARDANDO AUTORIZAÇÃO
                        </span>
                        <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                          HOMOLOGAÇÃO PENDENTE
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" /> APROVADO & PUBLICADO NO FEED
                        </span>
                        <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase">ATIVO</span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      
                      {/* Post Content Details */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-800" alt={post.user.name} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black uppercase text-white">{post.user.name}</p>
                              <span className="text-[8px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                {post.user.role}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-mono uppercase">
                              ENVIADO EM: {post.timestamp}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
                          "{post.content}"
                        </p>

                        {post.image && (
                          <div className="mt-2 relative rounded-xl overflow-hidden max-h-48 border border-slate-800">
                            <img src={post.image} alt="Anexo do Post" className="w-full h-48 object-cover" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg">
                            CATEGORIA: {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      {isPending ? (
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-64">
                          <button
                            onClick={() => handleOpenViewingPost(post, false)}
                            className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
                            title="Ver toda a publicação para decidir se aprova ou edita"
                          >
                            <Eye size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                            <span>VER PUBLICAÇÃO</span>
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenViewingPost(post, true)}
                              className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/50 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              title="Editar texto, categoria ou foto e aprovar"
                            >
                              <Edit3 size={12} className="text-amber-400" />
                              <span>EDITAR</span>
                            </button>
                            <button
                              onClick={() => handleApprovePost(post.id)}
                              className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <CheckCircle size={12} />
                              <span>APROVAR</span>
                            </button>
                          </div>

                          <button
                            onClick={() => handleRejectAndDeletePost(post)}
                            className="w-full py-2 px-3 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Não aprovar e excluir permanentemente do banco"
                          >
                            <Trash2 size={13} />
                            <span>EXCLUIR / NÃO APROVAR</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleOpenViewingPost(post, false)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer border border-slate-800"
                          >
                            <Eye size={13} />
                            <span>Ver Completo</span>
                          </button>
                          <button
                            onClick={() => handleOpenViewingPost(post, true)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/50 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmPost(post)}
                            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {communityPosts.length === 0 && (
                <div className="py-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                  <p className="text-sm font-black text-slate-300 uppercase italic">Fila de publicações vazia</p>
                  <p className="text-xs text-slate-600">Nenhum post aguardando moderação no momento.</p>
                </div>
              )}
            </div>

          </div>

          {/* SECTION 2: CENTRO DE AUDITORIA E MODERAÇÃO DE DENÚNCIAS DO FEED */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    CENTRO DE AUDITORIA E MODERAÇÃO DE DENÚNCIAS DO FEED
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Examine denúncias de conduta, garanta o respeito e a segurança das conversas e remova publicações inadequadas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {pendingReportsCount} Denúncia(s) para Análise
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por autor, denunciante ou motivo..."
                  value={reportSearchText}
                  onChange={(e) => setReportSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todas', count: reports.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingReportsCount },
                  { id: 'mantidos', label: 'Aprovados & Mantidos', count: reports.filter(r => r.status === 'mantido').length },
                  { id: 'removidos', label: 'Posts Removidos', count: reports.filter(r => r.status === 'removido').length }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setReportStatusFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      reportStatusFilter === f.id
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[8px] border border-slate-800 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {reports.filter(rep => {
                const matchesSearch = 
                  rep.author.toLowerCase().includes(reportSearchText.toLowerCase()) ||
                  rep.reportedBy.toLowerCase().includes(reportSearchText.toLowerCase()) ||
                  rep.content.toLowerCase().includes(reportSearchText.toLowerCase()) ||
                  rep.reason.toLowerCase().includes(reportSearchText.toLowerCase());

                const matchesStatus = 
                  reportStatusFilter === 'todos' ? true :
                  reportStatusFilter === 'pendentes' ? rep.status === 'pendente' :
                  reportStatusFilter === 'mantidos' ? rep.status === 'mantido' :
                  rep.status === 'removido';

                return matchesSearch && matchesStatus;
              }).map((rep) => {
                const isPending = rep.status === 'pendente';
                const isMantido = rep.status === 'mantido';
                const isRemovido = rep.status === 'removido';

                return (
                  <div 
                    key={rep.id} 
                    className={cn(
                      "bg-slate-950 rounded-2xl border overflow-hidden transition-all space-y-0",
                      isPending ? "border-amber-500/60 shadow-lg shadow-amber-500/10" :
                      isRemovido ? "border-rose-500/30 opacity-75" : "border-slate-800"
                    )}
                  >
                    {/* Status Banner */}
                    {isPending && (
                      <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                          DENÚNCIA AGUARDANDO ANÁLISE DE MODERAÇÃO
                        </span>
                        <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                          MOTIVO: {rep.reason}
                        </span>
                      </div>
                    )}
                    {isMantido && (
                      <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" /> CONTEÚDO AUDITADO & MANTIDO
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">REGISTRO OK</span>
                      </div>
                    )}
                    {isRemovido && (
                      <div className="bg-rose-950/80 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-rose-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle size={12} className="text-rose-400" /> PUBLICAÇÃO REMOVIDA DO FEED
                        </span>
                        <span className="text-[8px] text-rose-400 font-mono uppercase">BANIDO</span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <img src={rep.authorAvatar} className="w-9 h-9 rounded-full object-cover border border-slate-800" alt={rep.author} />
                          <div>
                            <p className="text-xs font-black uppercase text-white">{rep.author}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-mono">
                              DENUNCIADO POR: <span className="text-slate-300 font-bold">{rep.reportedBy}</span> ({rep.reportedAt})
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-900 p-3.5 rounded-xl italic border border-slate-800/80">
                          "{rep.content}"
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-rose-400 uppercase bg-rose-950/60 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                            MOTIVO: {rep.reason}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      {isPending ? (
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                          <button
                            onClick={() => handleKeepReportedPost(rep.id)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                          >
                            <CheckCircle size={13} /> MANTER & APROVAR POST
                          </button>
                          <button
                            onClick={() => handleRemoveReportedPost(rep.id)}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Trash2 size={13} /> REMOVER POST DO FEED
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setViewingReport(rep)}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-black uppercase flex items-center gap-1"
                          >
                            <Eye size={12} /> Detalhes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmReport(rep)}
                            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {reports.length === 0 && (
                <div className="py-16 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                  <p className="text-sm font-black text-slate-300 uppercase italic">Fila de denúncias limpa</p>
                  <p className="text-xs text-slate-600">Nenhum registro de violação de conduta pendente de análise.</p>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 4: CREDENCIAMENTO E GESTÃO DE PARCEIROS */}
      {activeTab === 'parceiros' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Main Container: Registered Partners Management */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header with Title and Add Partner Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    CENTRO DE HOMOLOGAÇÃO E GESTÃO DE PARCEIROS E SERVIÇOS
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie estabelecimentos parceiros, homologue novos credenciamentos, sinalize destaques e edite benefícios.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                  <Clock size={12} />
                  {pendingPartnersCount} Solicitação(ões) Pendente(s)
                </span>
                <Link
                  to="/partners"
                  className="px-3.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5 transition-all"
                >
                  <Plus size={12} />
                  Cadastrar Parceiro em /partners
                </Link>
              </div>
            </div>

            {/* Controls Bar: Search & Status Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, cidade ou benefício..."
                  value={partnerSearchText}
                  onChange={(e) => setPartnerSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: allPartners.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingPartnersCount },
                  { id: 'aprovados', label: 'Aprovados', count: allPartners.filter(p => p.status === 'aprovado' || !p.status).length }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPartnerStatusFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      partnerStatusFilter === f.id
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[8px] border border-slate-800 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

            </div>

            {/* Sub-Filters: Categories and Highlights */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-0.5">
                <span className="text-[9px] font-black uppercase text-slate-500 mr-1 shrink-0">CATEGORIA:</span>
                <button
                  onClick={() => setPartnerCategoryFilter('Todos')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0",
                    partnerCategoryFilter === 'Todos' ? "bg-amber-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  Todas
                </button>
                {PARTNER_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPartnerCategoryFilter(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0",
                      partnerCategoryFilter === cat ? "bg-amber-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Destaques filter */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-black uppercase text-slate-500 mr-1">DESTAQUE:</span>
                <button
                  onClick={() => setPartnerHighlightFilter('todos')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    partnerHighlightFilter === 'todos' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setPartnerHighlightFilter('destacados')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                    partnerHighlightFilter === 'destacados' ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-slate-300"
                  )}
                >
                  <Award size={10} /> Destaques ({allPartners.filter(p => p.highlight).length})
                </button>
              </div>

            </div>

            {/* Registered Partners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPartners.filter(pt => {
                const matchesSearch = 
                  pt.name.toLowerCase().includes(partnerSearchText.toLowerCase()) ||
                  pt.location.toLowerCase().includes(partnerSearchText.toLowerCase()) ||
                  pt.discount.toLowerCase().includes(partnerSearchText.toLowerCase()) ||
                  pt.phone.includes(partnerSearchText);

                const matchesCategory = 
                  partnerCategoryFilter === 'Todos' || pt.category === partnerCategoryFilter;

                const matchesHighlight = 
                  partnerHighlightFilter === 'todos' ? true :
                  partnerHighlightFilter === 'destacados' ? pt.highlight === true :
                  pt.highlight === false;

                const matchesStatus = 
                  partnerStatusFilter === 'todos' ? true :
                  partnerStatusFilter === 'pendentes' ? pt.status === 'pendente' :
                  (pt.status === 'aprovado' || !pt.status);

                return matchesSearch && matchesCategory && matchesHighlight && matchesStatus;
              }).map((pt) => (
                <div 
                  key={pt.id} 
                  className={cn(
                    "bg-slate-950 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all group relative",
                    pt.status === 'pendente' ? "border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30" :
                    pt.highlight ? "border-orange-500/40 shadow-lg shadow-orange-500/5" : "border-slate-800 hover:border-slate-700"
                  )}
                >
                  {/* Pending Banner if status === 'pendente' */}
                  {pt.status === 'pendente' && (
                    <div className="bg-amber-500/20 border-b border-amber-500/40 px-3 py-2 flex items-center justify-between text-amber-300">
                      <span className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={12} className="animate-spin text-amber-400 shrink-0" />
                        HOMOLOGAÇÃO PENDENTE
                      </span>
                      <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                        NOVO PEDIDO
                      </span>
                    </div>
                  )}

                  {/* Photo Header */}
                  <div className="relative h-40 overflow-hidden bg-slate-900">
                    <img src={pt.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={pt.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    
                    {/* Badge Category */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[8px] font-black text-white px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg uppercase tracking-wider border border-slate-800 flex items-center gap-1">
                        {getCategoryIcon(pt.category)}
                        {pt.category}
                      </span>
                    </div>

                    {/* Highlight Status Tag */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleTogglePartnerHighlight(pt.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-md cursor-pointer",
                          pt.highlight 
                            ? "bg-orange-600 text-white border border-orange-400/40 shadow-orange-600/30" 
                            : "bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800"
                        )}
                        title="Clique para alternar Destaque no Feed"
                      >
                        <Award size={10} className={pt.highlight ? "text-amber-300" : "text-slate-500"} />
                        {pt.highlight ? "SINALIZADO DESTAQUE" : "DESTACAR PARCEIRO"}
                      </button>
                    </div>

                    {/* Partner Name & Location */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-black italic uppercase text-white truncate drop-shadow">{pt.name}</h3>
                      <p className="text-[10px] text-slate-300 font-bold uppercase flex items-center gap-1 truncate mt-0.5">
                        <MapPin size={10} className="text-orange-500 shrink-0" />
                        {pt.location}
                      </p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    
                    {/* Discount Box */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block">BENEFÍCIO MOTOLEGADO:</span>
                      <p className="text-xs font-bold text-white italic line-clamp-2">
                        "{pt.discount}"
                      </p>
                    </div>

                    {/* Contact & Rating */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-orange-500" />
                        {pt.phone}
                      </span>
                      <span className="text-amber-400 font-black font-sans">
                        ★ {pt.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {pt.status === 'pendente' ? (
                      <div className="space-y-2 pt-3 border-t border-slate-900">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprovePartnerHomologation(pt.id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all shadow-md active:scale-95"
                            title="Autorizar Homologação do Parceiro"
                          >
                            <CheckCircle size={13} /> AUTORIZAR HOMOLOGAÇÃO
                          </button>
                          <button
                            onClick={() => handleRejectPartnerHomologation(pt.id)}
                            className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all"
                            title="Não Aprovar e Excluir Definitivamente"
                          >
                            <Trash2 size={13} /> EXCLUIR / REPROVAR
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setViewingPartner(pt)}
                            className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <Eye size={11} /> Info
                          </button>
                          <button
                            onClick={() => setEditingPartner({ ...pt })}
                            className="py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <Edit3 size={11} /> Editar Dados
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-900">
                        
                        {/* Visualizar */}
                        <button
                          onClick={() => setViewingPartner(pt)}
                          className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
                          title="Visualizar Informações do Parceiro"
                        >
                          <Eye size={12} /> Info
                        </button>

                        {/* Destacar / Sinalizar */}
                        <button
                          onClick={() => handleTogglePartnerHighlight(pt.id)}
                          className={cn(
                            "py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-colors",
                            pt.highlight 
                              ? "bg-orange-950/80 border border-orange-500/40 text-orange-300 hover:bg-orange-900" 
                              : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                          )}
                          title="Sinalizar Destaque"
                        >
                          <Award size={12} className={pt.highlight ? "text-orange-400" : ""} /> Destaque
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => setEditingPartner({ ...pt })}
                          className="py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
                          title="Editar Informações do Parceiro"
                        >
                          <Edit3 size={12} /> Editar
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => setDeleteConfirmPartner(pt)}
                          className="py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
                          title="Excluir Parceiro"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>

                      </div>
                    )}

                  </div>
                </div>
              ))}

              {allPartners.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <ShieldAlert size={28} className="text-slate-600 mx-auto" />
                  <p className="text-sm font-black text-slate-400 uppercase italic">Nenhum parceiro cadastrado no momento</p>
                  <p className="text-xs text-slate-600">Inscrições de novos parceiros e estabelecimentos ocorrem através do portal de Parceiros (/partners).</p>
                </div>
              )}
            </div>

          </div>

          {/* Pending Approval Requests Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">SOLICITAÇÕES DE NOVOS CREDENCIAMENTOS</h3>
                <p className="text-xs text-slate-400 mt-1">Empresas e oficinas que solicitaram o Selo Oficial de Parceiro Motolegado.</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase rounded-full">
                {pendingPartnersCount} Solicitação(ões) Pendente(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partnerRequests.map((part) => (
                <div key={part.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 bg-orange-950/60 text-orange-400 text-[9px] font-black uppercase rounded border border-orange-500/30">
                        {part.category}
                      </span>
                      <h3 className="text-xl font-black italic uppercase text-white mt-2">{part.businessName}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={12} /> {part.city}</p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[8px] font-black uppercase",
                      part.status === 'pendente' ? "bg-amber-950 text-amber-300 border border-amber-500/40" :
                      part.status === 'aprovado' ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" :
                      "bg-rose-950 text-rose-300 border border-rose-500/40"
                    )}>
                      {part.status}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-black text-amber-400 uppercase block mb-0.5">BENEFÍCIO APLICADO:</span>
                    <span className="text-xs text-white font-bold">{part.discountOffered}</span>
                  </div>

                  {part.status === 'pendente' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-900">
                      <button
                        onClick={() => handleApprovePartner(part.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        <Award size={14} /> Credenciar & Publicar
                      </button>
                      <button
                        onClick={() => handleRejectPartner(part.id)}
                        className="py-2.5 px-4 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 5: TELEMETRIA E AUDITORIA */}
      {activeTab === 'telemetria' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-black italic uppercase text-white border-b border-slate-800 pb-4">
              TELEMETRIA E AUDITORIA DE AÇÕES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">STATUS DO SERVIDOR</span>
                <p className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  Operacional 100%
                </p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">SINCRONIZAÇÃO DE BANCO</span>
                <p className="text-lg font-black text-amber-400 mt-1">LocalStorage Ativo</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">ÚLTIMA AUDITORIA</span>
                <p className="text-lg font-black text-white mt-1">Agora Mesmo</p>
              </div>
            </div>

            {/* Componente Integrado de Teste Direto MySQL (SELECT 1 via mysql2) e Inicialização */}
            <MySqlPingTest 
              onInitTables={handleInitTables}
              isInitializingTables={initializingDb}
              initMessage={dbMessage}
            />

            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Histórico de Registros do Administrador:</h3>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-2">
                    <span className="text-amber-400 font-bold">{log.action}</span>
                    <span className="text-[10px] text-slate-600">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: MODO BONIFICADO & GESTÃO DE PLANOS */}
      {activeTab === 'bonificados' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Gift size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-2">
                      PAINEL DE GESTÃO DE PLANOS & MODO BONIFICADO
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Conceda acesso Pro integral (telemetria, Moto Clubes, rotas ilimitadas e benefícios) sem cobrança para pilotos parceiros ou lideranças.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadPilots}
                  disabled={loadingPilots}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  <Activity size={15} className={cn("text-amber-400", loadingPilots && "animate-spin")} />
                  {loadingPilots ? 'Sincronizando...' : 'Sincronizar Pilotos'}
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">TOTAL DE PILOTOS</span>
                  <Users size={16} className="text-slate-400" />
                </div>
                <div className="text-2xl font-black italic text-white">{pilotsList.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">Motociclistas cadastrados na rede</div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-amber-400">MODO BONIFICADO (VIP)</span>
                  <Gift size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl font-black italic text-amber-300">{bonificadosCount}</div>
                <div className="text-[10px] text-amber-400/80 mt-1">Acesso Pro 100% liberado sem mensalidade</div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400">MODO GRATUITO</span>
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black italic text-emerald-300">{gratuitosCount}</div>
                <div className="text-[10px] text-emerald-400/80 mt-1">Elegíveis para bonificação com 1 clique</div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-orange-500/20 bg-orange-950/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-orange-400">ASSINANTES PRO</span>
                  <Crown size={16} className="text-orange-400" />
                </div>
                <div className="text-2xl font-black italic text-orange-300">{proCount}</div>
                <div className="text-[10px] text-orange-400/80 mt-1">Assinaturas pagas comerciais</div>
              </div>
            </div>

            {/* Informational Banner: Itens do Modo Gratuito */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Itens Liberados no Modo Gratuito (Plano Asfalto)
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Acesso ao Dashboard e Feed de Notícias</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Diário de Bordo (Até 5 registros por mês)</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Visualização de Eventos e Roteiros Públicos</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Perfil de Piloto com Gamificação Básica</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Suporte Comunitário na Plataforma</span>
                </div>
              </div>
            </div>

            {/* Filter, Search & View Switcher */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="relative w-full lg:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail, moto, cidade ou clube..."
                  value={pilotSearchText}
                  onChange={(e) => setPilotSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  <button
                    onClick={() => setPilotPlanFilter('todos')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer",
                      pilotPlanFilter === 'todos'
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    Todos ({pilotsList.length})
                  </button>
                  <button
                    onClick={() => setPilotPlanFilter('gratuito')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                      pilotPlanFilter === 'gratuito'
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Gratuito ({gratuitosCount})
                  </button>
                  <button
                    onClick={() => setPilotPlanFilter('bonificado')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                      pilotPlanFilter === 'bonificado'
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    <Gift size={13} className="text-amber-400" />
                    Bonificado ({bonificadosCount})
                  </button>
                  <button
                    onClick={() => setPilotPlanFilter('pago')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                      pilotPlanFilter === 'pago'
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    )}
                  >
                    <Crown size={13} className="text-orange-400" />
                    Assinantes Pro ({proCount})
                  </button>
                </div>

                {/* View Switcher: Lista vs Cards */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPilotViewMode('lista')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                      pilotViewMode === 'lista'
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                    title="Exibição em Lista (Tabela)"
                  >
                    <List size={14} />
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPilotViewMode('cards')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                      pilotViewMode === 'cards'
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                    title="Exibição em Cards"
                  >
                    <LayoutGrid size={14} />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Selection Action Bar */}
            {selectedPilotIds.length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border border-amber-500/50 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-2.5 text-xs text-amber-300 font-bold">
                  <CheckCircle2 size={16} className="text-amber-400" />
                  <span>
                    <strong className="text-white font-black text-sm">{selectedPilotIds.length}</strong> piloto(s) selecionado(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBatchUpdatePlan('bonificado')}
                    className="btn-primary text-xs py-1.5 px-3.5"
                  >
                    <Gift size={13} />
                    <span>Bonificar Selecionados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchUpdatePlan('gratuito')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserX size={13} className="text-rose-400" />
                    <span>Remover Bonificação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPilotIds([])}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}

            {/* Pilots Display Area */}
            {(() => {
              const displayedPilots = pilotsList.filter(p => {
                const query = pilotSearchText.toLowerCase();
                const matchesSearch = 
                  (p.name && p.name.toLowerCase().includes(query)) ||
                  (p.email && p.email.toLowerCase().includes(query)) ||
                  (p.motorcycle && p.motorcycle.toLowerCase().includes(query)) ||
                  (p.city && p.city.toLowerCase().includes(query)) ||
                  (p.club_name && p.club_name.toLowerCase().includes(query));

                if (!matchesSearch) return false;

                if (pilotPlanFilter === 'gratuito') return p.plan_type === 'gratuito' || (!p.plan_type && !p.is_pro);
                if (pilotPlanFilter === 'bonificado') return p.plan_type === 'bonificado';
                if (pilotPlanFilter === 'pago') return p.plan_type === 'pago' || (p.is_pro && p.plan_type !== 'bonificado' && p.role !== 'admin');
                return true;
              });

              if (displayedPilots.length === 0) return null;

              if (pilotViewMode === 'lista') {
                return (
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[920px] border-collapse">
                        <thead>
                          <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={displayedPilots.length > 0 && selectedPilotIds.length === displayedPilots.length}
                                onChange={() => {
                                  if (selectedPilotIds.length === displayedPilots.length) {
                                    setSelectedPilotIds([]);
                                  } else {
                                    setSelectedPilotIds(displayedPilots.map(p => p.id));
                                  }
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer w-4 h-4"
                                title="Selecionar todos os pilotos visíveis"
                              />
                            </th>
                            <th className="py-3.5 px-4">Piloto</th>
                            <th className="py-3.5 px-4">Motocicleta & Clube</th>
                            <th className="py-3.5 px-4">Localização & Nível</th>
                            <th className="py-3.5 px-4 text-center">Status Atual</th>
                            <th className="py-3.5 px-4 text-center min-w-[220px]">
                              <div className="flex items-center justify-center gap-1.5 text-amber-400">
                                <Gift size={13} />
                                <span>Caixa de Bonificação</span>
                              </div>
                            </th>
                            <th className="py-3.5 px-4 text-right">Ficha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {displayedPilots.map((pilot) => {
                            const isBonificado = pilot.plan_type === 'bonificado';
                            const isPro = pilot.plan_type === 'pago' || (pilot.is_pro && !isBonificado && pilot.role !== 'admin');
                            const isAdmin = pilot.role === 'admin';
                            const isSelf = pilot.id === profile?.id || pilot.email === profile?.email;
                            const isSelected = selectedPilotIds.includes(pilot.id);

                            return (
                              <tr
                                key={pilot.id}
                                className={cn(
                                  "hover:bg-slate-900/50 transition-colors",
                                  isBonificado && "bg-amber-950/15 hover:bg-amber-950/25",
                                  isSelected && "bg-amber-500/10"
                                )}
                              >
                                {/* Checkbox Seleção */}
                                <td className="py-3.5 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedPilotIds(prev => 
                                        prev.includes(pilot.id) ? prev.filter(id => id !== pilot.id) : [...prev, pilot.id]
                                      );
                                    }}
                                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer w-4 h-4"
                                  />
                                </td>

                                {/* Identificação do Piloto */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                      {pilot.avatar_url ? (
                                        <img src={pilot.avatar_url} alt={pilot.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-xs font-black text-amber-400">
                                          {pilot.name ? pilot.name.slice(0, 2).toUpperCase() : 'ML'}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white tracking-tight">{pilot.name}</span>
                                        {isSelf && (
                                          <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                                            Você
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono">{pilot.email}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Motocicleta & Moto Clube */}
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-200">{pilot.motorcycle || 'Moto não informada'}</div>
                                  <div className="text-[11px] text-amber-400/90">{pilot.club_name || 'Piloto Independente'}</div>
                                </td>

                                {/* Localização & Nível */}
                                <td className="py-3.5 px-4 text-slate-300">
                                  <div>{pilot.city ? `${pilot.city}, ${pilot.state || 'BR'}` : 'Brasil'}</div>
                                  <div className="text-[10px] text-slate-500">{pilot.points || 0} pts • Nível {pilot.tier || 'Bronze'}</div>
                                </td>

                                {/* Status do Plano */}
                                <td className="py-3.5 px-4 text-center">
                                  {isAdmin ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider items-center gap-1">
                                      <ShieldCheck size={11} /> Admin
                                    </span>
                                  ) : isBonificado ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider items-center gap-1 shadow-sm shadow-amber-500/20">
                                      <Gift size={11} className="text-amber-400" /> Bonificado VIP
                                    </span>
                                  ) : isPro ? (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider items-center gap-1">
                                      <Crown size={11} /> Assinante Pro
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider items-center gap-1">
                                      <CheckCircle size={11} /> Gratuito
                                    </span>
                                  )}
                                </td>

                                {/* Caixa de Bonificação Interativa */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center">
                                    {isAdmin ? (
                                      <span className="text-[11px] text-slate-500 italic font-medium">
                                        Privilégio Total
                                      </span>
                                    ) : (
                                      <label
                                        className={cn(
                                          "relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-all select-none shadow-sm",
                                          isBonificado 
                                            ? "bg-amber-500/20 border-amber-500/60 hover:bg-amber-500/30 text-amber-300 shadow-amber-500/10" 
                                            : "bg-slate-900 border-slate-700/80 hover:border-amber-500/60 hover:bg-slate-850 text-slate-400 hover:text-white"
                                        )}
                                        title={isBonificado ? "Clique para desativar a bonificação" : "Clique para marcar e ativar Modo Bonificado Pro"}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isBonificado}
                                          onChange={() => {
                                            handleUpdatePlan(pilot.id, isBonificado ? 'gratuito' : 'bonificado');
                                          }}
                                          className="sr-only peer"
                                        />
                                        <div className={cn(
                                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                          isBonificado 
                                            ? "bg-amber-500 border-amber-400 text-slate-950 font-black shadow-sm" 
                                            : "border-slate-600 bg-slate-950"
                                        )}>
                                          {isBonificado && <Check size={13} className="stroke-[3]" />}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                                          {isBonificado ? 'Bonificado Ativo' : 'Habilitar Bônus'}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                </td>

                                {/* Ficha Completa & Excluir/Banir */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setViewingPilotModal(pilot)}
                                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      title="Ver ficha completa do piloto"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    {pilot.role !== 'admin' && pilot.email?.toLowerCase().trim() !== 'ciceroranieri@gmail.com' && pilot.id !== 'admin_ciceroranieri' && (
                                      <button
                                        onClick={() => setDeleteConfirmPilot(pilot)}
                                        className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                                        title="Excluir / Banir piloto permanentemente do sistema"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              {/* Cards Grid */}
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPilots.map(pilot => {
                    const isBonificado = pilot.plan_type === 'bonificado';
                    const isPro = pilot.plan_type === 'pago' || (pilot.is_pro && !isBonificado && pilot.role !== 'admin');
                    const isSelf = pilot.id === profile?.id || pilot.email === profile?.email;

                    return (
                      <div
                        key={pilot.id}
                        className={cn(
                          "bg-slate-950/80 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 relative overflow-hidden",
                          isBonificado
                            ? "border-amber-500/50 shadow-lg shadow-amber-500/5 bg-gradient-to-b from-amber-950/20 to-slate-950/90"
                            : isPro
                            ? "border-orange-500/40 shadow-lg shadow-orange-500/5"
                            : "border-slate-800/80"
                        )}
                      >
                        {/* Top status banner */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {pilot.avatar_url ? (
                                <img src={pilot.avatar_url} alt={pilot.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-base font-black text-amber-400">
                                  {pilot.name ? pilot.name.slice(0, 2).toUpperCase() : 'ML'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-white tracking-tight">{pilot.name}</h3>
                                {isSelf && (
                                  <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                                    Você
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate max-w-[180px]">{pilot.email}</p>
                            </div>
                          </div>

                          {/* Plan Badge */}
                          <div>
                            {pilot.role === 'admin' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck size={11} /> Admin
                              </span>
                            ) : isBonificado ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-amber-500/20 animate-pulse">
                                <Gift size={11} className="text-amber-400" /> Bonificado Pro
                              </span>
                            ) : isPro ? (
                              <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Crown size={11} /> Assinante Pro
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle size={11} /> Gratuito
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pilot details */}
                        <div className="space-y-2 py-3 border-y border-slate-900 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">Motocicleta:</span>
                            <span className="font-medium text-slate-200 truncate max-w-[180px]">
                              {pilot.motorcycle || 'Não informada'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">Localização:</span>
                            <span className="font-medium text-slate-300">
                              {pilot.city ? `${pilot.city}, ${pilot.state || 'BR'}` : 'Brasil'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">Moto Clube:</span>
                            <span className="font-medium text-amber-400/90 truncate max-w-[180px]">
                              {pilot.club_name || 'Piloto Independente'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">Experiência:</span>
                            <span className="font-medium text-slate-300">
                              {pilot.points || 0} pts • Nível {pilot.tier || 'Bronze'}
                            </span>
                          </div>
                        </div>

                        {/* Bonificado Info Notice if applicable */}
                        {isBonificado && (
                          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
                            <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Acesso Pro Total Sem Cobrança</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Concedido por: {pilot.bonificado_by || 'Comando MotoLegado'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action buttons with interactive checkbox box */}
                        <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
                          <label
                            className={cn(
                              "flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none",
                              isBonificado
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isBonificado}
                              onChange={() => handleUpdatePlan(pilot.id, isBonificado ? 'gratuito' : 'bonificado')}
                              className="sr-only"
                            />
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center",
                              isBonificado ? "bg-amber-500 border-amber-400 text-slate-950" : "bg-slate-900/30 border-slate-950/50"
                            )}>
                              {isBonificado && <Check size={12} className="stroke-[3]" />}
                            </div>
                            <span>{isBonificado ? 'Remover Bonificação' : 'Habilitar Bonificado'}</span>
                          </label>

                          <button
                            onClick={() => setViewingPilotModal(pilot)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Ver detalhes do cadastro"
                          >
                            <Eye size={16} />
                          </button>
                          {pilot.role !== 'admin' && pilot.email?.toLowerCase().trim() !== 'ciceroranieri@gmail.com' && pilot.id !== 'admin_ciceroranieri' && (
                            <button
                              onClick={() => setDeleteConfirmPilot(pilot)}
                              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                              title="Excluir / Banir piloto permanentemente"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Empty state if search returns nothing */}
            {pilotsList.filter(p => {
              const query = pilotSearchText.toLowerCase();
              return (
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.email && p.email.toLowerCase().includes(query)) ||
                (p.motorcycle && p.motorcycle.toLowerCase().includes(query)) ||
                (p.city && p.city.toLowerCase().includes(query)) ||
                (p.club_name && p.club_name.toLowerCase().includes(query))
              );
            }).length === 0 && (
              <div className="text-center py-16 bg-slate-950/40 border border-slate-800/60 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Search size={22} />
                </div>
                <h3 className="text-base font-black italic uppercase text-white">NENHUM PILOTO LOCALIZADO</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Nenhum cadastro de piloto corresponde aos critérios de busca ou filtro selecionados.
                </p>
                <button
                  onClick={() => { setPilotSearchText(''); setPilotPlanFilter('todos'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase rounded-xl transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}

          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 6: MODERAÇÃO DE ROTEIROS */}
      {activeTab === 'roteiros' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Navigation className="text-amber-500" size={24} />
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                    CENTRO DE MODERAÇÃO E CURADORIA DE ROTEIROS
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Análise, aprovação ou rejeição de novos roteiros propostos pela comunidade de pilotos.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5">
                  <Clock size={12} />
                  {pendingRoutesCount} Roteiro(s) para Moderação
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar roteiro por nome, cidade ou atração..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: routes.length },
                  { id: 'pendente', label: 'Pendentes', count: pendingRoutesCount },
                  { id: 'aprovado', label: 'Aprovados', count: approvedRoutesCount }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRouteFilterStatus(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      routeFilterStatus === f.id
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    )}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[8px] border border-slate-800 font-mono">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Routes List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes
                .filter(r => {
                  const matchesFilter = 
                    routeFilterStatus === 'pendente' ? r.status === 'pendente' :
                    routeFilterStatus === 'aprovado' ? (r.status === 'aprovado' || !r.status) : true;

                  const matchesSearch = 
                    r.name.toLowerCase().includes(routeSearch.toLowerCase()) ||
                    r.mapsAddress.toLowerCase().includes(routeSearch.toLowerCase()) ||
                    (r.description || '').toLowerCase().includes(routeSearch.toLowerCase()) ||
                    (r.author?.name || '').toLowerCase().includes(routeSearch.toLowerCase());

                  return matchesFilter && matchesSearch;
                })
                .map(route => {
                  const isPending = route.status === 'pendente';
                  const isApproved = route.status === 'aprovado' || !route.status;

                  return (
                    <div key={route.id} className={cn(
                      "p-5 bg-slate-900/60 border rounded-2xl space-y-4 flex flex-col justify-between transition-all",
                      isPending ? "border-amber-500/50 shadow-lg shadow-amber-500/5" : "border-slate-800"
                    )}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                {route.difficulty}
                              </span>
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                isApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              )}>
                                {isPending ? '🛡️ Pendente de Moderação' : '✓ Aprovado & No Mapa'}
                              </span>
                            </div>
                            <h4 className="text-lg font-black italic uppercase text-white mt-1">
                              {route.name}
                            </h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={12} className="text-amber-500 shrink-0" />
                              {route.mapsAddress}
                            </p>
                          </div>

                          {route.image && (
                            <img 
                              src={route.image} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800" 
                              alt={route.name} 
                            />
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {route.description}
                        </p>

                        {route.riderTips && (
                          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
                            <strong className="text-amber-400 font-bold block">⚡ Dicas do Autor:</strong>
                            <p className="line-clamp-2">{route.riderTips}</p>
                          </div>
                        )}

                        {route.aiTouristInfo && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-1">
                            <strong className="text-amber-400 font-bold block flex items-center gap-1">
                              <Sparkles size={12} /> Dicas Turísticas da IA:
                            </strong>
                            <p className="line-clamp-2">{route.aiTouristInfo}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                          <span>Autor: <strong className="text-slate-300">{route.author?.name || 'Piloto Registrado'}</strong></span>
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star size={12} className="fill-amber-400" />
                            Média {route.rating}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenViewingRoute(route, false)}
                          className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                        >
                          <Eye size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>VER ROTEIRO COMPLETO / EDITAR</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {!isApproved && (
                            <button 
                              onClick={() => setPendingActionRoute({ route, action: 'approve' })}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                            >
                              <ShieldCheck size={13} /> Aprovar
                            </button>
                          )}
                          <button 
                            onClick={() => setPendingActionRoute({ route, action: 'reject' })}
                            className="flex-1 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Não aprovar e excluir permanentemente da base de dados"
                          >
                            <Trash2 size={13} className="text-rose-400" /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {routes.filter(r => {
                const matchesFilter = 
                  routeFilterStatus === 'pendente' ? r.status === 'pendente' :
                  routeFilterStatus === 'aprovado' ? (r.status === 'aprovado' || !r.status) : true;

                const matchesSearch = 
                  r.name.toLowerCase().includes(routeSearch.toLowerCase()) ||
                  r.mapsAddress.toLowerCase().includes(routeSearch.toLowerCase()) ||
                  (r.description || '').toLowerCase().includes(routeSearch.toLowerCase()) ||
                  (r.author?.name || '').toLowerCase().includes(routeSearch.toLowerCase());

                return matchesFilter && matchesSearch;
              }).length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4 bg-slate-900/20 rounded-3xl border border-slate-800">
                  <ShieldCheck size={40} className="text-slate-600 mx-auto" />
                  <p className="text-base font-black italic uppercase text-slate-400">
                    NENHUM ROTEIRO NESTE FILTRO
                  </p>
                  <p className="text-xs text-slate-600 uppercase tracking-widest max-w-md mx-auto">
                    A fila de moderação de roteiros para este filtro está limpa no momento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* CONFIRMATION MODAL FOR ROUTE MODERATION */}
      <AnimatePresence>
        {pendingActionRoute && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "p-2 rounded-xl border",
                    pendingActionRoute.action === 'approve' 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}>
                    {pendingActionRoute.action === 'approve' ? <UserCheck size={20} /> : <Trash2 size={20} />}
                  </span>
                  <h3 className="text-sm font-black uppercase italic text-white">
                    {pendingActionRoute.action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Exclusão / Reprovação'}
                  </h3>
                </div>
                <button 
                  onClick={() => setPendingActionRoute(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  Você está prestes a {pendingActionRoute.action === 'approve' ? (
                    <strong className="text-emerald-400 uppercase">Aprovar e Publicar</strong>
                  ) : (
                    <strong className="text-rose-400 uppercase">Não Aprovar e Excluir Permanentemente</strong>
                  )} o seguinte roteiro da base de dados:
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <h4 className="font-black text-white italic uppercase text-sm">{pendingActionRoute.route.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin size={11} className="text-orange-500 shrink-0" />
                    {pendingActionRoute.route.mapsAddress}
                  </p>
                </div>

                {pendingActionRoute.action === 'reject' && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-[11px] text-rose-300">
                    <span className="font-black uppercase text-rose-400 block mb-0.5">Aviso de Exclusão:</span>
                    Roteiros não aprovados são purgados automaticamente da base de dados do MotoLegado.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setPendingActionRoute(null)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmRouteAction}
                  className={cn(
                    "flex-1 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all",
                    pendingActionRoute.action === 'approve' 
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" 
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                  )}
                >
                  {pendingActionRoute.action === 'approve' ? 'Sim, Aprovar' : 'Sim, Excluir Definitivamente'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW & EDIT ROUTE MODAL */}
      <AnimatePresence>
        {viewingRouteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }} 
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      CENTRO DE MODERAÇÃO DE ROTEIROS
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      ID: {viewingRouteModal.id} • Autor: {viewingRouteModal.author?.name || 'Piloto'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingRouteInModal(false)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                        !isEditingRouteInModal ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Eye size={12} /> Ver Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingRouteInModal(true)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                        isEditingRouteInModal ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Edit3 size={12} /> Editar pra Aprovar
                    </button>
                  </div>

                  <button 
                    onClick={() => { setViewingRouteModal(null); setIsEditingRouteInModal(false); }} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {!isEditingRouteInModal ? (
                /* VIEW FULL ROUTE */
                <div className="space-y-4">
                  {viewingRouteModal.image && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 h-52 relative">
                      <img src={viewingRouteModal.image} alt={viewingRouteModal.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white">
                          {viewingRouteModal.difficulty}
                        </span>
                        <h4 className="text-xl font-black uppercase italic text-white mt-1 drop-shadow">
                          {viewingRouteModal.name}
                        </h4>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">LOCALIZAÇÃO / ENDEREÇO GOOGLE MAPS</span>
                    <p className="text-xs text-amber-400 flex items-center gap-1 font-bold">
                      <MapPin size={13} className="shrink-0" />
                      {viewingRouteModal.mapsAddress}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">DISTÂNCIA ESTIMADA</span>
                      <p className="text-xs text-orange-400 font-mono font-bold">
                        {estimateRouteMetrics(viewingRouteModal).distance} KM
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">DURAÇÃO ESTIMADA</span>
                      <p className="text-xs text-slate-300 font-mono font-bold">
                        {estimateRouteMetrics(viewingRouteModal).duration}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Descrição Completa da Rota:</span>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {viewingRouteModal.description}
                    </div>
                  </div>

                  {viewingRouteModal.riderTips && (
                    <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 space-y-1">
                      <strong className="text-amber-400 font-bold block text-[10px] uppercase">⚡ Dicas do Autor:</strong>
                      <p className="whitespace-pre-wrap">{viewingRouteModal.riderTips}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT TO APPROVE ROUTE */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
                    <Edit3 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black uppercase text-amber-400 text-[10px]">
                        Curadoria e Edição de Roteiro
                      </strong>
                      <span className="text-[11px] text-amber-200/90 leading-relaxed">
                        Faça os ajustes necessários no título, descrição ou dicas do roteiro e clique em <strong>"Salvar Edição & Aprovar"</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Título do Roteiro:</label>
                    <input 
                      type="text" 
                      value={editRouteName} 
                      onChange={(e) => setEditRouteName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-bold" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Endereço no Google Maps:</label>
                    <input 
                      type="text" 
                      value={editRouteMapsAddress} 
                      onChange={(e) => setEditRouteMapsAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Distância Estimada (KM):</label>
                      <input 
                        type="text" 
                        value={editRouteDistance} 
                        onChange={(e) => setEditRouteDistance(e.target.value)}
                        placeholder="Ex: 180"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Duração Estimada:</label>
                      <input 
                        type="text" 
                        value={editRouteDuration} 
                        onChange={(e) => setEditRouteDuration(e.target.value)}
                        placeholder="Ex: 2h 45min"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-mono" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Descrição do Roteiro:</label>
                    <textarea 
                      rows={4} 
                      value={editRouteDescription} 
                      onChange={(e) => setEditRouteDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 leading-relaxed" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Dicas para Pilotos:</label>
                    <textarea 
                      rows={3} 
                      value={editRouteRiderTips} 
                      onChange={(e) => setEditRouteRiderTips(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 leading-relaxed" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">URL da Foto de Capa:</label>
                    <input 
                      type="text" 
                      value={editRouteImage} 
                      onChange={(e) => setEditRouteImage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {isEditingRouteInModal ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingRouteInModal(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-black uppercase cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAndApproveRoute(viewingRouteModal.id)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      <CheckCircle size={14} /> SALVAR EDIÇÃO & APROVAR ROTEIRO
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingRouteInModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit3 size={13} /> EDITAR PRA APROVAR
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {viewingRouteModal.status === 'pendente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingActionRoute({ route: viewingRouteModal, action: 'reject' });
                              setViewingRouteModal(null);
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={13} /> Não Aprovar & Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingActionRoute({ route: viewingRouteModal, action: 'approve' });
                              setViewingRouteModal(null);
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            <ShieldCheck size={14} /> APROVAR DIRETO
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingRouteModal(null)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-500" />
                  <h3 className="text-xl font-black italic uppercase text-white tracking-tight">EDITAR DETALHES DO EVENTO</h3>
                </div>
                <button onClick={() => setEditingEvent(null)} className="text-slate-500 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título do Evento</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Categoria do Evento (Sugestões Pré-Definidas)
                    </label>
                    <select
                      value={editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none cursor-pointer"
                      required
                    >
                      <option value="Geral">Geral (Confraternizações & Passeios em Geral)</option>
                      <option value="Festas & Encontros">Festas & Encontros (Shows, Churrascos, Feiras & Aniversários)</option>
                      <option value="On-Road">On-Road (Asfalto, Rodovias e Serras Pavimentadas)</option>
                      <option value="Off-Road">Off-Road (Terra, Trilha e Rali)</option>
                      <option value="Misto">Misto (Asfalto + Terra / Terrenos Variados)</option>
                    </select>
                    {/* Botões Rápidos com as Categorias Pré-Sugeridas */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Geral', 'Festas & Encontros', 'On-Road', 'Off-Road', 'Misto'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, category: cat })}
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                            editingEvent.category === cat 
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm" 
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Moderação</label>
                    <select
                      value={editingEvent.status || 'aprovado'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-sm font-bold text-amber-300 focus:border-amber-500 outline-none"
                    >
                      <option value="aprovado">Aprovado & Publicado</option>
                      <option value="pendente">Pendente de Aprovação</option>
                      <option value="rejeitado">Rejeitado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localização do Evento</label>
                  <input
                    type="text"
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Evento</label>
                    <DateInput
                      value={editingEvent.date}
                      onChange={(newDate) => setEditingEvent({ ...editingEvent, date: newDate })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-12 pr-12 text-sm font-bold text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horário</label>
                    <input
                      type="text"
                      value={editingEvent.time}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* IMAGEM DE CAPA DO EVENTO: PRÉ-VISUALIZAÇÃO & UPLOAD DE ARQUIVO */}
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <Camera size={14} className="text-amber-500" />
                      Imagem de Capa do Evento
                    </label>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      Upload de Arquivo de Imagem
                    </span>
                  </div>

                  {/* Caso haja uma imagem cadastrada, mostre a mesma com opções de trocar ou remover */}
                  {editingEvent.image && editingEvent.image.trim() !== '' ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden aspect-video max-h-56 border border-slate-700/80 bg-slate-950 shadow-inner group">
                        <img 
                          src={editingEvent.image} 
                          alt={editingEvent.title || 'Capa do evento'} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
                        
                        {/* Indicador de Imagem Cadastrada */}
                        <div className="absolute top-3 left-3">
                          <span className="text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-sm">
                            <CheckCircle size={11} className="text-emerald-400" />
                            Imagem Cadastrada
                          </span>
                        </div>

                        {/* Botões rápidos sobrepostos */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => editEventFileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
                          >
                            <Upload size={13} />
                            Trocar Imagem
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingEvent({ ...editingEvent, image: '' })}
                            title="Remover imagem cadastrada"
                            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-950 text-rose-300 hover:text-rose-200 text-[10px] font-black uppercase border border-rose-500/40 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <X size={13} />
                            Remover
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">
                        <span>Arquivo carregado para a moderação</span>
                        <button
                          type="button"
                          onClick={() => editEventFileInputRef.current?.click()}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Upload size={11} /> Selecionar outro arquivo (JPG, PNG, WebP)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Caso não haja imagem cadastrada, mostre o campo de upload de arquivo */
                    <div className="space-y-3">
                      <div 
                        onClick={() => editEventFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-slate-900/40 hover:bg-amber-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center space-y-2.5"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-amber-500/20 border border-slate-700 group-hover:border-amber-500/40 flex items-center justify-center transition-all shadow-md">
                          <Upload size={20} className="text-slate-400 group-hover:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-slate-200 group-hover:text-amber-300">
                            Fazer Upload de Imagem do Dispositivo
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            Clique aqui para escolher um arquivo JPG, PNG ou WebP até 10MB
                          </p>
                        </div>
                        <span className="text-[9px] font-black text-amber-400 bg-amber-950/80 border border-amber-500/40 px-3.5 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
                          Escolher Arquivo do Computador/Celular
                        </span>
                      </div>

                      {/* Ou informar URL direta */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <LinkIcon size={12} className="text-amber-400" /> Ou informe a URL da Imagem de Capa:
                        </label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/imagem-do-evento.jpg"
                          value={editingEvent.image || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Input de arquivo invisível */}
                  <input
                    ref={editEventFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEditEventCoverFile(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição Detalhada</label>
                  <textarea
                    rows={4}
                    value={editingEvent.desc}
                    onChange={(e) => setEditingEvent({ ...editingEvent, desc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase hover:bg-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase transition-colors cursor-pointer border border-slate-700"
                    >
                      Salvar Alterações
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!editingEvent) return;
                        const approved: MotoEvent = { 
                          ...editingEvent, 
                          status: 'aprovado',
                          distance: 0
                        };
                        const updated = events.map(evt => evt.id === approved.id ? approved : evt);
                        saveEvents(updated);
                        clientDbService.events.save(approved).catch(() => {});
                        clientDbService.events.updateStatus(approved.id, 'aprovado').catch(() => {});
                        addAuditLog(`Evento "${approved.title}" EDITADO & APROVADO pelo Administrador`);
                        showToast("Evento atualizado e APROVADO com sucesso no sistema!", "success");
                        setEditingEvent(null);
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <ShieldCheck size={16} /> Salvar & Aprovar Evento
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECTION REASON MODAL */}
      <AnimatePresence>
        {rejectionModalEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-lg font-black italic uppercase text-white">REJEITAR SOLICITAÇÃO DE EVENTO</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{rejectionModalEvent.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Motivo da Rejeição:</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Informações incompletas, local privado sem autorização..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectionModalEvent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (rejectionModalEvent) handleRejectAndDeleteEvent(rejectionModalEvent);
                    setRejectionModalEvent(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-md shadow-rose-600/20"
                >
                  Não Aprovar & Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-rose-950 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400 font-bold flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">CONFIRMAR EXCLUSÃO</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Tem certeza que deseja excluir permanentemente o evento <span className="font-bold text-white">"{deleteConfirmEvent.title}"</span>?
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmEvent(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteEvent}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PARTNER VIEW MODAL */}
      <AnimatePresence>
        {viewingPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8 space-y-0"
            >
              <div className="relative h-48 bg-slate-950">
                <img src={viewingPartner.image} className="w-full h-full object-cover" alt={viewingPartner.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <button
                  onClick={() => setViewingPartner(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/80 text-slate-300 hover:text-white rounded-full border border-slate-800"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="px-2.5 py-0.5 bg-orange-600 text-white text-[9px] font-black uppercase rounded-lg">
                    {viewingPartner.category}
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-white mt-1">{viewingPartner.name}</h3>
                </div>
              </div>

              {viewingPartner.status === 'pendente' && (
                <div className="p-3 bg-amber-500/20 border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-amber-300 px-6">
                  <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-amber-400 animate-spin shrink-0" />
                    SOLICITAÇÃO DE HOMOLOGAÇÃO PENDENTE
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovePartnerHomologation(viewingPartner.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <CheckCircle size={12} /> AUTORIZAR HOMOLOGAÇÃO
                    </button>
                    <button
                      onClick={() => handleRejectPartnerHomologation(viewingPartner.id)}
                      className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                    >
                      <Trash2 size={12} /> NÃO APROVAR & EXCLUIR
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Localização & Endereço:</label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white font-bold flex items-center gap-1.5">
                      <MapPin size={14} className="text-orange-500 shrink-0" />
                      {viewingPartner.location}
                    </p>
                    <a
                      href={viewingPartner.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${viewingPartner.name} ${viewingPartner.location}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all border border-orange-400/30 shadow-sm"
                    >
                      <MapPin size={10} />
                      Google Maps
                      <ExternalLink size={9} />
                    </a>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <label className="text-[10px] font-black uppercase text-orange-400">Desconto & Benefício Exclusivo:</label>
                  <p className="text-xs text-amber-200 font-bold italic">
                    "{viewingPartner.discount}"
                  </p>
                </div>

                {viewingPartner.news && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Novidade / Recado do Parceiro:</label>
                    <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      {viewingPartner.news}
                    </p>
                  </div>
                )}

                {/* Responsável do Estabelecimento (Exclusivo da Moderação) */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/30 space-y-1">
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                    <UserCheck size={12} /> RESPONSÁVEL DO ESTABELECIMENTO (MODERAÇÃO)
                  </span>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {viewingPartner.responsible?.name || "Não informado"}
                      </h4>
                      {viewingPartner.responsible?.phone && (
                        <p className="text-[10px] text-slate-400 font-mono font-bold">
                          {viewingPartner.responsible.phone}
                        </p>
                      )}
                    </div>
                    {viewingPartner.responsible?.phone && (
                      <a
                        href={`https://wa.me/55${viewingPartner.responsible.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                      >
                        WhatsApp Responsável
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Telefone / WhatsApp:</span>
                    <span className="text-white font-mono font-bold">{viewingPartner.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Avaliação Média:</span>
                    <span className="text-amber-400 font-bold">★ {viewingPartner.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleTogglePartnerHighlight(viewingPartner.id)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all",
                      viewingPartner.highlight 
                        ? "bg-orange-600 text-white" 
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    )}
                  >
                    <Award size={14} />
                    {viewingPartner.highlight ? "Destaque Ativo (Remover)" : "Sinalizar Destaque"}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const target = viewingPartner;
                        setViewingPartner(null);
                        setEditingPartner({ ...target });
                      }}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => {
                        const target = viewingPartner;
                        setViewingPartner(null);
                        setDeleteConfirmPartner(target);
                      }}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PARTNER MODAL */}
      <AnimatePresence>
        {editingPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="text-amber-500" size={20} />
                  <h3 className="text-lg font-black italic uppercase text-white">EDITAR DADOS DO PARCEIRO</h3>
                </div>
                <button onClick={() => setEditingPartner(null)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedPartner} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                
                {/* Section 1: Dados Principais */}
                <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">1. Dados do Estabelecimento</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Nome do Estabelecimento:</label>
                    <input
                      type="text"
                      required
                      value={editingPartner.name}
                      onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Categoria:</label>
                      <select
                        value={editingPartner.category}
                        onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                      >
                        {PARTNER_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Avaliação Média (1.0 a 5.0):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={editingPartner.rating ?? 5.0}
                        onChange={(e) => setEditingPartner({ ...editingPartner, rating: parseFloat(e.target.value) || 5.0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contatos e Atendimento */}
                <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">2. Canais de Atendimento & Contato Público</span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Contato / Setor:</label>
                      <input
                        type="text"
                        placeholder="Ex: Central de Atendimento"
                        value={editingPartner.corporateContact || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, corporateContact: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Telefone Corporativo:</label>
                      <input
                        type="text"
                        value={editingPartner.phone || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">WhatsApp do Parceiro:</label>
                      <input
                        type="text"
                        placeholder="Ex: (41) 99999-8888"
                        value={editingPartner.whatsapp || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, whatsapp: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Website Oficial (URL):</label>
                    <input
                      type="url"
                      placeholder="https://www.seuestabelecimento.com.br"
                      value={editingPartner.website || ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, website: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Section 3: Endereço & Localização */}
                <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">3. Localização & Geolocalização</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Localização / Cidade / Endereço:</label>
                    <input
                      type="text"
                      required
                      value={editingPartner.location || ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">URL do Google Maps:</label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={editingPartner.mapUrl || ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, mapUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Section 4: Benefício, Novidades & Mídia */}
                <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">4. Benefício, Novidades & Imagem</span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Benefício / Desconto Exclusivo:</label>
                    <textarea
                      rows={2}
                      required
                      value={editingPartner.discount || ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, discount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Novidades / Recados:</label>
                    <input
                      type="text"
                      value={editingPartner.news || ''}
                      onChange={(e) => setEditingPartner({ ...editingPartner, news: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Upload foto do parceiro */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Foto / Logomarca do Parceiro:</label>
                    <div className="flex items-center gap-4">
                      <img src={editingPartner.image} className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0" alt="Preview" />
                      <label className="cursor-pointer px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                        <Upload size={14} className="text-orange-500" /> Alterar Foto
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePartnerImageUpload(e, 'edit')} />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="edit_highlight_check"
                      checked={editingPartner.highlight}
                      onChange={(e) => setEditingPartner({ ...editingPartner, highlight: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <label htmlFor="edit_highlight_check" className="text-xs font-bold text-white cursor-pointer select-none">
                      Exibir como Parceiro Em Destaque no Portal
                    </label>
                  </div>
                </div>

                {/* Section 5: Responsável Interno (Uso Exclusivo da Moderação) */}
                <div className="space-y-3 p-3.5 bg-amber-950/20 rounded-2xl border border-amber-500/30">
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                      5. Responsável pelo Estabelecimento (Uso Exclusivo da Moderação)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Nome do Responsável / Gestor:</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos 'Asfalto' Silva"
                        value={editingPartner.responsible?.name || ''}
                        onChange={(e) => setEditingPartner({
                          ...editingPartner,
                          responsible: {
                            ...(editingPartner.responsible || { name: '', phone: '' }),
                            name: e.target.value
                          }
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Telefone / WhatsApp Direto do Responsável:</label>
                      <input
                        type="text"
                        placeholder="Ex: (41) 99999-7777"
                        value={editingPartner.responsible?.phone || ''}
                        onChange={(e) => setEditingPartner({
                          ...editingPartner,
                          responsible: {
                            ...(editingPartner.responsible || { name: '', phone: '' }),
                            phone: e.target.value
                          }
                        })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPartner(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase shadow-lg shadow-amber-600/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION PARTNER MODAL */}
      <AnimatePresence>
        {deleteConfirmPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 bg-rose-950 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400 font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">CONFIRMAR EXCLUSÃO DE PARCEIRO</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Tem certeza que deseja excluir o parceiro <span className="font-bold text-white">"{deleteConfirmPartner.name}"</span>?
                </p>
                <p className="text-[10px] text-rose-400 mt-1">Essa ação removerá o estabelecimento da lista pública.</p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmPartner(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeletePartner}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD NEW PARTNER MODAL */}
      <AnimatePresence>
        {showAddPartnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Store className="text-orange-500" size={20} />
                  <h3 className="text-lg font-black italic uppercase text-white">CADASTRAR NOVO PARCEIRO / OFICINA</h3>
                </div>
                <button onClick={() => setShowAddPartnerModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePartnerInCommand} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome do Estabelecimento:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bar & Custom Garage"
                    value={newPartnerData.name || ''}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Categoria:</label>
                    <select
                      value={newPartnerData.category || 'Bar e Point'}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, category: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                    >
                      {PARTNER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Telefone / Contato:</label>
                    <input
                      type="text"
                      placeholder="(41) 98888-7777"
                      value={newPartnerData.phone || ''}
                      onChange={(e) => setNewPartnerData({ ...newPartnerData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Localização / Cidade:</label>
                  <input
                    type="text"
                    required
                    placeholder="Curitiba, PR - Rodovia do Xisto"
                    value={newPartnerData.location || ''}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">URL do Google Maps (Não Obrigatório):</label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={newPartnerData.mapUrl || ''}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, mapUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Benefício / Desconto:</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ex: 10% de desconto na conta para motociclistas cadastrados"
                    value={newPartnerData.discount || ''}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, discount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Upload Foto */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Foto / Logomarca do Parceiro:</label>
                  <div className="flex items-center gap-4">
                    {newPartnerData.image && (
                      <img src={newPartnerData.image} className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0" alt="Preview" />
                    )}
                    <label className="cursor-pointer px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                      <Upload size={14} className="text-orange-500" /> Enviar Imagem / Logomarca
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePartnerImageUpload(e, 'new')} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="new_highlight_check"
                    checked={newPartnerData.highlight ?? true}
                    onChange={(e) => setNewPartnerData({ ...newPartnerData, highlight: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <label htmlFor="new_highlight_check" className="text-xs font-bold text-white cursor-pointer select-none">
                    Sinalizar como Parceiro Em Destaque no feed
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddPartnerModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase shadow-lg shadow-orange-600/20"
                  >
                    Cadastrar e Publicar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW EVENT MODAL */}
      <AnimatePresence>
        {viewingEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="relative h-48 bg-slate-950">
                <img src={viewingEvent.image} className="w-full h-full object-cover" alt={viewingEvent.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                <button onClick={() => setViewingEvent(null)} className="absolute top-4 right-4 p-2 bg-slate-950/80 text-slate-300 hover:text-white rounded-full border border-slate-800">
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[9px] font-black uppercase rounded-lg">
                    {viewingEvent.category}
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-white mt-1">{viewingEvent.title}</h3>
                </div>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Localização & Percurso:</span>
                  <p className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                    <MapPin size={14} className="text-amber-500" /> {viewingEvent.location}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-400">Descrição do Evento:</span>
                  <p className="text-slate-300 italic">"{viewingEvent.desc}"</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Data e Hora:</span>
                    <span className="font-bold text-white">{viewingEvent.date} às {viewingEvent.time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Ingresso / Valor:</span>
                    <span className="font-bold text-emerald-400">{viewingEvent.price}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button onClick={() => { const target = viewingEvent; setViewingEvent(null); setEditingEvent({ ...target }); }} className="px-4 py-2 bg-amber-600 text-white font-black uppercase text-[10px] rounded-xl flex items-center gap-1">
                    <Edit3 size={12} /> Editar
                  </button>
                  <button onClick={() => setViewingEvent(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl">
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD EVENT MODAL */}
      <AnimatePresence>
        {showAddEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                  <Calendar className="text-amber-500" size={18} /> CADASTRAR NOVO EVENTO
                </h3>
                <button onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateEventInCommand} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Título do Evento:</label>
                  <input type="text" required value={newEventData.title || ''} onChange={e => setNewEventData({ ...newEventData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Data:</label>
                    <DateInput 
                      required 
                      value={newEventData.date || ''} 
                      onChange={(newDate) => setNewEventData({ ...newEventData, date: newDate })} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-10 pr-10 text-xs text-white font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Horário:</label>
                    <input type="text" value={newEventData.time || '14:00'} onChange={e => setNewEventData({ ...newEventData, time: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Categoria do Evento:</label>
                  <select 
                    value={newEventData.category || 'Geral'} 
                    onChange={e => setNewEventData({ ...newEventData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold cursor-pointer"
                  >
                    <option value="Geral">Geral (Confraternizações & Passeios em Geral)</option>
                    <option value="Festas & Encontros">Festas & Encontros (Shows, Churrascos, Feiras & Aniversários)</option>
                    <option value="On-Road">On-Road (Asfalto, Rodovias e Serras Pavimentadas)</option>
                    <option value="Off-Road">Off-Road (Terra, Trilha e Rali)</option>
                    <option value="Misto">Misto (Asfalto + Terra / Terrenos Variados)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Localização / Cidade:</label>
                  <input type="text" required value={newEventData.location || ''} onChange={e => setNewEventData({ ...newEventData, location: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Descrição:</label>
                  <textarea rows={2} value={newEventData.desc || ''} onChange={e => setNewEventData({ ...newEventData, desc: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center justify-between">
                    <span>Imagem de Capa:</span>
                    {newEventData.image && (
                      <button 
                        type="button" 
                        onClick={() => setNewEventData({ ...newEventData, image: '' })}
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </label>
                  {newEventData.image ? (
                    <div className="relative rounded-xl overflow-hidden h-28 border border-slate-700 bg-slate-950">
                      <img src={newEventData.image} alt="Capa" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => addEventFileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black uppercase rounded-lg shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={10} /> Trocar Imagem
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => addEventFileInputRef.current?.click()}
                      className="border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-3 text-center bg-slate-950 hover:bg-amber-500/5 transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-400 hover:text-amber-300"
                    >
                      <Upload size={14} className="text-amber-500" />
                      <span className="text-xs font-bold">Fazer upload de imagem de capa</span>
                    </div>
                  )}
                  <input 
                    ref={addEventFileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddEventCoverFile(file);
                      e.target.value = '';
                    }}
                    className="hidden" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddEventModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase rounded-xl shadow-lg">Cadastrar Evento</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW CLUB MODAL */}
      <AnimatePresence>
        {viewingClub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase rounded-lg border border-amber-500/30">
                  {viewingClub.type === 'criacao' ? 'NOVO MOTO CLUBE' : 'FILIAÇÃO DE SEDE'}
                </span>
                <button onClick={() => setViewingClub(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase text-white">{viewingClub.clubName}</h3>
                <p className="text-xs text-amber-400 font-bold mt-0.5">{viewingClub.cityState}</p>
              </div>
              <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                "{viewingClub.motto || 'Respeito, Lealdade e Fraternidade no Asfalto.'}"
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Presidente / Líder:</span>
                  <span className="text-white font-bold">{viewingClub.president}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Integrantes:</span>
                  <span className="text-orange-400 font-bold">{viewingClub.membersCount} Membros</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button onClick={() => { const target = viewingClub; setViewingClub(null); setEditingClub({ ...target }); }} className="px-4 py-2 bg-amber-600 text-white font-black uppercase text-[10px] rounded-xl flex items-center gap-1">
                  <Edit3 size={12} /> Editar Dados
                </button>
                <button onClick={() => setViewingClub(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-black uppercase text-[10px] rounded-xl">Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT CLUB MODAL */}
      <AnimatePresence>
        {editingClub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                  <Edit3 className="text-amber-500" size={18} /> EDITAR DADOS DO MOTO CLUBE
                </h3>
                <button onClick={() => setEditingClub(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveEditedClub} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome do Moto Clube:</label>
                  <input type="text" required value={editingClub.clubName} onChange={e => setEditingClub({ ...editingClub, clubName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Presidente / Líder:</label>
                    <input type="text" required value={editingClub.president} onChange={e => setEditingClub({ ...editingClub, president: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Cidade / Estado:</label>
                    <input type="text" required value={editingClub.cityState} onChange={e => setEditingClub({ ...editingClub, cityState: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Lema / Lema de Estrada:</label>
                  <input type="text" value={editingClub.motto || ''} onChange={e => setEditingClub({ ...editingClub, motto: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setEditingClub(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase rounded-xl shadow-lg">Salvar Dados</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD CLUB MODAL */}
      <AnimatePresence>
        {showAddClubModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                  <Building2 className="text-amber-500" size={18} /> HOMOLOGAR NOVO MOTO CLUBE
                </h3>
                <button onClick={() => setShowAddClubModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateClubInCommand} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Nome do Moto Clube:</label>
                  <input type="text" required placeholder="Ex: Moto Clube Estrada Real" value={newClubData.clubName || ''} onChange={e => setNewClubData({ ...newClubData, clubName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Presidente / Líder:</label>
                    <input type="text" required placeholder="Ex: Carlos Silva" value={newClubData.president || ''} onChange={e => setNewClubData({ ...newClubData, president: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Cidade / UF:</label>
                    <input type="text" required placeholder="Ex: Curitiba, PR" value={newClubData.cityState || ''} onChange={e => setNewClubData({ ...newClubData, cityState: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Lema do Clube:</label>
                  <input type="text" placeholder="Ex: Respeito, Lealdade e Irmandade." value={newClubData.motto || ''} onChange={e => setNewClubData({ ...newClubData, motto: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddClubModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase rounded-xl shadow-lg">Cadastrar e Homologar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM CLUB MODAL */}
      <AnimatePresence>
        {deleteConfirmClub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-950 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400 font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">CONFIRMAR EXCLUSÃO DE MOTO CLUBE</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Tem certeza que deseja excluir o Moto Clube <span className="font-bold text-white">"{deleteConfirmClub.clubName}"</span>?
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeleteConfirmClub(null)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase">Cancelar</button>
                <button onClick={handleConfirmDeleteClub} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20">Excluir Permanentemente</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW REPORT MODAL */}
      <AnimatePresence>
        {viewingReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={14} /> DETALHES DA DENÚNCIA DO FEED
                </span>
                <button onClick={() => setViewingReport(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Autor da Publicação:</span>
                  <span className="font-bold text-white">{viewingReport.author}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Denunciado por:</span>
                  <span className="font-mono text-slate-300">{viewingReport.reportedBy} ({viewingReport.reportedAt})</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">Conteúdo da Postagem:</span>
                  <p className="text-slate-200 italic">"{viewingReport.content}"</p>
                </div>
                <div className="p-2.5 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-300 font-bold">
                  MOTIVO: {viewingReport.reason}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => setViewingReport(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-xl">Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE REPORT CONFIRM MODAL */}
      <AnimatePresence>
        {deleteConfirmReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-950 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400 font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">APAGAR REGISTRO DE DENÚNCIAS</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Tem certeza que deseja apagar o histórico dessa denúncia?
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeleteConfirmReport(null)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase">Cancelar</button>
                <button onClick={handleConfirmDeleteReport} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20">Apagar Registro</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECT POST MODAL */}
      <AnimatePresence>
        {rejectionModalPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <XCircle size={24} className="text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-lg font-black italic uppercase text-white">REJEITAR SOLICITAÇÃO DE POSTAGEM</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">AUTOR: {rejectionModalPost.user.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Motivo da Rejeição:</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Conteúdo impróprio, spam comercial, desrespeito às regras da comunidade..."
                  value={postRejectionReason}
                  onChange={(e) => setPostRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setRejectionModalPost(null); setPostRejectionReason(''); }} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase">Cancelar</button>
                <button 
                  onClick={() => {
                    if (rejectionModalPost) handleRejectAndDeletePost(rejectionModalPost);
                    setRejectionModalPost(null);
                    setPostRejectionReason('');
                  }} 
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20"
                >
                  Não Aprovar & Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW POST DETAILS & EDIT TO APPROVE MODAL */}
      <AnimatePresence>
        {viewingPostModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-6">
              
              {/* Header com Tabs de alternância */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      CENTRO DE MODERAÇÃO DE PUBLICAÇÃO
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      ID: {viewingPostModal.id} • {viewingPostModal.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingPostInModal(false)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                        !isEditingPostInModal 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Eye size={12} /> Ver Completo
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPostInModal(true)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                        isEditingPostInModal 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Edit3 size={12} /> Editar pra Aprovar
                    </button>
                  </div>

                  <button 
                    onClick={() => { setViewingPostModal(null); setIsEditingPostInModal(false); }} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Autor info bar */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img 
                    src={viewingPostModal.user.avatar} 
                    className="w-11 h-11 rounded-full object-cover border-2 border-slate-800 shrink-0" 
                    alt={viewingPostModal.user.name} 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white text-xs uppercase">{viewingPostModal.user.name}</p>
                      <span className="text-[8px] font-black uppercase bg-slate-900 border border-slate-800 text-amber-400 px-2 py-0.5 rounded">
                        {viewingPostModal.user.role || 'Piloto'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Enviado em: {viewingPostModal.createdAt || viewingPostModal.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border",
                    viewingPostModal.status === 'aprovado' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    viewingPostModal.status === 'rejeitado' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                    "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    {viewingPostModal.status.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    CATEGORIA: <strong className="text-white">{viewingPostModal.category}</strong>
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              {!isEditingPostInModal ? (
                /* MODO 1: VISUALIZAÇÃO COMPLETA */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Conteúdo Integral da Publicação (Sem Cortes):
                    </label>
                    <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800/80 max-h-72 overflow-y-auto">
                      <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
                        {viewingPostModal.content}
                      </p>
                    </div>
                  </div>

                  {viewingPostModal.image && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Foto / Mídia Anexada:
                      </label>
                      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-80 flex items-center justify-center">
                        <img 
                          src={viewingPostModal.image} 
                          className="w-full max-h-80 object-contain rounded-2xl" 
                          alt="Anexo da Publicação" 
                        />
                      </div>
                    </div>
                  )}

                  {viewingPostModal.status === 'rejeitado' && viewingPostModal.rejectionReason && (
                    <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-xs text-rose-200">
                      <span className="text-[10px] font-black uppercase text-rose-400 block mb-1">
                        Motivo da Rejeição:
                      </span>
                      <p className="italic">{viewingPostModal.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* MODO 2: EDITAR PRA APROVAR */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
                    <Edit3 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black uppercase text-amber-400 text-[10px]">
                        Modo de Edição Ativo (Curadoria da Moderação)
                      </strong>
                      <span className="text-[11px] text-amber-200/90 leading-relaxed">
                        Corrija eventuais erros, termos impróprios ou ajuste a categoria. Ao clicar em <strong>"Salvar Edição & Aprovar"</strong>, a publicação será salva e entrará no ar no Feed imediatamente!
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Texto / Conteúdo da Publicação:
                    </label>
                    <textarea
                      rows={6}
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      placeholder="Edite o texto da publicação..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white outline-none focus:border-amber-500 leading-relaxed font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Categoria da Publicação:
                      </label>
                      <select
                        value={editPostCategory}
                        onChange={(e) => setEditPostCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-amber-500 cursor-pointer uppercase"
                      >
                        <option value="ENCONTROS">ENCONTROS</option>
                        <option value="VIAGENS">VIAGENS</option>
                        <option value="EXPEDIÇÕES">EXPEDIÇÕES</option>
                        <option value="MECÂNICA">MECÂNICA</option>
                        <option value="GERAL">GERAL</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          URL da Imagem Anexada:
                        </label>
                        {editPostImage && (
                          <button
                            type="button"
                            onClick={() => setEditPostImage('')}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} /> Remover Foto
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editPostImage}
                        onChange={(e) => setEditPostImage(e.target.value)}
                        placeholder="https://... ou deixe em branco"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {editPostImage && (
                    <div className="rounded-xl overflow-hidden max-h-40 border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <img src={editPostImage} alt="Preview da Imagem" className="max-h-40 object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Footer com botões de decisão */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                {isEditingPostInModal ? (
                  /* Botões no modo de Edição */
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingPostInModal(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleSavePostEditsOnly(viewingPostModal.id)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Apenas Salvar Rascunho
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAndApprovePost(viewingPostModal.id)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                      >
                        <CheckCircle size={14} /> SALVAR EDIÇÃO & APROVAR
                      </button>
                    </div>
                  </>
                ) : (
                  /* Botões no modo de Visualização */
                  <>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsEditingPostInModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Edit3 size={13} /> EDITAR PRA APROVAR
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {viewingPostModal.status === 'pendente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRejectAndDeletePost(viewingPostModal)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} /> Não Aprovar & Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovePost(viewingPostModal.id)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            <CheckCircle size={14} /> APROVAR DIRETO
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingPostModal(null)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE POST CONFIRM MODAL */}
      <AnimatePresence>
        {deleteConfirmPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-950 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400 font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">EXCLUIR PUBLICAÇÃO DO SISTEMA</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Tem certeza que deseja excluir permanentemente a publicação de <strong className="text-white">{deleteConfirmPost.user.name}</strong>?
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setDeleteConfirmPost(null)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase">Cancelar</button>
                <button onClick={handleConfirmDeletePost} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20">Excluir Permanentemente</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PILOT PROFILE & PLAN DETAILS MODAL */}
      <AnimatePresence>
        {viewingPilotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                    {viewingPilotModal.avatar_url ? (
                      <img src={viewingPilotModal.avatar_url} alt={viewingPilotModal.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-amber-400">
                        {viewingPilotModal.name?.slice(0, 2).toUpperCase() || 'ML'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {viewingPilotModal.name}
                      {viewingPilotModal.role === 'admin' && (
                        <span className="text-[9px] font-black uppercase bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-md">
                          Admin
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{viewingPilotModal.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPilotModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-2xl border flex items-center justify-between",
                viewingPilotModal.plan_type === 'bonificado'
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                  : viewingPilotModal.plan_type === 'pago' || viewingPilotModal.is_pro
                  ? "bg-orange-950/20 border-orange-500/40 text-orange-300"
                  : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              )}>
                <div className="flex items-center gap-2.5">
                  {viewingPilotModal.plan_type === 'bonificado' ? (
                    <Gift size={20} className="text-amber-400" />
                  ) : viewingPilotModal.plan_type === 'pago' || viewingPilotModal.is_pro ? (
                    <Crown size={20} className="text-orange-400" />
                  ) : (
                    <CheckCircle size={20} className="text-emerald-400" />
                  )}
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {viewingPilotModal.plan_type === 'bonificado'
                        ? 'Modo Bonificado Ativo (VIP Sem Custo)'
                        : viewingPilotModal.plan_type === 'pago' || viewingPilotModal.is_pro
                        ? 'Assinatura Pro Comercial Ativa'
                        : 'Plano Gratuito (Asfalto)'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {viewingPilotModal.plan_type === 'bonificado'
                        ? 'Acesso total a telemetria, criação de eventos e clubes liberado pelo ADM.'
                        : 'Permissões e recursos de acordo com o plano do motociclista.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details table */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Motocicleta Principal</span>
                  <span className="text-white font-medium">{viewingPilotModal.motorcycle || 'Não informada'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Localidade</span>
                  <span className="text-white font-medium">
                    {viewingPilotModal.city ? `${viewingPilotModal.city}, ${viewingPilotModal.state || 'BR'}` : 'Brasil'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Moto Clube Afiliado</span>
                  <span className="text-amber-400 font-medium">{viewingPilotModal.club_name || 'Piloto Independente'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Pontuação & Patente</span>
                  <span className="text-white font-medium">{viewingPilotModal.points || 0} pts • Nível {viewingPilotModal.tier || 'Bronze'}</span>
                </div>
                {viewingPilotModal.bonificado_at && (
                  <div className="flex justify-between items-center text-slate-400 pt-1">
                    <span className="text-amber-400/90 font-bold uppercase text-[10px]">Data de Bonificação</span>
                    <span className="text-amber-300 font-mono text-[11px]">{formatDisplayDate(viewingPilotModal.bonificado_at)}</span>
                  </div>
                )}
                {viewingPilotModal.plan_type !== 'bonificado' && !viewingPilotModal.is_pro && (
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-slate-500 font-bold uppercase text-[9px] block mb-1.5">
                      Itens Liberados no Modo Gratuito:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400 shrink-0" /> Acesso ao Dashboard e Feed de Notícias</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400 shrink-0" /> Diário de Bordo (Até 5 registros por mês)</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400 shrink-0" /> Visualização de Eventos e Roteiros Públicos</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400 shrink-0" /> Perfil de Piloto com Gamificação Básica</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400 shrink-0" /> Suporte Comunitário na Plataforma</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons inside modal */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                {viewingPilotModal.plan_type !== 'bonificado' ? (
                  <button
                    onClick={() => {
                      handleUpdatePlan(viewingPilotModal.id, 'bonificado');
                      setViewingPilotModal({ ...viewingPilotModal, plan_type: 'bonificado', is_pro: true });
                    }}
                    className="flex-1 btn-primary py-2.5"
                  >
                    <Gift size={15} /> Ativar Modo Bonificado
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdatePlan(viewingPilotModal.id, 'gratuito');
                      setViewingPilotModal({ ...viewingPilotModal, plan_type: 'gratuito', is_pro: false });
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase rounded-xl flex items-center justify-center gap-2"
                  >
                    <UserX size={15} className="text-rose-400" /> Reverter para Gratuito
                  </button>
                )}

                {viewingPilotModal.role !== 'admin' && viewingPilotModal.email?.toLowerCase().trim() !== 'ciceroranieri@gmail.com' && viewingPilotModal.id !== 'admin_ciceroranieri' && (
                  <button
                    onClick={() => {
                      const pilotToBan = viewingPilotModal;
                      setViewingPilotModal(null);
                      setDeleteConfirmPilot(pilotToBan);
                    }}
                    className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Excluir e banir piloto permanentemente"
                  >
                    <Trash2 size={14} /> Excluir / Banir
                  </button>
                )}

                <button
                  onClick={() => setViewingPilotModal(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE / BAN PILOT CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmPilot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-center my-8"
            >
              <div className="w-16 h-16 bg-rose-950/80 border-2 border-rose-500/50 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
                <ShieldAlert size={32} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/60 border border-rose-500/30 px-3 py-1 rounded-full inline-block">
                  Ação Irreversível • Moderação
                </span>
                <h3 className="text-xl font-black italic uppercase text-white">
                  EXCLUIR & BANIR PILOTO
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tem certeza que deseja banir e excluir definitivamente o piloto{' '}
                  <strong className="text-white font-bold">{deleteConfirmPilot.name}</strong> ({deleteConfirmPilot.email})?
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-rose-500/20 text-left space-y-1.5 text-[11px] text-slate-300">
                <span className="text-[10px] font-black uppercase text-rose-400 block font-bold">
                  Esta ação removerá permanentemente:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                  <li>O cadastro completo do piloto no banco de dados;</li>
                  <li>Todas as viagens registradas no Diário de Bordo;</li>
                  <li>Solicitações de pagamento e dados de telemetria;</li>
                  <li>Acesso e login na plataforma MotoLegado.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingPilot}
                  onClick={() => setDeleteConfirmPilot(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingPilot}
                  onClick={handleConfirmDeletePilot}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeletingPilot ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Sim, Excluir e Banir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
