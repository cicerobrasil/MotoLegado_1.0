import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { 
  Store, 
  MapPin, 
  Tag, 
  Search, 
  Plus, 
  X, 
  Flame, 
  Percent, 
  UtensilsCrossed, 
  Wrench, 
  Award, 
  Sparkles, 
  Phone, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Compass,
  GraduationCap,
  Upload,
  Image as ImageIcon,
  Eye,
  UserCheck,
  MessageSquare,
  Star,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export interface PartnerManager {
  name: string;
  avatar?: string;
  phone?: string;
  whatsapp?: string;
}

export interface PartnerPost {
  id: string;
  author: {
    name: string;
    photo: string;
    role?: string;
    isOwner?: boolean;
  };
  type: 'announcement' | 'review' | 'checkin' | 'general';
  content: string;
  timestamp: string;
  likes: number;
  comments?: number;
  image?: string;
}

// Partner Establishment Interface
export interface Partner {
  id: string;
  name: string;
  category: 'Oficina' | 'Bar e Point' | 'Hospedagem' | 'Acessórios' | 'Combustível' | 'Cursos e Treinamentos' | 'Serviços' | 'Alimentação';
  location: string;
  discount: string; // e.g., "15% de desconto em customizações de escapamento"
  news: string; // Latest update/news
  image: string; // Beautiful unsplash presentation banner or uploaded logo/photo
  corporateContact?: string; // Nome do Contato/Setor Corporativo
  phone: string; // Telefone Corporativo
  whatsapp?: string; // WhatsApp Corporativo
  website?: string; // Site oficial do parceiro
  rating: number;
  highlight: boolean;
  mapUrl?: string; // Google Maps URL (optional)
  responsible?: PartnerManager;
  posts?: PartnerPost[];
  status?: 'aprovado' | 'pendente' | 'rejeitado';
}

const PRESETS_IMAGE = [
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1521485950395-bcfb8fc9bc06?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=600"
];

const CATEGORIES: Partner['category'][] = [
  "Bar e Point",
  "Alimentação",
  "Oficina",
  "Serviços",
  "Acessórios",
  "Cursos e Treinamentos",
  "Hospedagem",
  "Combustível"
];

export function Partners() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'register'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<Partner['category'] | 'Todos'>('Todos');
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Registration Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Partner['category']>('Bar e Point');
  const [formLocation, setFormLocation] = useState('');
  const [formMapUrl, setFormMapUrl] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formNews, setFormNews] = useState('');
  const [formCorporateContact, setFormCorporateContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formImage, setFormImage] = useState(PRESETS_IMAGE[0]);
  const [formManagerName, setFormManagerName] = useState('');
  const [formManagerPhone, setFormManagerPhone] = useState('');

  // Mural State inside Details Modal
  const [newMuralContent, setNewMuralContent] = useState('');
  const [newMuralType, setNewMuralType] = useState<'announcement' | 'review' | 'checkin' | 'general'>('general');

  // Sync with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('motolegado_partners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mockIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const cleaned = Array.isArray(parsed) 
          ? parsed.filter((p: Partner) => !mockIds.includes(p.id) && !p.name?.includes('Aço & Fogo') && !p.name?.includes('Minha Empresa'))
          : [];
        setPartners(cleaned);
        localStorage.setItem('motolegado_partners', JSON.stringify(cleaned));
      } catch (e) {
        setPartners([]);
        localStorage.setItem('motolegado_partners', JSON.stringify([]));
      }
    } else {
      setPartners([]);
      localStorage.setItem('motolegado_partners', JSON.stringify([]));
    }
  }, []);

  const savePartners = (list: Partner[]) => {
    setPartners(list);
    localStorage.setItem('motolegado_partners', JSON.stringify(list));
  };

  const triggerToast = (message: string, type: 'success' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("Imagem muito grande! Por favor envie um arquivo com até 5MB.", "info");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImage(reader.result);
          triggerToast("Foto/Logomarca carregada com sucesso!", "success");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMuralPost = () => {
    if (!selectedPartner || !newMuralContent.trim()) return;

    const newPost: PartnerPost = {
      id: 'post_' + Date.now(),
      author: {
        name: "Piloto Convidado",
        photo: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
        role: "Membro da Comunidade",
        isOwner: false
      },
      type: newMuralType,
      content: newMuralContent.trim(),
      timestamp: "Agora mesmo",
      likes: 0
    };

    const updatedPosts = [newPost, ...(selectedPartner.posts || [])];
    const updatedPartner = { ...selectedPartner, posts: updatedPosts };

    setSelectedPartner(updatedPartner);
    const updatedList = partners.map(p => p.id === selectedPartner.id ? updatedPartner : p);
    savePartners(updatedList);
    setNewMuralContent('');
    triggerToast("Sua publicação foi adicionada ao mural!", "success");
  };

  const handleLikeMuralPost = (postId: string) => {
    if (!selectedPartner) return;
    const updatedPosts = (selectedPartner.posts || []).map(p => {
      if (p.id === postId) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    });
    const updatedPartner = { ...selectedPartner, posts: updatedPosts };
    setSelectedPartner(updatedPartner);
    const updatedList = partners.map(p => p.id === selectedPartner.id ? updatedPartner : p);
    savePartners(updatedList);
  };

  const handleRegisterPartner = (e: FormEvent) => {
    e.preventDefault();
    if (!formName || !formLocation || !formDiscount) {
      triggerToast("Por favor, preencha todos os campos fundamentais!", "info");
      return;
    }

    const managerName = formManagerName.trim() || "Piloto Responsável";
    const managerPhone = formManagerPhone.trim() || formWhatsapp || formPhone || "(41) 98877-6655";

    const initialPosts: PartnerPost[] = formNews.trim() ? [
      {
        id: "post_init_" + Date.now(),
        author: {
          name: managerName,
          photo: formImage,
          role: "Responsável",
          isOwner: true
        },
        type: "announcement",
        content: formNews.trim(),
        timestamp: "Recém-publicado",
        likes: 1
      }
    ] : [];

    const newPartner: Partner = {
      id: 'p_' + Date.now(),
      name: formName,
      category: formCategory,
      location: formLocation,
      mapUrl: formMapUrl.trim() || undefined,
      discount: formDiscount,
      news: formNews || "Nenhuma novidade no momento. Faça-nos uma visita de moto!",
      image: formImage,
      corporateContact: formCorporateContact.trim() || undefined,
      phone: formPhone || "(41) 3333-0000",
      whatsapp: formWhatsapp || formPhone || "(41) 99999-9999",
      website: formWebsite.trim() || undefined,
      rating: 5.0, // New partners start with a warm welcome!
      highlight: false,
      status: 'pendente', // Requires moderation authorization in CommandCenter
      responsible: {
        name: managerName,
        avatar: formImage,
        phone: managerPhone,
        whatsapp: managerPhone
      },
      posts: initialPosts
    };

    const updated = [newPartner, ...partners];
    savePartners(updated);
    triggerToast(`Solicitação de homologação de "${formName}" enviada com sucesso! Aguardando autorização no Centro de Comando.`, "success");

    // Clear form
    setFormName('');
    setFormLocation('');
    setFormMapUrl('');
    setFormDiscount('');
    setFormNews('');
    setFormCorporateContact('');
    setFormPhone('');
    setFormWhatsapp('');
    setFormWebsite('');
    setFormManagerName('');
    setFormManagerPhone('');
    setFormImage(PRESETS_IMAGE[Math.floor(Math.random() * PRESETS_IMAGE.length)]);
    
    // Switch back to view list
    setActiveTab('browse');
  };

  const handleToggleHighlight = (id: string) => {
    const updated = partners.map(p => {
      if (p.id === id) {
        const nextState = !p.highlight;
        triggerToast(`Status do parceiro atualizado! Destaque: ${nextState ? "ATIVADO" : "DESATIVADO"}`, "success");
        return { ...p, highlight: nextState };
      }
      return p;
    });
    savePartners(updated);
  };

  // Filter strategy - Only show approved/homologated partners to the public
  const filtered = partners.filter(p => {
    const isApproved = p.status === 'aprovado' || !p.status;
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.discount.toLowerCase().includes(search.toLowerCase()) ||
      p.news.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

    return isApproved && matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: Partner['category']) => {
    switch (cat) {
      case 'Oficina': return <Wrench className="text-orange-500" size={16} />;
      case 'Bar e Point': return <UtensilsCrossed className="text-orange-500" size={16} />;
      case 'Alimentação': return <UtensilsCrossed className="text-amber-500" size={16} />;
      case 'Hospedagem': return <MapPin className="text-orange-500" size={16} />;
      case 'Acessórios': return <Award className="text-orange-500" size={16} />;
      case 'Combustível': return <Compass className="text-blue-400" size={16} />;
      case 'Cursos e Treinamentos': return <GraduationCap className="text-emerald-400" size={16} />;
      case 'Serviços': return <Sparkles className="text-purple-400" size={16} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-800/60 pb-6 sm:pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            REDE DE <span className="text-orange-500">PARCEIROS</span>
          </h1>
          <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
            LOJAS, OFICINAS, POINTS TEMÁTICOS E DESCONTOS EXCLUSIVOS NA ESTRADA
          </p>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'register' ? 'browse' : 'register')}
          className="px-6 py-3 bg-slate-900 border border-orange-500/30 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white hover:border-orange-500 transition-all flex items-center justify-center gap-2 group self-start md:self-end shadow-xl"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          {activeTab === 'register' ? "Listar Parceiros" : "Cadastrar Meu Estabelecimento"}
        </button>
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
            <div className="w-8 h-8 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center shrink-0">
              <Check size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Notificação de Rede</p>
              <p className="text-xs font-bold mt-1 text-slate-300">{showToast.message}</p>
            </div>
            <button onClick={() => setShowToast(null)} className="text-slate-500 hover:text-white ml-2">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="flex border-b border-slate-800/60 max-w-xs">
        <button
          onClick={() => setActiveTab('browse')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 transition-all relative group",
            activeTab === 'browse' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <span className="text-[10px] font-black italic uppercase tracking-[0.2em] flex items-center gap-2">
            <Store size={13} />
            EXPLORAR REDE
          </span>
          {activeTab === 'browse' && (
            <motion.div 
              layoutId="activePartnerTab" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.45)]" 
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* TAB EXPLORE */}
        {activeTab === 'browse' && (
          <motion.div 
            key="browse-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search and Category filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/10 p-4 border border-slate-800/40 rounded-3xl backdrop-blur-sm">
              <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setSelectedCategory('Todos')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedCategory === 'Todos' 
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                      : "bg-slate-900/60 border border-slate-800/40 text-slate-500 hover:text-white"
                  )}
                >
                  Todos
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      selectedCategory === cat 
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                        : "bg-slate-900/60 border border-slate-800/40 text-slate-500 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative group w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar descontos, cidades ou nomes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:border-orange-500 focus:bg-slate-900/40 outline-none transition-all w-full text-white placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* List GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map((pt) => (
                <motion.div
                  key={pt.id}
                  whileHover={{ y: -6 }}
                  className={cn(
                    "bento-card p-0 overflow-hidden bg-slate-900/30 transition-all duration-500 border flex flex-col justify-between",
                    pt.highlight ? "border-orange-500/20 shadow-lg shadow-orange-500/5 hover:border-orange-500/40" : "border-slate-800/60 hover:border-slate-700"
                  )}
                >
                  {/* Presentation photo */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={pt.image} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                      alt={pt.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/200 to-transparent" />
                    
                    {/* Category Overlay tag */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="text-[8px] font-black text-white px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full uppercase tracking-[0.2em] border border-slate-800 flex items-center gap-1.5">
                        {getCategoryIcon(pt.category)}
                        {pt.category.toUpperCase()}
                      </span>
                    </div>

                    {/* Highly Recommended Badge or Rating */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black italic tracking-tighter flex items-center gap-1.5 shadow-lg border border-orange-400/20">
                        <Flame size={12} className="animate-pulse" />
                        {pt.rating.toFixed(1)} ★ COOPERAÇÃO
                      </span>
                    </div>

                    {/* Lower text over cover */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">{pt.name}</h3>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] flex items-center gap-1.5 truncate">
                          <MapPin size={11} className="text-orange-500 shrink-0" />
                          {pt.location}
                        </p>
                        <a
                          href={pt.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pt.name} ${pt.location}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-orange-600/90 hover:bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all border border-orange-400/30 shadow-md"
                          title="Abrir no Google Maps"
                        >
                          <MapPin size={10} />
                          Google Maps
                          <ExternalLink size={9} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Body information */}
                  <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Discount Special Tag */}
                    <div className="bg-gradient-to-r from-orange-600/10 via-orange-500/5 to-transparent border-l-4 border-orange-500 p-4 rounded-r-2xl space-y-1">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase text-orange-500 tracking-[0.2em]">
                        <Percent size={13} />
                        BENEFÍCIO ATIVO DO MOTOLEGADO
                      </div>
                      <p className="text-sm font-black text-white italic tracking-tight leading-snug">
                        "{pt.discount}"
                      </p>
                    </div>

                    {/* Latest News / Updates */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-orange-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">NOVIDADES E ATUALIZAÇÃO RECENTE</span>
                      </div>
                      <p className="text-xs text-slate-400 italic font-medium leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                        "{pt.news}"
                      </p>
                    </div>

                    {/* Corporate Phone, WhatsApp & Site Links */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">
                        {pt.corporateContact && pt.corporateContact.trim().toUpperCase() !== "EMPREGADO" 
                          ? pt.corporateContact 
                          : "CONTATO"}
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold">
                        <a 
                          href={`tel:${pt.phone}`}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                        >
                          <Phone size={13} className="text-orange-500 shrink-0" />
                          <span>{pt.phone}</span>
                        </a>

                        {pt.whatsapp && (
                          <a
                            href={`https://wa.me/55${pt.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[10px] font-black uppercase transition-all shadow-sm"
                          >
                            <MessageSquare size={12} className="text-emerald-400 shrink-0" />
                            <span>WA: {pt.whatsapp}</span>
                          </a>
                        )}
                      </div>

                      {pt.website && (
                        <div className="pt-1.5 border-t border-slate-800/50 flex items-center justify-between gap-2">
                          <a
                            href={pt.website.startsWith('http') ? pt.website : `https://${pt.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px] font-bold truncate transition-colors"
                          >
                            <Globe size={12} className="text-blue-400 shrink-0" />
                            <span className="truncate">{pt.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink size={10} className="shrink-0 opacity-70" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Footer buttons / Actionable call */}
                    <div className="flex gap-4 items-center justify-end border-t border-slate-800/60 pt-3 mt-1">
                      <button
                        onClick={() => setSelectedPartner(pt)}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group cursor-pointer"
                      >
                        <Eye size={12} className="text-orange-500 group-hover:scale-110 transition-transform" />
                        VER DETALHES
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert size={32} className="text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-400 italic uppercase">CRISE DE ABASTECIMENTO</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">NENHUM PARCEIRO COOPERANTE NESSE SETOR DA ESTRADA</p>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* TAB REGISTER FORM */}
        {activeTab === 'register' && (
          <motion.div 
            key="register-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Form Column */}
            <form onSubmit={handleRegisterPartner} className="lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Store size={20} className="text-orange-500" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Credenciar Estabelecimento Comercial</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome Comercial do Parceiro *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Moto point Brothers & Beer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                />
              </div>

              {/* Responsável pelo Estabelecimento */}
              <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-orange-500 tracking-wider">
                  <UserCheck size={16} />
                  Responsável pelo Estabelecimento
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome do Responsável / Piloto *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Carlos 'Trovoada' Silva"
                      value={formManagerName}
                      onChange={(e) => setFormManagerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Telefone / WhatsApp do Responsável</label>
                    <input 
                      type="text" 
                      placeholder="Ex: (41) 98877-6655"
                      value={formManagerPhone}
                      onChange={(e) => setFormManagerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Endereço Completo ou Rota *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Rodovia PR-410, KM 22 - Graciosa"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Categoria Comercial</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none cursor-pointer text-white appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL do Google Maps (Não Obrigatório) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">
                  URL do Google Maps do Estabelecimento (Não Obrigatório)
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input 
                    type="url" 
                    placeholder="Ex: https://maps.google.com/?q=... ou https://goo.gl/maps/..."
                    value={formMapUrl}
                    onChange={(e) => setFormMapUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-12 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                  />
                </div>
              </div>

              {/* Separados: Contato Corporativo, Telefone Corporativo e WhatsApp do Parceiro */}
              <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-orange-500 tracking-wider">
                  <Phone size={16} />
                  Contatos Corporativos do Estabelecimento
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Contato (Setor / Atendimento)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Central de Vendas & Reservas"
                    value={formCorporateContact}
                    onChange={(e) => setFormCorporateContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Telefone Corporativo *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: (41) 3333-5544"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">WhatsApp do Parceiro *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: (41) 98877-6655"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Globe size={12} className="text-orange-500" /> Site / Portal Oficial (URL)
                  </label>
                  <input 
                    type="url" 
                    placeholder="Ex: https://www.seuestabelecimento.com.br"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Proposta de Desconto / Benefício Especial para Membros *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 15% de Desconto para motos clássicas e lavagem cortesia após retorno"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white border-orange-500/20" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Novidades Locais / Mural de Eventos do Estabelecimeto</label>
                <textarea 
                  placeholder="Ex: Show de Rock todas as quintas, Happy Hour com bife de alcatra no disco de arado..."
                  value={formNews}
                  onChange={(e) => setFormNews(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 min-h-[140px] resize-none text-white leading-relaxed" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-gradient-to-r from-orange-700 to-orange-500 text-white rounded-2xl font-black italic uppercase tracking-[0.2em] hover:from-orange-600 hover:to-orange-400 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-orange-600/10"
              >
                SOLICITAR HOMOLOGAÇÃO.
              </button>
            </form>

            {/* Side column for Uploading Logo / Photo & Preset Selection */}
            <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <ImageIcon size={18} className="text-orange-500" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Logomarca / Foto</h3>
                </div>

                {/* Upload File Input Button / Area */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Upload de Foto / Logomarca do Parceiro:
                  </label>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-5 bg-slate-950 border-2 border-dashed border-orange-500/40 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-black uppercase text-orange-400 tracking-wider">
                      Enviar Logomarca ou Foto
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      Formatos: PNG, JPG, WEBP (Até 5MB)
                    </span>
                  </button>
                </div>

                {/* Selected Image Preview */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Pré-visualização do Parceiro:
                  </label>
                  <div className="aspect-video rounded-2xl overflow-hidden border-2 border-orange-500 shadow-xl relative bg-slate-950">
                    <img src={formImage} className="w-full h-full object-cover" alt="Preview da Logomarca" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[9px] font-black uppercase text-orange-400 tracking-widest flex items-center gap-1.5">
                        <Check size={12} /> Logomarca Ativa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preset Options as alternative */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                    Ou selecione um preset de imagem:
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {PRESETS_IMAGE.map((url, i) => (
                      <div 
                        key={i}
                        onClick={() => setFormImage(url)}
                        className={cn(
                          "aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative group",
                          formImage === url ? "border-orange-500 scale-105 shadow-xl shadow-orange-600/10" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={url} className="w-full h-full object-cover" alt={`Preset ${i+1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-slate-500 mt-6 lg:mt-0">
                <p className="text-[9px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 text-orange-500/80">
                  <Award size={12} /> CERTIFICAÇÃO MOTOLEGADO
                </p>
                <p className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">
                  Ao se credenciar, o estabelecimento concorda em dar acolhimento preferencial, infraestrutura segura para as motos e cumprir rigorosamente o desconto fornecido aos pilotos homologados.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* PARTNER DETAILS MODAL */}
      <AnimatePresence>
        {selectedPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedPartner(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto"
            >
              {/* Cover Header */}
              <div className="relative h-48 sm:h-60 bg-slate-950 shrink-0">
                <img src={selectedPartner.image} className="w-full h-full object-cover" alt={selectedPartner.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="absolute top-4 right-4 p-2.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-full border border-slate-800 transition-colors shadow-lg cursor-pointer z-10"
                >
                  <X size={18} />
                </button>

                {/* Category & Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pr-12">
                  <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md">
                    {getCategoryIcon(selectedPartner.category)}
                    {selectedPartner.category}
                  </span>
                  {selectedPartner.highlight && (
                    <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1 shadow-md shadow-orange-600/30">
                      <Award size={12} className="text-amber-300" />
                      Parceiro Destacado
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] font-mono font-black rounded-xl flex items-center gap-1 shadow-md">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {selectedPartner.rating.toFixed(1)} / 5.0
                  </span>
                </div>

                {/* Title & Location Overlay */}
                <div className="absolute bottom-4 left-5 right-5 space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white drop-shadow-lg tracking-tight">
                    {selectedPartner.name}
                  </h2>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    {selectedPartner.location}
                  </p>
                </div>
              </div>

              {/* Scrollable Modal Content Body */}
              <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* FICHA COMPLETA DO PARCEIRO CADASTRADO */}
                <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                  {/* Card Header Title */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={22} className="text-orange-500 shrink-0" />
                      <div>
                        <h3 className="text-sm sm:text-base font-black italic uppercase text-white tracking-wider">
                          FICHA COMPLETA DO PARCEIRO CADASTRADO
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Dados de Cadastro Oficial & Links de Acesso Rápido
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Links de Acesso Rápido */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                      <ExternalLink size={12} /> LINKS PARA ACESSO RÁPIDO
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Google Maps Button */}
                      <a
                        href={selectedPartner.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedPartner.name} ${selectedPartner.location}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-95"
                      >
                        <MapPin size={15} />
                        <span>Google Maps</span>
                        <ExternalLink size={12} className="ml-auto opacity-70" />
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={selectedPartner.whatsapp ? `https://wa.me/55${selectedPartner.whatsapp.replace(/\D/g, '')}` : `tel:${selectedPartner.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-95"
                      >
                        <MessageSquare size={15} />
                        <span>WhatsApp</span>
                        <ExternalLink size={12} className="ml-auto opacity-70" />
                      </a>

                      {/* Website Button */}
                      {selectedPartner.website ? (
                        <a
                          href={selectedPartner.website.startsWith('http') ? selectedPartner.website : `https://${selectedPartner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-95"
                        >
                          <Globe size={15} />
                          <span>Site Oficial</span>
                          <ExternalLink size={12} className="ml-auto opacity-70" />
                        </a>
                      ) : (
                        <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                          <Globe size={15} />
                          <span>Sem Site Cadastrado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grid de Informações Cadastrais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Razão / Nome Fantasia</span>
                      <p className="text-xs font-black text-white">{selectedPartner.name}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Categoria</span>
                      <p className="text-xs font-black text-orange-400 flex items-center gap-1">
                        {getCategoryIcon(selectedPartner.category)}
                        {selectedPartner.category}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Contato</span>
                      <p className="text-xs font-bold text-slate-200">
                        {selectedPartner.corporateContact && selectedPartner.corporateContact.trim().toUpperCase() !== "EMPREGADO" 
                          ? selectedPartner.corporateContact 
                          : "Contato Geral"}
                      </p>
                    </div>

                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Endereço / Cidade</span>
                      <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <MapPin size={13} className="text-orange-500 shrink-0" />
                        {selectedPartner.location}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Telefone Corporativo</span>
                      <p className="text-xs font-mono font-black text-slate-200">{selectedPartner.phone}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">WhatsApp Oficial</span>
                      <p className="text-xs font-mono font-black text-emerald-400">{selectedPartner.whatsapp || "Não informado"}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Website Oficial</span>
                      <p className="text-xs font-mono font-bold text-blue-400 truncate">
                        {selectedPartner.website ? selectedPartner.website.replace(/^https?:\/\//, '') : "Não informado"}
                      </p>
                    </div>
                  </div>

                  {/* Benefício Motolegado */}
                  <div className="bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-transparent border-l-4 border-orange-500 p-4 rounded-r-2xl space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">
                      <Percent size={14} />
                      BENEFÍCIO MOTOLEGADO
                    </div>
                    <p className="text-sm font-black text-white italic">
                      "{selectedPartner.discount}"
                    </p>
                  </div>

                  {/* Novidades e Atualizações */}
                  {selectedPartner.news && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-orange-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">NOVIDADES E ATUALIZAÇÕES</span>
                      </div>
                      <p className="text-xs text-slate-300 italic font-medium leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                        "{selectedPartner.news}"
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Fixed Footer Bar */}
              <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-center shrink-0">
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Fechar Ficha
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
