import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  Calendar, 
  MapPin, 
  Navigation, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  Compass, 
  AlertTriangle, 
  Bookmark, 
  X, 
  Sparkles,
  Users,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Camera,
  Link as LinkIcon,
  Eye,
  Info,
  Edit3,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { isUserProOrBonificado } from '../lib/permissions';
import { UpgradeModal } from './UpgradeModal';
import { DateInput } from './DateInput';
import { clientDbService } from '../lib/dbService';

// Helper to format date cleanly
function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "Não informada";
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

// Helpers para filtro robusto de data
function normalizeDateStr(d?: string): string {
  if (!d) return '';
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return trimmed;
}

function matchesEventDate(evtDate?: string, evtEndDate?: string, filterDate?: string): boolean {
  if (!filterDate || !filterDate.trim()) return true;
  if (!evtDate) return false;

  const target = normalizeDateStr(filterDate);
  const start = normalizeDateStr(evtDate);
  const end = normalizeDateStr(evtEndDate);

  if (!target) return true;

  // Match exato na data inicial
  if (start === target) return true;

  // Evento com intervalo de datas [start, end]
  if (start && end && target >= start && target <= end) {
    return true;
  }

  // Fallback para correspondência textual
  const normFilter = filterDate.trim().toLowerCase();
  if (evtDate.toLowerCase().includes(normFilter) || (evtEndDate && evtEndDate.toLowerCase().includes(normFilter))) {
    return true;
  }

  return false;
}

// Core Event Interface
export interface MotoEvent {
  id: string;
  title: string;
  desc: string;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  location: string;
  distance: number; // in KM
  category: string;
  image: string;
  checkedIn: boolean;
  memberCount?: number;
  isCustomImage?: boolean;
  status?: 'aprovado' | 'pendente' | 'rejeitado';
  createdBy?: string;
  createdAt?: string;
  rejectionReason?: string;
}

// Helper to generate clean, crisp SVG vector cover data URLs for category templates
export const generateCategorySvgCover = (category: string) => {
  let accent1 = '%23ea580c'; // orange
  let accent2 = '%23f97316';
  let patternSvg = '';

  if (category === 'Festas & Encontros' || category === 'Festas e Encontros') {
    accent1 = '%23a855f7'; // purple / magenta
    accent2 = '%23f59e0b'; // amber / gold
    patternSvg = `
      <!-- Party stage spotlights, musical waves & festival lights -->
      <path d='M100 450 L350 80 L450 80 L700 450 Z' fill='none' stroke='${accent2}' stroke-width='3' opacity='0.25'/>
      <path d='M180 450 L370 110 L430 110 L620 450 Z' fill='none' stroke='${accent1}' stroke-width='2' opacity='0.3'/>
      <circle cx='400' cy='120' r='70' fill='none' stroke='${accent2}' stroke-width='2' stroke-dasharray='10,8' opacity='0.4'/>
      <path d='M80 340 Q 240 260 400 340 T 720 340' stroke='${accent2}' stroke-width='6' fill='none' opacity='0.7'/>
      <path d='M80 350 Q 240 270 400 350 T 720 350' stroke='%23ffffff' stroke-width='2' stroke-dasharray='12,12' fill='none' opacity='0.8'/>
      <circle cx='400' cy='220' r='14' fill='${accent1}'/>
    `;
  } else if (category === 'On-Road') {
    accent1 = '%230284c7'; // cyan / blue
    accent2 = '%2338bdf8';
    patternSvg = `
      <!-- Asphalt highway curves & speed lines -->
      <path d='M-50 400 Q 250 140 400 270 T 850 110' stroke='${accent2}' stroke-width='10' fill='none' opacity='0.75'/>
      <path d='M-50 410 Q 250 150 400 280 T 850 120' stroke='%23ffffff' stroke-width='3' stroke-dasharray='20,15' fill='none' opacity='0.85'/>
      <path d='M100 450 L350 180 L450 180 L700 450 Z' fill='none' stroke='${accent2}' stroke-width='3' opacity='0.25'/>
      <circle cx='620' cy='180' r='60' fill='none' stroke='${accent2}' stroke-width='2' opacity='0.2'/>
    `;
  } else if (category === 'Off-Road') {
    accent1 = '%23059669'; // emerald
    accent2 = '%2310b981';
    patternSvg = `
      <!-- Rugged mountains & trail contours -->
      <polygon points='0,450 180,210 380,450' fill='${accent1}' opacity='0.3'/>
      <polygon points='220,450 450,150 680,450' fill='${accent2}' opacity='0.25'/>
      <polygon points='500,450 680,240 850,450' fill='${accent1}' opacity='0.35'/>
      <path d='M0 380 L180 340 L340 370 L520 310 L680 350 L850 290' stroke='${accent2}' stroke-width='6' stroke-dasharray='12,8' fill='none'/>
    `;
  } else if (category === 'Misto') {
    accent1 = '%23d97706'; // amber
    accent2 = '%23f59e0b';
    patternSvg = `
      <!-- Hybrid asphalt road fading into mountain terrain -->
      <polygon points='350,450 520,220 720,450' fill='${accent1}' opacity='0.25'/>
      <path d='M-20 380 Q 300 180 820 310' stroke='${accent2}' stroke-width='8' fill='none' opacity='0.8'/>
      <path d='M-20 380 Q 300 180 820 310' stroke='%23ffffff' stroke-width='2' stroke-dasharray='16,12' fill='none' opacity='0.75'/>
      <circle cx='250' cy='220' r='90' fill='none' stroke='${accent1}' stroke-width='2' stroke-dasharray='8,6' opacity='0.3'/>
    `;
  } else {
    // Geral
    accent1 = '%23ea580c';
    accent2 = '%23f97316';
    patternSvg = `
      <!-- Compass rings & wide highway lines -->
      <circle cx='400' cy='225' r='150' fill='none' stroke='${accent2}' stroke-width='2' opacity='0.25' stroke-dasharray='12,8'/>
      <circle cx='400' cy='225' r='90' fill='none' stroke='${accent1}' stroke-width='1.5' opacity='0.2'/>
      <path d='M50 380 L400 190 L750 380' stroke='${accent2}' stroke-width='6' fill='none' opacity='0.5'/>
      <circle cx='400' cy='190' r='10' fill='${accent1}'/>
    `;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
    <defs>
      <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='%23090d16'/>
        <stop offset='60%' stop-color='%230f172a'/>
        <stop offset='100%' stop-color='%231e293b'/>
      </linearGradient>
      <linearGradient id='accent' x1='0%' y1='0%' x2='100%' y2='0%'>
        <stop offset='0%' stop-color='${accent1}'/>
        <stop offset='100%' stop-color='${accent2}'/>
      </linearGradient>
    </defs>
    <rect width='800' height='450' fill='url(%23bg)'/>
    ${patternSvg}
    <rect x='0' y='0' width='800' height='450' fill='black' opacity='0.2'/>
    <rect x='0' y='0' width='800' height='450' fill='url(%23accent)' opacity='0.08'/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const DEFAULT_FALLBACK_IMAGE = generateCategorySvgCover("Geral");

const CATEGORY_TAGS = ["Todos", "Geral", "Festas & Encontros", "On-Road", "Off-Road", "Misto"];

export function Events() {
  const { profile } = useAuth();
  const isVip = isUserProOrBonificado(profile);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [events, setEvents] = useState<MotoEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'explorar' | 'meus' | 'criar'>('explorar');

  const handleOpenCreateTab = () => {
    if (!isVip) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setActiveTab(activeTab === 'criar' ? 'explorar' : 'criar');
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<MotoEvent | null>(null);

  // Input refs for illuminated time pickers
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [editingEvent, setEditingEvent] = useState<MotoEvent | null>(null);

  // Cover image mode & custom upload state (apenas upload e url)
  const [coverSource, setCoverSource] = useState<'upload' | 'url'>('upload');
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Form State for creating events
  const [formData, setFormData] = useState({
    title: '',
    category: 'Geral',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    distance: '',
    desc: '',
    image: ''
  });

  // Category changes no longer overwrite image with suggestions
  const handleCategoryChange = (newCategory: string) => {
    setFormData(prev => ({
      ...prev,
      category: newCategory
    }));
  };

  // File Upload Handler (FileReader) for new events
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast("Selecione um arquivo de imagem válido (JPG, PNG, WebP)!", "info");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast("O arquivo de imagem deve ter no máximo 10MB.", "info");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setFormData(prev => ({ ...prev, image: dataUrl }));
        setIsCustomImage(true);
        triggerToast("Imagem personalizada carregada com sucesso!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // File Upload Handler for edit / approval modal
  const handleEditFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast("Selecione um arquivo de imagem válido (JPG, PNG, WebP)!", "info");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast("O arquivo de imagem deve ter no máximo 10MB.", "info");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setEditingEvent(prev => prev ? ({ ...prev, image: dataUrl, isCustomImage: true }) : null);
        triggerToast("Nova imagem de capa carregada para o evento!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setFormData(prev => ({ ...prev, image: customUrlInput.trim() }));
    setIsCustomImage(true);
    triggerToast("Link de imagem personalizado aplicado!", "success");
  };

  const handleResetCover = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setIsCustomImage(false);
    setCustomUrlInput('');
    triggerToast("Imagem de capa removida.", "info");
  };

  // Load events from Hostinger MySQL Database (com fallback resiliente de cache)
  useEffect(() => {
    let isMounted = true;
    clientDbService.events.getAll()
      .then((dbEvents) => {
        if (!isMounted) return;
        if (Array.isArray(dbEvents) && dbEvents.length > 0) {
          setEvents(dbEvents);
          localStorage.setItem('motolegado_events', JSON.stringify(dbEvents));
          return;
        }

        const saved = localStorage.getItem('motolegado_events');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const mockIds = ['e_pend_1', 'e_pend_2', 'e_fest_1', 'e_fest_2', 'e_sul_1', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5'];
            const cleaned = parsed.filter((evt: MotoEvent) => !mockIds.includes(evt.id));
            setEvents(cleaned);
            return;
          } catch {}
        }
        setEvents([]);
      })
      .catch((err) => {
        console.warn('[Events] Aviso ao carregar eventos do MySQL:', err);
        if (!isMounted) return;
        const saved = localStorage.getItem('motolegado_events');
        if (saved) {
          try {
            setEvents(JSON.parse(saved));
          } catch {}
        }
      });

    return () => { isMounted = false; };
  }, []);

  const saveEvents = (updatedEvents: MotoEvent[], eventToPersist?: MotoEvent) => {
    setEvents(updatedEvents);
    localStorage.setItem('motolegado_events', JSON.stringify(updatedEvents));

    // Sincroniza persistência com o MySQL da Hostinger
    if (eventToPersist) {
      clientDbService.events.save(eventToPersist).catch((e) => {
        console.warn('[Events] Aviso ao persistir evento no MySQL:', e);
      });
    }
  };

  const handleToggleCheckIn = (id: string) => {
    const updated = events.map(evt => {
      if (evt.id === id) {
        const checked = !evt.checkedIn;
        const currentCount = evt.memberCount || 10;
        return {
          ...evt,
          checkedIn: checked,
          memberCount: checked ? currentCount + 1 : Math.max(0, currentCount - 1)
        };
      }
      return evt;
    });

    saveEvents(updated);
    
    const target = updated.find(e => e.id === id);
    if (target?.checkedIn) {
      triggerToast(`Check-in confirmado em ${target.title}! +150 PTS adicionados! 🎟️`, 'success');
      window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
    } else if (target) {
      triggerToast(`Presença cancelada em: ${target.title}.`, 'info');
      window.dispatchEvent(new CustomEvent('motolegado_gamification_updated'));
    }
  };

  const handleSaveEditedEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!editingEvent.title.trim() || !editingEvent.location.trim() || !editingEvent.date.trim()) {
      triggerToast("Preencha os campos obrigatórios (Título, Local e Data)!", "info");
      return;
    }

    const updated = events.map(evt => evt.id === editingEvent.id ? editingEvent : evt);
    saveEvents(updated, editingEvent);
    triggerToast("Informações do evento salvas com sucesso!", "success");
    setEditingEvent(null);
  };

  const triggerToast = (message: string, type: 'success' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  const handleCreateEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim() || !formData.startDate.trim() || !formData.startTime.trim()) {
      triggerToast("Preencha todos os campos obrigatórios (*): Título, Local, Data Inicial e Horário Inicial!", "info");
      return;
    }

    // Format time display (e.g., "09:00 ÀS 18:00" or "16:00")
    let formattedTime = formData.startTime.toUpperCase();
    if (formData.endTime.trim()) {
      formattedTime += ` ÀS ${formData.endTime.toUpperCase()}`;
    }

    // Format date string
    let formattedDate = formData.startDate;

    const newEvent: MotoEvent = {
      id: 'e_' + Date.now(),
      title: formData.title.trim(),
      desc: formData.desc.trim() || "Sem descrição informada. O evento aguarda a presença da irmandade.",
      date: formattedDate,
      endDate: formData.endDate.trim() || undefined,
      time: formattedTime,
      endTime: formData.endTime.trim() || undefined,
      location: formData.location.trim(),
      distance: formData.distance === '' ? 0 : Number(formData.distance),
      category: formData.category,
      image: formData.image.trim() || DEFAULT_FALLBACK_IMAGE,
      checkedIn: true, // Auto check-in upon event creation
      memberCount: 1,
      status: 'pendente',
      createdBy: 'Usuário Cadastrado',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newEvent, ...events];
    saveEvents(updated, newEvent);
    
    triggerToast("Evento cadastrado com sucesso! Enviado para a fila de moderação no Centro de Comando e aguarda aprovação.", "success");
    setActiveTab('meus');
    
    // Reset form
    setFormData({
      title: '',
      category: 'Geral',
      location: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      distance: '',
      desc: '',
      image: ''
    });
    setIsCustomImage(false);
    setCoverSource('upload');
    setCustomUrlInput('');
  };

  // Helper filters
  const approvedEvents = events.filter(evt => evt.status === 'aprovado' || !evt.status);

  const filteredExploreEvents = approvedEvents.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || evt.category === selectedCategory;
    const matchesDate = matchesEventDate(evt.date, evt.endDate, selectedDateFilter);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const checkedInEvents = events.filter(evt => evt.checkedIn);
  const filteredCheckedInEvents = checkedInEvents.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || evt.category === selectedCategory;
    const matchesDate = matchesEventDate(evt.date, evt.endDate, selectedDateFilter);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalKmsChecked = checkedInEvents.reduce((acc, curr) => acc + curr.distance, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-800/60 pb-6 sm:pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            EVENTOS E <span className="text-orange-500">AVENTURAS</span>
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
            CRIAÇÃO, CHECK-INS E AGENDAMENTOS COLETIVOS PARA MOTOCICLISTAS
          </p>
        </div>

        {/* Action button inside header */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
          <button
            onClick={handleOpenCreateTab}
            className="btn-primary"
          >
            {isVip ? (
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Lock size={14} />
            )}
            <span>{activeTab === 'criar' ? "VER EVENTOS" : isVip ? "AGENDAR EVENTO" : "AGENDAR EVENTO (VIP PRO)"}</span>
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
              "fixed top-6 right-6 z-50 p-5 rounded-2xl flex items-center gap-4 shadow-2xl border backdrop-blur-md max-w-md",
              showToast.type === 'success' 
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100" 
                : "bg-slate-900/95 border-orange-500/40 text-orange-200"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              showToast.type === 'success' ? "bg-emerald-500 text-slate-950" : "bg-orange-500 text-slate-950"
            )}>
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Aviso da Central</p>
              <p className="text-xs font-bold mt-1 text-slate-300">{showToast.message}</p>
            </div>
            <button onClick={() => setShowToast(null)} className="text-slate-500 hover:text-white ml-2">
              <X size={14} />
            </button>
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
                    <select
                      value={editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 outline-none"
                    >
                      {CATEGORY_TAGS.filter(t => t !== 'Todos').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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
                    <DateInput
                      value={editingEvent.date}
                      onChange={(newDate) => setEditingEvent({ ...editingEvent, date: newDate })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-4 pr-12 text-sm font-bold text-white focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] filter" />
                      Horário
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingEvent.time}
                        onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-sm font-bold text-white focus:border-amber-500 outline-none"
                        placeholder="Ex: 09:00 ou 09:00 ÀS 18:00"
                        required
                      />
                      <Clock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* CAPA DO EVENTO: UPLOAD E URL NA APROVAÇÃO / EDIÇÃO */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <Camera size={14} className="text-amber-500" />
                      Imagem de Capa do Evento
                    </label>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      Upload local ou URL direta
                    </span>
                  </div>

                  {/* Pré-visualização da Capa */}
                  {editingEvent.image && (
                    <div className="relative rounded-xl overflow-hidden aspect-video max-h-48 border border-slate-800 bg-slate-950 group">
                      <img 
                        src={editingEvent.image} 
                        alt="Capa do evento" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50">
                          Pré-visualização da Capa
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, image: '' })}
                          title="Remover imagem"
                          className="p-1 rounded bg-slate-900/90 text-rose-400 hover:text-rose-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} /> Remover
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ações de Upload e URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Botão de Upload Local */}
                    <div>
                      <label 
                        htmlFor="edit-event-cover-file"
                        className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Upload size={14} className="text-amber-400" />
                        <span>Fazer Upload da Capa</span>
                      </label>
                      <input 
                        ref={editFileInputRef}
                        id="edit-event-cover-file"
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleEditFileUpload(file);
                        }}
                        className="hidden"
                      />
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1 text-center">
                        PNG, JPG, WEBP (até 10MB)
                      </p>
                    </div>

                    {/* Campo de URL Direta */}
                    <div className="space-y-1">
                      <div className="relative">
                        <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="url"
                          placeholder="Ou cole a URL direta..."
                          value={editingEvent.image}
                          onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 pl-8 pr-3 text-xs font-mono text-slate-200 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                        />
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center">
                        Link web da imagem
                      </p>
                    </div>
                  </div>
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
                    className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TELEMETRIA DE EVENTOS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bento-card border-slate-800/50 bg-slate-900/40 p-4 sm:p-6 flex items-center justify-between group rounded-2xl sm:rounded-3xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EVENTOS APROVADOS</span>
            <div className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter group-hover:text-orange-500 transition-colors">
              {approvedEvents.length}
            </div>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">DISPONÍVEIS NA COMUNIDADE</p>
          </div>
          <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 group-hover:border-orange-500 transition-all shrink-0">
            <Compass size={20} className="text-orange-500" />
          </div>
        </div>

        <div className="bento-card border-slate-800/50 bg-slate-900/40 p-4 sm:p-6 flex items-center justify-between group rounded-2xl sm:rounded-3xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MINHAS ADESÕES</span>
            <div className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter group-hover:text-emerald-500 transition-colors">
              {checkedInEvents.length}
            </div>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">PRONTO PARA ENVELOCER</p>
          </div>
          <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 group-hover:border-emerald-500 transition-all shrink-0">
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
        </div>

        <div className="bento-card border-slate-800/50 bg-slate-900/40 p-4 sm:p-6 flex items-center justify-between group rounded-2xl sm:rounded-3xl sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KM TOTAL AGENDADO</span>
            <div className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter group-hover:text-blue-500 transition-colors">
              {totalKmsChecked} <span className="text-xs text-slate-500 not-italic">KM</span>
            </div>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">ESTRADA PREVISTA NA SESSÃO</p>
          </div>
          <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 group-hover:border-blue-500 transition-all shrink-0">
            <Navigation size={20} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* CORE TAB NAVIGATION */}
      <div className="flex border-b border-slate-800/60 max-w-2xl overflow-x-auto scrollbar-none w-full">
        <button
          onClick={() => setActiveTab('explorar')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-4 transition-all relative group shrink-0",
            activeTab === 'explorar' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 font-black italic uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] transition-all whitespace-nowrap",
            activeTab === 'explorar' ? "scale-105 sm:scale-110" : "opacity-70 group-hover:opacity-100"
          )}>
            <Compass size={13} className={activeTab === 'explorar' ? 'text-orange-500 animate-[pulse_2s_infinite]' : 'text-slate-400'} />
            EXPLORAR EVENTOS
          </div>
          {activeTab === 'explorar' && (
            <motion.div 
              layoutId="activeEventTab" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('meus')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-4 transition-all relative group shrink-0",
            activeTab === 'meus' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 font-black italic uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] transition-all whitespace-nowrap",
            activeTab === 'meus' ? "scale-105 sm:scale-110" : "opacity-70 group-hover:opacity-100"
          )}>
            <Bookmark size={13} />
            MEUS CHECK-INS
          </div>
          {activeTab === 'meus' && (
            <motion.div 
              layoutId="activeEventTab" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
            />
          )}
        </button>

        <button
          onClick={handleOpenCreateTab}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-4 transition-all relative group shrink-0",
            activeTab === 'criar' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 font-black italic uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] transition-all whitespace-nowrap",
            activeTab === 'criar' ? "scale-105 sm:scale-110" : "opacity-70 group-hover:opacity-100"
          )}>
            {isVip ? <Plus size={13} /> : <Lock size={12} className="text-amber-400" />}
            <span>AGENDAR {isVip ? '' : '(PRO)'}</span>
          </div>
          {activeTab === 'criar' && (
            <motion.div 
              layoutId="activeEventTab" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
            />
          )}
        </button>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      {activeTab !== 'criar' && (
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center bg-slate-900/30 p-3.5 sm:p-4 border border-slate-800/60 rounded-2xl sm:rounded-3xl backdrop-blur-sm shadow-inner">
            {/* Categories Selector */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {CATEGORY_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedCategory(tag)}
                  className={cn(
                    "text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 shrink-0 transition-all rounded-xl font-bold",
                    selectedCategory === tag ? "btn-filter-active" : "btn-filter-inactive"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Inputs: Date Filter & Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              {/* Date Filter */}
              <div className="relative min-w-[190px] sm:w-52">
                <DateInput 
                  value={selectedDateFilter}
                  onChange={(newDate) => setSelectedDateFilter(newDate)}
                  placeholder="Filtrar por data..."
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl py-3 pl-4 pr-12 text-xs font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all w-full text-white placeholder:text-slate-400 font-mono"
                />
                {selectedDateFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter('')}
                    title="Limpar filtro de data"
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative group w-full sm:w-64 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar título, local..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl py-3 pl-12 pr-9 text-xs font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all w-full text-white placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedDateFilter || selectedCategory !== 'Todos' || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                Filtros ativos:
              </span>
              {selectedDateFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold font-mono">
                  <Calendar size={12} className="text-orange-500" />
                  Data: {formatDisplayDate(selectedDateFilter)}
                  <button 
                    type="button" 
                    onClick={() => setSelectedDateFilter('')} 
                    className="hover:text-white ml-0.5 text-orange-400 hover:bg-orange-500/20 rounded-full p-0.5 cursor-pointer"
                    title="Remover filtro de data"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedCategory !== 'Todos' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  Categoria: {selectedCategory}
                  <button 
                    type="button" 
                    onClick={() => setSelectedCategory('Todos')} 
                    className="hover:text-white ml-0.5 text-slate-400 hover:bg-slate-700 rounded-full p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  Busca: "{searchTerm}"
                  <button 
                    type="button" 
                    onClick={() => setSearchTerm('')} 
                    className="hover:text-white ml-0.5 text-slate-400 hover:bg-slate-700 rounded-full p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedDateFilter('');
                  setSelectedCategory('Todos');
                  setSearchTerm('');
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-400 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO TAB */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: EXPLORAR EVENTS */}
        {activeTab === 'explorar' && (
          <motion.div
            key="explorar-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {filteredExploreEvents.map((evt) => (
              <motion.div 
                key={evt.id}
                whileHover={{ y: -6 }}
                className="bento-card p-0 overflow-hidden group border-slate-800/60 bg-slate-900/30 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Upper banner section */}
                <div 
                  onClick={() => setSelectedEventDetails(evt)}
                  className="relative h-48 overflow-hidden cursor-pointer group/cover"
                  title="Clique para ver detalhes do evento"
                >
                  <img 
                    src={evt.image} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/cover:scale-105" 
                    alt={evt.title} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="text-[8px] font-black text-white px-3 py-1 bg-orange-600/90 backdrop-blur-md rounded-full uppercase tracking-[0.2em] italic border border-orange-400/30">
                      {evt.category}
                    </span>
                  </div>

                  {/* Rating / Metricas */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[9px] font-black text-white flex items-center gap-1.5">
                      <Users size={12} className="text-orange-500" />
                      {evt.memberCount || 10} INTEGRANTES
                    </span>
                  </div>

                  {/* Info inside cover */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md group-hover/cover:text-orange-400 transition-colors flex items-center gap-2">
                        {evt.title}
                        <Eye size={16} className="opacity-0 group-hover/cover:opacity-100 transition-opacity text-orange-400 shrink-0" />
                      </h3>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1 drop-shadow-sm">
                        <MapPin size={11} className="text-orange-500 shrink-0" />
                        {evt.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lower details section */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                    "{evt.desc}"
                  </p>

                  <div className="flex items-center justify-between border-y border-slate-800/50 py-3.5 bg-slate-950/20 px-4 -mx-4 text-center">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">DISTÂNCIA / PERCURSO</span>
                      <span className="text-xs font-black text-white italic tracking-tight uppercase">
                        {evt.distance === 0 ? "ESTÁTICO / NO LOCAL" : `${evt.distance} KM`}
                      </span>
                    </div>

                    <div className="w-[1px] h-6 bg-slate-800" />

                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">DATA E HORA</span>
                      <span className="text-xs font-black text-white italic tracking-tight uppercase flex items-center justify-center gap-1.5">
                        <Clock size={12} className="text-orange-500 shrink-0" />
                        {formatDisplayDate(evt.date)} - {evt.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside individual event card */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEventDetails(evt)}
                      className="py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-orange-500 hover:bg-slate-900 text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all italic"
                    >
                      <Eye size={13} className="text-orange-500" />
                      VER DETALHES
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleToggleCheckIn(evt.id)}
                      className={cn(
                        "py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all italic border",
                        evt.checkedIn
                          ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-red-600/20 hover:text-red-300 hover:border-red-600/50"
                          : "bg-orange-600 border-orange-500 text-white hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-600/20"
                      )}
                    >
                      {evt.checkedIn ? (
                        <>
                          <CheckCircle size={13} className="animate-pulse" />
                          CHECADO
                        </>
                      ) : (
                        <>
                          <Navigation size={13} />
                          CHECK-IN
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredExploreEvents.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle size={32} className="text-slate-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-400 italic uppercase">ESTRADA CURVADA</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">NENHUM EVENTO ENCONTRADO DESIGNADO PARA ESSA CATEGORIA</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: MEUS COMPROMISSOS */}
        {activeTab === 'meus' && (
          <motion.div
            key="meus-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {filteredCheckedInEvents.map((evt) => (
              <motion.div 
                key={evt.id}
                whileHover={{ y: -6 }}
                className="bento-card p-0 overflow-hidden group border-emerald-500/20 bg-emerald-950/5 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Upper banner section */}
                <div 
                  onClick={() => setSelectedEventDetails(evt)}
                  className="relative h-44 overflow-hidden cursor-pointer group/cover"
                  title="Clique para ver detalhes do evento"
                >
                  <img 
                    src={evt.image} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/cover:scale-105" 
                    alt={evt.title} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="text-[8px] font-black text-white px-3 py-1 bg-emerald-600/90 backdrop-blur-md rounded-full uppercase tracking-[0.2em] italic border border-emerald-400/30">
                      {evt.category}
                    </span>
                  </div>

                  {/* Info inside cover */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover/cover:text-orange-400 transition-colors flex items-center gap-2">
                        {evt.title}
                        <Eye size={15} className="opacity-0 group-hover/cover:opacity-100 transition-opacity text-orange-400 shrink-0" />
                      </h3>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1">
                        <MapPin size={11} className="text-emerald-500 shrink-0" />
                        {evt.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lower details section */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                    "{evt.desc}"
                  </p>

                  <div className="flex items-center justify-between border-y border-slate-800/50 py-3 bg-slate-950/30 px-4 -mx-4 text-center">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">PERCURSO</span>
                      <span className="text-xs font-black text-white italic tracking-tight">
                        {evt.distance === 0 ? "ESTÁTICO / NO LOCAL" : `${evt.distance} KM`}
                      </span>
                    </div>

                    <div className="w-[1px] h-6 bg-slate-800" />

                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">CHECK-IN CONFIRMADO</span>
                      <span className="text-xs font-black text-emerald-400 italic tracking-tight flex items-center justify-center gap-1.5 uppercase">
                        <CheckCircle size={12} />
                        {formatDisplayDate(evt.date)} - {evt.time}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEventDetails(evt)}
                      className="py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:border-orange-500 hover:bg-slate-900 text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all italic"
                    >
                      <Eye size={13} className="text-orange-500" />
                      VER DETALHES
                    </button>

                    <button 
                      type="button" 
                      onClick={() => handleToggleCheckIn(evt.id)}
                      className="py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[9px] font-black uppercase tracking-[0.15em] text-red-500 hover:bg-red-600/10 hover:border-red-600/40 hover:text-red-400 transition-all italic flex items-center justify-center gap-1.5"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredCheckedInEvents.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Bookmark size={32} className="text-slate-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-400 italic uppercase">AGENDA VAZIA</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                    {checkedInEvents.length > 0 
                      ? "NENHUM CHECK-IN ENCONTRADO PARA OS FILTROS SELECIONADOS"
                      : "VOCÊ NÃO REALIZOU NENHUM CHECK-IN EM EVENTOS RECENTES"}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: CADASTRO / CRIAR SEU EVENTO */}
        {activeTab === 'criar' && !isVip ? (
          <motion.div
            key="criar-tab-locked"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-orange-500/30 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto space-y-6 my-8"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase text-white">RECURSO EXCLUSIVO PRO / BONIFICADO</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                No Plano Gratuito você tem acesso à visualização de todos os eventos públicos e confirmação de presença. Para cadastrar e agendar eventos coletivos para a comunidade, ative o MotoLegado Pro ou solicite o Modo Bonificado à administração.
              </p>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="btn-primary"
            >
              Desbloquear Agendamento de Eventos
            </button>
          </motion.div>
        ) : activeTab === 'criar' && (
          <motion.div
            key="criar-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Form Column */}
            <form onSubmit={handleCreateEvent} className="lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={18} className="text-orange-500 animate-pulse" />
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">AGENDE O SEU EVENTO</h3>
              </div>

              {/* 1. TÍTULO DO EVENTO (Obrigatório) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-1">
                  Título do Evento <span className="text-orange-500 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 1º MotoFest Rock & Beer ou Bate-Volta Serra do Mar"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-white" 
                />
              </div>

              {/* 2. CATEGORIA DO EVENTO */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">
                  Categoria do Evento
                </label>
                <div className="relative">
                  <select 
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none cursor-pointer text-white appearance-none pr-10"
                  >
                    <option value="Geral">Geral (Confraternizações & Passeios em Geral)</option>
                    <option value="Festas & Encontros">Festas & Encontros (Rock Shows, Churrascos, Feiras & Aniversários MC)</option>
                    <option value="On-Road">On-Road (Asfalto, Rodovias e Serras Pavimentadas)</option>
                    <option value="Off-Road">Off-Road (Terra, Trilha e Rali)</option>
                    <option value="Misto">Misto (Asfalto + Terra / Terrenos Variados)</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    ▼
                  </div>
                </div>
              </div>

              {/* 3. LOCAL DO EVENTO (Obrigatório) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-1">
                  Local do Evento <span className="text-orange-500 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Sede MC Lendas - Curitiba, PR ou Parque de Eventos"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-white" 
                />
              </div>

              {/* 4 & 5. DATA INICIAL (Obrigatório) e DATA FINAL (Opcional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-1">
                    Data Inicial <span className="text-orange-500 font-bold">*</span>
                  </label>
                  <DateInput 
                    required
                    value={formData.startDate}
                    onChange={(newDate) => setFormData({...formData, startDate: newDate})}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-5 pr-14 text-sm font-bold focus:border-orange-500 outline-none transition-all text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">
                    Data Final <span className="text-slate-600 font-normal">(Opcional)</span>
                  </label>
                  <DateInput 
                    value={formData.endDate}
                    onChange={(newDate) => setFormData({...formData, endDate: newDate})}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-5 pr-14 text-sm font-bold focus:border-orange-500 outline-none transition-all text-white" 
                  />
                </div>
              </div>

              {/* 6 & 7. HORÁRIO INICIAL (Obrigatório) e HORÁRIO FINAL (Opcional) com Ícones Iluminados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-1.5">
                    <Clock size={12} className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.85)] filter" />
                    Horário Inicial <span className="text-orange-500 font-bold">*</span>
                  </label>
                  <div className="relative group/time">
                    <input 
                      ref={startTimeInputRef}
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-5 pr-14 text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-white font-mono [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:drop-shadow-[0_0_6px_rgba(249,115,22,0.9)]" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          startTimeInputRef.current?.showPicker();
                        } catch {
                          startTimeInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all cursor-pointer group-hover/time:scale-110"
                      title="Selecionar horário inicial"
                    >
                      <Clock size={20} className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.95)] filter stroke-[2.2]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2 flex items-center gap-1.5">
                    <Clock size={12} className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.85)] filter" />
                    Horário Final <span className="text-slate-600 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative group/time">
                    <input 
                      ref={endTimeInputRef}
                      type="time" 
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-5 pr-14 text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-white font-mono [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:drop-shadow-[0_0_6px_rgba(249,115,22,0.9)]" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          endTimeInputRef.current?.showPicker();
                        } catch {
                          endTimeInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all cursor-pointer group-hover/time:scale-110"
                      title="Selecionar horário final"
                    >
                      <Clock size={20} className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.95)] filter stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 8. DISTÂNCIA ESTIMADA (KM) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">
                  Distância Estimada (KM) <span className="text-slate-600 font-normal">(0 para festas e encontros estáticos no local)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="Ex: 0 (evento estático) ou 140 (passeio/comboio)"
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-white" 
                />
              </div>

              {/* 9. PROGRAMAÇÃO / DETALHES / ATRAÇÕES */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">
                  Programação / Detalhes / Atrações
                </label>
                <textarea 
                  placeholder="Detalhamento do evento: bandas ao vivo, food trucks, chopp artesanal, churrasco, área de camping, troféus para MCs, pontos de encontro ou regras."
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 min-h-[140px] resize-none text-white leading-relaxed" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-orange-700 to-orange-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] hover:from-orange-600 hover:to-orange-400 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_20px_40px_-10px_rgba(255,85,0,0.35)] relative overflow-hidden group"
              >
                PUBLICAR EVENTO
              </button>
            </form>

            {/* Thumbnail & Custom Upload Panel (Apenas Upload e URL) */}
            <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Camera size={18} className="text-orange-500" />
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Capa do Evento</h3>
                  </div>
                  {formData.image && (
                    <span className="text-[8px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md flex items-center gap-1">
                      <Check size={10} /> Imagem Definida
                    </span>
                  )}
                </div>

                {/* CURRENT COVER PREVIEW */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group shadow-inner">
                  <img 
                    src={formData.image || DEFAULT_FALLBACK_IMAGE} 
                    alt="Pré-visualização da Capa" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50">
                      {formData.image ? (coverSource === 'upload' ? "Imagem por Upload" : "Imagem por URL") : "Capa Padrão (Sem foto custom)"}
                    </span>
                    {formData.image && (
                      <button 
                        type="button"
                        onClick={handleResetCover}
                        title="Remover imagem personalizada"
                        className="p-1.5 bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB SWITCHER: UPLOAD vs URL */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCoverSource('upload')}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      coverSource === 'upload' 
                        ? "bg-slate-900 text-orange-500 shadow-md border border-slate-700/60" 
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <Upload size={12} />
                    Upload da Capa
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource('url')}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      coverSource === 'url' 
                        ? "bg-slate-900 text-orange-500 shadow-md border border-slate-700/60" 
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <LinkIcon size={12} />
                    URL da Imagem
                  </button>
                </div>

                {/* CONTENT AREA FOR COVER SELECTION */}
                {coverSource === 'upload' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* DRAG & DROP / FILE INPUT */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5",
                        isDragging 
                          ? "border-orange-500 bg-orange-500/10" 
                          : "border-slate-800 hover:border-orange-500/50 bg-slate-950/50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500 shadow-md">
                        <Upload size={20} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                        Arraste sua foto de capa aqui
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                        Formatos JPG, PNG ou WEBP até 10MB
                      </p>
                      <label 
                        htmlFor="event-cover-file-input"
                        className="mt-1 px-4 py-2.5 bg-slate-900 hover:bg-orange-600 border border-slate-700 hover:border-orange-500 text-slate-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Carregar Imagem do Dispositivo
                      </label>
                      <input 
                        id="event-cover-file-input"
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <LinkIcon size={12} className="text-orange-500" /> Link direto da imagem (URL Web)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        placeholder="https://exemplo.com/foto-do-evento.jpg"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:border-orange-500 outline-none text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-xs font-black uppercase text-white rounded-xl transition-all cursor-pointer shadow-md shadow-orange-600/20 active:scale-95"
                      >
                        Aplicar
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      Cole o link direto da imagem hospedada na web
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-slate-500">
                <p className="text-[9px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 text-orange-500/80">
                  <AlertTriangle size={12} /> FOTOS DA COMUNIDADE
                </p>
                <p className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">
                  Imagens enviadas por criadores de eventos ficam visíveis para todos os participantes ao explorar e realizar check-in no mapa de comboios.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* READ-ONLY EVENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedEventDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedEventDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]"
            >
              {/* Top Modal Bar */}
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Info size={18} className="text-orange-500" />
                  <h2 className="text-lg font-black uppercase italic tracking-tighter text-white">
                    DETALHES DO EVENTO
                  </h2>
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
                    Somente Leitura
                  </span>
                  {selectedEventDetails.status === 'pendente' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-950 text-amber-300 border border-amber-500/40">
                      Pendente de Aprovação
                    </span>
                  )}
                  {(selectedEventDetails.status === 'aprovado' || !selectedEventDetails.status) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Aprovado
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventDetails(null)}
                  className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
                {/* Banner / Cover Section */}
                <div className="relative h-56 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-800/80 shrink-0">
                  <img
                    src={selectedEventDetails.image}
                    alt={selectedEventDetails.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="text-[9px] font-black text-white px-3.5 py-1.5 bg-orange-600/90 backdrop-blur-md rounded-full uppercase tracking-[0.2em] italic border border-orange-400/30 shadow-lg">
                      {selectedEventDetails.category}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] font-black text-white flex items-center gap-1.5 shadow-lg">
                      <Users size={12} className="text-orange-500" />
                      {selectedEventDetails.memberCount || 10} INTEGRANTES CONFIRMADUS
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                      {selectedEventDetails.title}
                    </h1>
                    <p className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-2 drop-shadow">
                      <MapPin size={13} className="text-orange-500 shrink-0" />
                      {selectedEventDetails.location}
                    </p>
                  </div>
                </div>

                {/* Grid of Event Fields (Read-Only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      LOCAL / CIDADE
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin size={13} className="text-orange-500 shrink-0" />
                      {selectedEventDetails.location}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      DATA INICIAL
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar size={13} className="text-orange-500 shrink-0" />
                      {formatDisplayDate(selectedEventDetails.date)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      DATA FINAL
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar size={13} className="text-orange-500/60 shrink-0" />
                      {selectedEventDetails.endDate ? formatDisplayDate(selectedEventDetails.endDate) : "Mesmo dia"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      HORÁRIO INICIAL / SAÍDA
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] filter shrink-0" />
                      {selectedEventDetails.time}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      HORÁRIO FINAL
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] filter shrink-0" />
                      {selectedEventDetails.endTime || "Não especificado"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      DISTÂNCIA ESTIMADA
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Navigation size={13} className="text-orange-500 shrink-0" />
                      {selectedEventDetails.distance === 0 ? "Estático / No Local (0 KM)" : `${selectedEventDetails.distance} KM`}
                    </span>
                  </div>
                </div>

                {/* Programação / Detalhes / Atrações Section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-500" />
                    PROGRAMAÇÃO / DETALHES / ATRAÇÕES
                  </h4>
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-line italic">
                    "{selectedEventDetails.desc}"
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="p-6 border-t border-slate-800/80 bg-slate-950/80 shrink-0 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCheckIn(selectedEventDetails.id);
                    setSelectedEventDetails(prev => prev ? { ...prev, checkedIn: !prev.checkedIn } : null);
                  }}
                  className={cn(
                    "py-3.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all italic border",
                    selectedEventDetails.checkedIn
                      ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-red-600/20 hover:text-red-300"
                      : "bg-orange-600 border-orange-500 text-white hover:bg-orange-500 shadow-lg shadow-orange-600/20"
                  )}
                >
                  {selectedEventDetails.checkedIn ? (
                    <>
                      <CheckCircle size={15} />
                      CHECADO (CLIQUE P/ CANCELAR)
                    </>
                  ) : (
                    <>
                      <Navigation size={15} />
                      CONFIRMAR CHECK-IN NESTE EVENTO
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEventDetails(null)}
                  className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all italic"
                >
                  FECHAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature="criar_evento" 
      />
    </div>
  );
}
