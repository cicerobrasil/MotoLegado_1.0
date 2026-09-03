import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
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
  Filter, 
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
  Wrench,
  UtensilsCrossed,
  GraduationCap,
  Compass,
  ExternalLink,
  Navigation,
  Star,
  ArrowLeft,
  Loader2,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Partner } from './Partners';
import { CommunityPost, Route } from '../types';

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
  date: string;
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
  const { profile, loading, user, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'eventos' | 'clubes' | 'roteiros' | 'comunidade' | 'parceiros' | 'telemetria'>('eventos');
  
  // Routes Moderation State
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeFilterStatus, setRouteFilterStatus] = useState<'pendente' | 'todos' | 'aprovado' | 'rejeitado'>('pendente');
  const [routeSearch, setRouteSearch] = useState('');
  const [pendingActionRoute, setPendingActionRoute] = useState<{ route: Route; action: 'approve' | 'reject' } | null>(null);
  const [routeRejectionReasonInput, setRouteRejectionReasonInput] = useState('');
  
  // Events Moderation State
  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<'pendente' | 'aprovado' | 'rejeitado' | 'todos'>('pendente');
  const [eventSearch, setEventSearch] = useState('');
  const [editingEvent, setEditingEvent] = useState<MotoEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<MotoEvent | null>(null);
  const [rejectionModalEvent, setRejectionModalEvent] = useState<MotoEvent | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<MotoEvent | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState<Partial<MotoEvent>>({
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

  // Clubs Moderation State
  const [clubRequests, setClubRequests] = useState<ClubModerationRequest[]>([]);
  const [clubSearchText, setClubSearchText] = useState('');
  const [clubStatusFilter, setClubStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados' | 'rejeitados'>('todos');
  const [clubTypeFilter, setClubTypeFilter] = useState<'todos' | 'criacao' | 'filiacao'>('todos');
  const [viewingClub, setViewingClub] = useState<ClubModerationRequest | null>(null);
  const [editingClub, setEditingClub] = useState<ClubModerationRequest | null>(null);
  const [deleteConfirmClub, setDeleteConfirmClub] = useState<ClubModerationRequest | null>(null);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [newClubData, setNewClubData] = useState<Partial<ClubModerationRequest>>({
    clubName: '',
    president: '',
    cityState: '',
    type: 'criacao',
    membersCount: 10,
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
  const [postStatusFilter, setPostStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados' | 'rejeitados'>('pendentes');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('todos');
  const [viewingPostModal, setViewingPostModal] = useState<CommunityPost | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<CommunityPost | null>(null);
  const [rejectionModalPost, setRejectionModalPost] = useState<CommunityPost | null>(null);
  const [postRejectionReason, setPostRejectionReason] = useState('');

  // Telemetria State
  const [telemetriaSearchText, setTelemetriaSearchText] = useState('');
  const [telemetriaCategoryFilter, setTelemetriaCategoryFilter] = useState<'todos' | 'homologacoes' | 'eventos' | 'clubes' | 'feed'>('todos');

  // Partners Requests State
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);

  // Registered Partners Management State
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [partnerSearchText, setPartnerSearchText] = useState('');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('Todos');
  const [partnerHighlightFilter, setPartnerHighlightFilter] = useState<'todos' | 'destacados' | 'regulares'>('todos');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<'todos' | 'pendentes' | 'aprovados' | 'rejeitados'>('todos');

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

  // Load events from LocalStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('motolegado_events');
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents);
        const mockIds = ['e_fest_1', 'e_fest_2', 'e_sul_1', 'e_pend_1', 'e_pend_2', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5'];
        const cleaned = Array.isArray(parsed) ? parsed.filter((e: MotoEvent) => !mockIds.includes(e.id)) : [];
        setEvents(cleaned);
        localStorage.setItem('motolegado_events', JSON.stringify(cleaned));
      } catch (e) {
        setEvents([]);
        localStorage.setItem('motolegado_events', JSON.stringify([]));
      }
    } else {
      setEvents([]);
      localStorage.setItem('motolegado_events', JSON.stringify([]));
    }

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
    const target = communityPosts.find(p => p.id === postId);
    addAuditLog(`Publicação de "${target?.user.name}" APROVADA e liberada no Feed`);
    showToast(`Publicação de "${target?.user.name}" aprovada com sucesso!`, 'success');
    if (viewingPostModal?.id === postId) {
      setViewingPostModal(null);
    }
  };

  const handleConfirmRejectPost = () => {
    if (!rejectionModalPost) return;
    const updated = communityPosts.map(p => {
      if (p.id === rejectionModalPost.id) {
        return { 
          ...p, 
          status: 'rejeitado' as const, 
          rejectionReason: postRejectionReason.trim() || 'Desconformidade com as diretrizes da comunidade' 
        };
      }
      return p;
    });
    saveCommunityPosts(updated);
    addAuditLog(`Publicação de "${rejectionModalPost.user.name}" REJEITADA na moderação`);
    showToast(`Publicação de "${rejectionModalPost.user.name}" foi rejeitada.`, 'info');
    setRejectionModalPost(null);
    setPostRejectionReason('');
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
    addAuditLog(`Evento "${events.find(e => e.id === id)?.title}" APROVADO`);
    showToast("Evento APROVADO e publicado no site!", "success");
  };

  const handleOpenRejectModal = (evt: MotoEvent) => {
    setRejectionModalEvent(evt);
    setRejectionReasonInput('');
  };

  const handleConfirmRejectEvent = () => {
    if (!rejectionModalEvent) return;
    const updated = events.map(evt => {
      if (evt.id === rejectionModalEvent.id) {
        return {
          ...evt,
          status: 'rejeitado' as const,
          rejectionReason: rejectionReasonInput.trim() || 'Não atendeu aos critérios da comunidade.'
        };
      }
      return evt;
    });
    saveEvents(updated);
    addAuditLog(`Evento "${rejectionModalEvent.title}" REJEITADO`);
    showToast("Evento REJEITADO.", "info");
    setRejectionModalEvent(null);
  };

  const handleConfirmDeleteEvent = () => {
    if (!deleteConfirmEvent) return;
    const updated = events.filter(evt => evt.id !== deleteConfirmEvent.id);
    saveEvents(updated);
    addAuditLog(`Evento "${deleteConfirmEvent.title}" EXCLUÍDO permanentemente`);
    showToast("Evento EXCLUÍDO do sistema.", "info");
    setDeleteConfirmEvent(null);
  };

  const handleSaveEditedEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const updated = events.map(evt => evt.id === editingEvent.id ? editingEvent : evt);
    saveEvents(updated);
    addAuditLog(`Evento "${editingEvent.title}" EDITADO pelo Administrador`);
    showToast("Dados do evento atualizados!", "success");
    setEditingEvent(null);
  };

  const handleCreateEventInCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!newEventData.title || !newEventData.location) {
      showToast("Preencha título e localização do evento.", "info");
      return;
    }
    const createdEvt: MotoEvent = {
      id: 'evt_cmd_' + Date.now(),
      title: newEventData.title || 'Novo Encontro',
      date: newEventData.date || new Date().toISOString().split('T')[0],
      time: newEventData.time || '14:00',
      location: newEventData.location || 'Brasil',
      category: newEventData.category || 'Encontro',
      desc: newEventData.desc || 'Evento oficial cadastrado via Centro de Comando.',
      image: newEventData.image || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800',
      price: newEventData.price || 'Gratuito',
      organizer: newEventData.organizer || 'Administração MotoLegado',
      status: 'aprovado',
      checkedIn: false,
      memberCount: 10
    };
    const updated = [createdEvt, ...events];
    saveEvents(updated);
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

  const handleRejectClub = (id: string) => {
    const updated = clubRequests.map(c => c.id === id ? { ...c, status: 'rejeitado' as const } : c);
    saveClubs(updated);
    addAuditLog(`Moto Clube "${clubRequests.find(c => c.id === id)?.clubName}" REJEITADO`);
    showToast("Solicitação de Moto Clube REJEITADA.", "info");
    if (viewingClub?.id === id) {
      setViewingClub({ ...viewingClub, status: 'rejeitado' });
    }
  };

  const handleSaveEditedClub = (e: FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    const updated = clubRequests.map(c => c.id === editingClub.id ? editingClub : c);
    saveClubs(updated);
    addAuditLog(`Dados do Moto Clube "${editingClub.clubName}" ATUALIZADOS pelo Administrador`);
    showToast("Cadastro do Moto Clube atualizado!", "success");
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
    const updated = partnerRequests.map(p => p.id === id ? { ...p, status: 'rejeitado' as const } : p);
    savePartners(updated);
    addAuditLog(`Solicitação de Parceiro "${partnerRequests.find(p => p.id === id)?.businessName}" REJEITADA`);
    showToast("Solicitação de parceiro recusada.", "info");
  };

  // Registered Partner Homologation Moderation Actions
  const handleApprovePartnerHomologation = (id: string) => {
    const updated = allPartners.map(p => p.id === id ? { ...p, status: 'aprovado' as const, highlight: true } : p);
    saveAllPartnersList(updated);
    const target = allPartners.find(p => p.id === id);
    addAuditLog(`Homologação do parceiro "${target?.name || id}" AUTORIZADA pelo Moderador`);
    showToast(`Homologação de "${target?.name}" autorizada com sucesso! O parceiro agora está ativo no portal público.`, "success");
    if (viewingPartner?.id === id) {
      setViewingPartner({ ...viewingPartner, status: 'aprovado', highlight: true });
    }
  };

  const handleRejectPartnerHomologation = (id: string) => {
    const updated = allPartners.map(p => p.id === id ? { ...p, status: 'rejeitado' as const } : p);
    saveAllPartnersList(updated);
    const target = allPartners.find(p => p.id === id);
    addAuditLog(`Homologação do parceiro "${target?.name || id}" REJEITADA pelo Moderador`);
    showToast(`Solicitação de homologação de "${target?.name}" foi rejeitada.`, "info");
    if (viewingPartner?.id === id) {
      setViewingPartner({ ...viewingPartner, status: 'rejeitado' });
    }
  };

  const handleConfirmRouteAction = () => {
    if (!pendingActionRoute) return;
    const { route, action } = pendingActionRoute;
    const updatedRoutes = routes.map(r => {
      if (r.id === route.id) {
        return {
          ...r,
          status: action === 'approve' ? ('aprovado' as const) : ('rejeitado' as const),
          rejectionReason: action === 'reject' ? routeRejectionReasonInput.trim() : undefined
        };
      }
      return r;
    });
    setRoutes(updatedRoutes);
    localStorage.setItem('motolegado_routes', JSON.stringify(updatedRoutes));
    localStorage.setItem('motolegado_routes_v3', JSON.stringify(updatedRoutes));
    window.dispatchEvent(new Event('routes-updated'));
    
    if (action === 'approve') {
      addAuditLog(`Roteiro "${route.name}" APROVADO pelo moderador`);
      showToast(`Roteiro "${route.name}" APROVADO com sucesso!`, "success");
    } else {
      addAuditLog(`Roteiro "${route.name}" REJEITADO pelo moderador`);
      showToast(`Roteiro "${route.name}" REJEITADO.`, "info");
    }
    setPendingActionRoute(null);
  };

  // Calculated Counts
  const pendingEventsCount = events.filter(e => e.status === 'pendente').length;
  const approvedEventsCount = events.filter(e => e.status === 'aprovado' || !e.status).length;
  const rejectedEventsCount = events.filter(e => e.status === 'rejeitado').length;

  const pendingClubsCount = clubRequests.filter(c => c.status === 'pendente').length;
  const pendingRoutesCount = routes.filter(r => r.status === 'pendente').length;
  const approvedRoutesCount = routes.filter(r => r.status === 'aprovado' || !r.status).length;
  const rejectedRoutesCount = routes.filter(r => r.status === 'rejeitado').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pendente').length;
  const pendingPostsCount = communityPosts.filter(p => p.status === 'pendente').length;
  const pendingPartnersCount = partnerRequests.filter(p => p.status === 'pendente').length + allPartners.filter(p => p.status === 'pendente').length;

  const totalPendingAll = pendingEventsCount + pendingClubsCount + pendingRoutesCount + pendingReportsCount + pendingPostsCount + pendingPartnersCount;

  // Filtered Events List
  const filteredEvents = events.filter(evt => {
    const matchesFilter = 
      eventFilter === 'pendente' ? evt.status === 'pendente' :
      eventFilter === 'aprovado' ? (evt.status === 'aprovado' || !evt.status) :
      eventFilter === 'rejeitado' ? evt.status === 'rejeitado' : true;
    
    const matchesSearch = 
      evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      evt.location.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (evt.createdBy || '').toLowerCase().includes(eventSearch.toLowerCase());

    return matchesFilter && matchesSearch;
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black italic uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] cursor-pointer"
            >
              <ArrowLeft size={16} />
              VOLTAR AO DASHBOARD
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all cursor-pointer border border-slate-700"
            >
              VER MEU PERFIL
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-950 min-h-screen text-slate-100 pb-32">
      
      {/* HEADER BANNER */}
      <header className="relative bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 md:p-10 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-400" />
                SISTEMA CENTRAL DE MODERAÇÃO & CONTROLE
              </span>
              <span className="px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-1.5">
                <Lock size={12} />
                ADMIN SUPREMO ATIVO
              </span>
              {isSupabaseConfigured ? (
                <span className="px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Database size={12} />
                  SUPABASE CONECTADO
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-400 text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <Database size={12} />
                  MODO LOCAL / DEMO
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white drop-shadow-md">
              CENTRO DE <span className="text-amber-500">COMANDO</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-3xl font-medium leading-relaxed">
              Painel administrativo unificado para moderação geral do portal MotoLegado. Valide e aprove eventos solicitados, credencie Moto Clubes e empresas parceiras, modere conteúdos denunciados e acompanhe a telemetria do sistema em tempo real.
            </p>
          </div>

          {/* Quick summary badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl">
                {totalPendingAll}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest">PENDÊNCIAS TOTAIS</div>
                <div className="text-xs text-slate-300 font-bold">Solicitações Aguardando Análise</div>
              </div>
            </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button 
          onClick={() => setActiveTab('eventos')}
          className={cn(
            "bento-card p-5 text-left transition-all border group relative overflow-hidden",
            activeTab === 'eventos' ? "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30" : "border-slate-800/80 hover:border-slate-700 bg-slate-900/40"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MODERAÇÃO DE EVENTOS</span>
            <Calendar size={18} className="text-amber-400" />
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
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PARCEIROS & EMPRESAS</span>
            <Store size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black italic text-white mb-1">
            {pendingPartnersCount} <span className="text-xs font-normal text-slate-400 uppercase italic">Aguardando</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Credenciamento de convênios
          </div>
        </button>
      </div>

      {/* CORE NAVIGATION TABS */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'eventos', label: 'Moderação de Eventos', icon: Calendar, badge: pendingEventsCount },
          { id: 'clubes', label: 'Moto Clubes & Sedes', icon: Building2, badge: pendingClubsCount },
          { id: 'roteiros', label: 'Moderação Roteiros', icon: Navigation, badge: pendingRoutesCount },
          { id: 'comunidade', label: 'Comunidade & Feed', icon: MessageSquare, badge: pendingReportsCount },
          { id: 'parceiros', label: 'Credenciamento Parceiros', icon: Store, badge: pendingPartnersCount },
          { id: 'telemetria', label: 'Logs & Telemetria', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-4 text-xs font-black italic uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap shrink-0",
              activeTab === tab.id
                ? "border-amber-500 text-amber-400 bg-slate-900/60"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
            )}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black not-italic animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
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
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase rounded-full flex items-center gap-1.5 transition-all"
                >
                  <Plus size={12} />
                  Cadastrar Evento em /events
                </Link>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar evento por título, local ou autor..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todas', count: events.length },
                  { id: 'pendente', label: 'Pendentes', count: pendingEventsCount },
                  { id: 'aprovado', label: 'Aprovados & No Mapa', count: approvedEventsCount },
                  { id: 'rejeitado', label: 'Rejeitados', count: rejectedEventsCount }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventFilter(f.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                      eventFilter === f.id
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

          {/* Events List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => {
              const isPending = evt.status === 'pendente';
              const isApproved = evt.status === 'aprovado' || !evt.status;
              const isRejected = evt.status === 'rejeitado';

              return (
                <div
                  key={evt.id}
                  className={cn(
                    "bento-card p-0 overflow-hidden border transition-all flex flex-col justify-between bg-slate-900/40",
                    isPending ? "border-amber-500/60 shadow-xl shadow-amber-950/20" :
                    isRejected ? "border-rose-500/30 opacity-80" : "border-slate-800/80"
                  )}
                >
                  {/* Status header */}
                  <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="px-3 py-1 bg-amber-950 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse">
                          <Clock size={12} />
                          AGUARDANDO APROVAÇÃO
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          APROVADO & NO MAPA
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 bg-rose-950 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <XCircle size={12} />
                          REJEITADO
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

                    {isRejected && evt.rejectionReason && (
                      <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200">
                        <span className="text-[9px] font-black uppercase text-rose-400 block mb-0.5">Motivo da Rejeição:</span>
                        <span className="italic">{evt.rejectionReason}</span>
                      </div>
                    )}

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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                      {!isApproved && (
                        <button
                          onClick={() => handleApproveEvent(evt.id)}
                          className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                        >
                          <ShieldCheck size={13} />
                          APROVAR
                        </button>
                      )}

                      <button
                        onClick={() => setEditingEvent({ ...evt })}
                        className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Edit3 size={13} className="text-amber-400" />
                        EDITAR
                      </button>

                      {!isRejected && (
                        <button
                          onClick={() => handleOpenRejectModal(evt)}
                          className="py-2.5 px-2 bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                          <XCircle size={13} className="text-amber-400" />
                          REJEITAR
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmEvent(evt)}
                        className="py-2.5 px-2 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 size={13} className="text-rose-400" />
                        EXCLUIR
                      </button>
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todos', count: clubRequests.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingClubsCount },
                  { id: 'aprovados', label: 'Aprovados', count: clubRequests.filter(c => c.status === 'aprovado' || !c.status).length },
                  { id: 'rejeitados', label: 'Rejeitados', count: clubRequests.filter(c => c.status === 'rejeitado').length }
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
                  clubStatusFilter === 'aprovados' ? (club.status === 'aprovado' || !club.status) :
                  club.status === 'rejeitado';

                return matchesSearch && matchesStatus;
              }).map((club) => {
                const isPending = club.status === 'pendente';
                const isApproved = club.status === 'aprovado' || !club.status;
                const isRejected = club.status === 'rejeitado';

                return (
                  <div 
                    key={club.id} 
                    className={cn(
                      "bg-slate-950 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all group relative",
                      isPending ? "border-amber-500/60 shadow-xl shadow-amber-500/10" :
                      isRejected ? "border-rose-500/30 opacity-80" : "border-slate-800 hover:border-slate-700"
                    )}
                  >
                    {/* Status Header Banner */}
                    {isPending && (
                      <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                          HOMOLOGAÇÃO PENDENTE
                        </span>
                        <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                          SOLICITAÇÃO
                        </span>
                      </div>
                    )}
                    {isApproved && (
                      <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" /> MOTO CLUBE REGISTRADO & ATIVO
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">ID: {club.id}</span>
                      </div>
                    )}
                    {isRejected && (
                      <div className="bg-rose-950/80 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-rose-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle size={12} className="text-rose-400" /> REGISTRO REJEITADO
                        </span>
                        <span className="text-[8px] text-rose-400 font-mono uppercase">MODERADO</span>
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
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                              <CheckCircle size={13} /> AUTORIZAR HOMOLOGAÇÃO
                            </button>
                            <button
                              onClick={() => handleRejectClub(club.id)}
                              className="px-3 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                            >
                              <XCircle size={13} /> REJEITAR
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setViewingClub(club)}
                              className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1"
                            >
                              <Eye size={11} /> Info
                            </button>
                            <button
                              onClick={() => setEditingClub({ ...club })}
                              className="py-2 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1"
                            >
                              <Edit3 size={11} /> Editar Dados
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-900">
                          <button
                            onClick={() => setViewingClub(club)}
                            className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> Info
                          </button>
                          <button
                            onClick={() => setEditingClub({ ...club })}
                            className="py-2 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <Edit3 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => handleRejectClub(club.id)}
                            className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <XCircle size={12} /> Status
                          </button>
                          <button
                            onClick={() => setDeleteConfirmClub(club)}
                            className="py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'pendentes', label: 'Pendentes', count: pendingPostsCount },
                  { id: 'aprovados', label: 'Aprovados', count: communityPosts.filter(p => p.status === 'aprovado').length },
                  { id: 'rejeitados', label: 'Rejeitados', count: communityPosts.filter(p => p.status === 'rejeitado').length },
                  { id: 'todos', label: 'Todos', count: communityPosts.length }
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
                  postStatusFilter === 'aprovados' ? p.status === 'aprovado' :
                  p.status === 'rejeitado';

                const matchesCategory = 
                  postCategoryFilter === 'todos' ? true :
                  p.category.toUpperCase() === postCategoryFilter.toUpperCase();

                return matchesSearch && matchesStatus && matchesCategory;
              }).map((post) => {
                const isPending = post.status === 'pendente';
                const isApproved = post.status === 'aprovado';
                const isRejected = post.status === 'rejeitado';

                return (
                  <div
                    key={post.id}
                    className={cn(
                      "bg-slate-950 rounded-2xl border overflow-hidden transition-all",
                      isPending ? "border-amber-500/60 shadow-lg shadow-amber-500/10" :
                      isRejected ? "border-rose-500/30 opacity-75" : "border-slate-800"
                    )}
                  >
                    {/* Status Header Bar */}
                    {isPending && (
                      <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                          SOLICITAÇÃO DE PUBLICAÇÃO AGUARDANDO AUTORIZAÇÃO
                        </span>
                        <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                          HOMOLOGAÇÃO PENDENTE
                        </span>
                      </div>
                    )}
                    {isApproved && (
                      <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-emerald-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" /> APROVADO & PUBLICADO NO FEED
                        </span>
                        <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase">ATIVO</span>
                      </div>
                    )}
                    {isRejected && (
                      <div className="bg-rose-950/80 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-rose-300">
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle size={12} className="text-rose-400" /> REJEITADO NA MODERAÇÃO
                        </span>
                        <span className="text-[8px] text-rose-400 font-mono uppercase font-bold">REJEITADO</span>
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

                        {isRejected && post.rejectionReason && (
                          <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-[10px] text-rose-300">
                            <span className="font-black uppercase">Motivo da Rejeição:</span> {post.rejectionReason}
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
                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                          >
                            <CheckCircle size={14} /> AUTORIZAR & PUBLICAR
                          </button>
                          <button
                            onClick={() => setRejectionModalPost(post)}
                            className="px-5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                          >
                            <XCircle size={14} /> REJEITAR SOLICITAÇÃO
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                          <button
                            onClick={() => setViewingPostModal(post)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all"
                          >
                            <Eye size={13} /> Visualizar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmPost(post)}
                            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 size={13} /> Excluir
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'todos', label: 'Todas', count: allPartners.length },
                  { id: 'pendentes', label: 'Pendentes', count: pendingPartnersCount },
                  { id: 'aprovados', label: 'Aprovados', count: allPartners.filter(p => p.status === 'aprovado' || !p.status).length },
                  { id: 'rejeitados', label: 'Rejeitados', count: allPartners.filter(p => p.status === 'rejeitado').length }
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
                  partnerStatusFilter === 'aprovados' ? (pt.status === 'aprovado' || !pt.status) :
                  pt.status === 'rejeitado';

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
                            title="Rejeitar Solicitação"
                          >
                            <XCircle size={13} /> REJEITAR
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'pendente', label: 'Pendentes', count: pendingRoutesCount },
                  { id: 'aprovado', label: 'Aprovados & No Mapa', count: approvedRoutesCount },
                  { id: 'rejeitado', label: 'Rejeitados', count: rejectedRoutesCount },
                  { id: 'todos', label: 'Todas', count: routes.length }
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
                    routeFilterStatus === 'aprovado' ? (r.status === 'aprovado' || !r.status) :
                    routeFilterStatus === 'rejeitado' ? r.status === 'rejeitado' : true;

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
                  const isRejected = route.status === 'rejeitado';

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
                                isRejected ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                                "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              )}>
                                {isPending ? '🛡️ Pendente de Moderação' : isApproved ? '✓ Aprovado & No Mapa' : 'Rejeitado'}
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
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                        {!isApproved && (
                          <button 
                            onClick={() => { setPendingActionRoute({ route, action: 'approve' }); setRouteRejectionReasonInput(''); }}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                          >
                            <ShieldCheck size={14} /> Aprovar Roteiro
                          </button>
                        )}
                        {!isRejected && (
                          <button 
                            onClick={() => { setPendingActionRoute({ route, action: 'reject' }); setRouteRejectionReasonInput(''); }}
                            className="flex-1 py-2.5 bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <XCircle size={14} className="text-amber-400" /> Rejeitar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {routes.filter(r => {
                const matchesFilter = 
                  routeFilterStatus === 'pendente' ? r.status === 'pendente' :
                  routeFilterStatus === 'aprovado' ? (r.status === 'aprovado' || !r.status) :
                  routeFilterStatus === 'rejeitado' ? r.status === 'rejeitado' : true;

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
                    {pendingActionRoute.action === 'approve' ? <UserCheck size={20} /> : <UserX size={20} />}
                  </span>
                  <h3 className="text-sm font-black uppercase italic text-white">
                    {pendingActionRoute.action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
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
                  Você está prestes a {pendingActionRoute.action === 'approve' ? <strong className="text-emerald-400 uppercase">Aprovar</strong> : <strong className="text-rose-400 uppercase">Rejeitar</strong>} o seguinte roteiro:
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <h4 className="font-black text-white italic uppercase text-sm">{pendingActionRoute.route.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin size={11} className="text-orange-500 shrink-0" />
                    {pendingActionRoute.route.mapsAddress}
                  </p>
                </div>

                {pendingActionRoute.action === 'reject' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Motivo da Rejeição (Será exibido ao autor):</label>
                    <textarea 
                      rows={3}
                      value={routeRejectionReasonInput}
                      onChange={(e) => setRouteRejectionReasonInput(e.target.value)}
                      placeholder="Descreva o motivo da recusa ou o que precisa ser corrigido..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
                    />
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
                  {pendingActionRoute.action === 'approve' ? 'Sim, Aprovar' : 'Sim, Rejeitar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT EVENT MODAL */}
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
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                    <input
                      type="text"
                      value={editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                      required
                    />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localização</label>
                    <input
                      type="text"
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Distância Percurso (KM)</label>
                    <input
                      type="number"
                      value={editingEvent.distance}
                      onChange={(e) => setEditingEvent({ ...editingEvent, distance: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data do Evento</label>
                    <input
                      type="date"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
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

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem de Capa</label>
                  <input
                    type="text"
                    value={editingEvent.image}
                    onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:border-amber-500 outline-none"
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase shadow-lg shadow-amber-600/20"
                  >
                    Salvar Alterações
                  </button>
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
                  onClick={handleConfirmRejectEvent}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase"
                >
                  Confirmar Rejeição
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
                      <XCircle size={12} /> REJEITAR
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
                    <input type="date" required value={newEventData.date || ''} onChange={e => setNewEventData({ ...newEventData, date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Horário:</label>
                    <input type="text" value={newEventData.time || '14:00'} onChange={e => setNewEventData({ ...newEventData, time: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Localização / Cidade:</label>
                  <input type="text" required value={newEventData.location || ''} onChange={e => setNewEventData({ ...newEventData, location: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Descrição:</label>
                  <textarea rows={2} value={newEventData.desc || ''} onChange={e => setNewEventData({ ...newEventData, desc: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold resize-none" />
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
                <button onClick={handleConfirmRejectPost} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-lg shadow-rose-600/20">Confirmar Rejeição</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW POST DETAILS MODAL */}
      <AnimatePresence>
        {viewingPostModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-amber-500" />
                  <span className="text-xs font-black uppercase text-white">DETALHES DA PUBLICAÇÃO</span>
                </div>
                <button onClick={() => setViewingPostModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={viewingPostModal.user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-800" alt={viewingPostModal.user.name} />
                  <div>
                    <p className="font-black uppercase text-white">{viewingPostModal.user.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">{viewingPostModal.user.role} • {viewingPostModal.timestamp}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-slate-200 leading-relaxed italic">"{viewingPostModal.content}"</p>
                </div>

                {viewingPostModal.image && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-60">
                    <img src={viewingPostModal.image} className="w-full h-full object-cover" alt="Midia" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg">
                    CATEGORIA: {viewingPostModal.category}
                  </span>
                  <span className="text-[9px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                    STATUS: {viewingPostModal.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                {viewingPostModal.status === 'pendente' && (
                  <button onClick={() => handleApprovePost(viewingPostModal.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl">Autorizar & Publicar</button>
                )}
                <button onClick={() => setViewingPostModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-xl">Fechar</button>
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

    </div>
  );
}
