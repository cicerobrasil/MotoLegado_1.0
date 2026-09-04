import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  Shield, 
  MapPin, 
  Users, 
  Search, 
  ArrowRight, 
  Star, 
  Plus, 
  Calendar, 
  Tag, 
  ChevronDown, 
  Camera, 
  FileText, 
  FileUp, 
  X, 
  Crown, 
  Trash2, 
  Check, 
  Sparkles,
  Tablet as Motorcycle,
  Settings,
  Loader2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { uploadImageToStorage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isUserProOrBonificado } from '../lib/permissions';
import { UpgradeModal } from './UpgradeModal';

export interface ClubItem {
  id: string | number;
  name: string;
  city: string;
  members: number;
  rating: number;
  image: string;
  logo: string;
  description: string;
  category: string;
}

export function MotoClubsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isVip = isUserProOrBonificado(profile);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState<'explorar' | 'gestao'>('explorar');

  const handleOpenGestaoTab = () => {
    if (!isVip) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setActiveMainTab('gestao');
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [clubs, setClubs] = useState<ClubItem[]>(() => {
    try {
      const saved = localStorage.getItem('motolegado_clubs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Gestão State Variables
  const [gestaoSubTab, setGestaoSubTab] = useState<'dados' | 'solicitacoes' | 'comando'>('dados');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'Membro' });
  
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; name: string; city: string; bike: string; photo: string }>>([]);

  const [clubMembers, setClubMembers] = useState<Array<{ id: string; name: string; photo: string; role: string; km: string }>>([]);

  const [clubRegistry, setClubRegistry] = useState({
    name: '',
    city: '',
    about: '',
    foundationDate: '',
    category: 'Cruiser',
    logo: null as string | null,
    banner: null as string | null,
    president: '',
    regulationsFileName: null as string | null
  });

  const clubLogoInputRef = useRef<HTMLInputElement>(null);
  const clubBannerInputRef = useRef<HTMLInputElement>(null);
  const regulationsInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleApprove = (id: string) => {
    setPendingRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleClubFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const result = await uploadImageToStorage(file, {
        folder: 'clubs',
        userId: 'club',
      });

      if (result.success && result.url) {
        setClubRegistry(prev => ({ ...prev, [type]: result.url }));
      } else {
        alert(result.error || 'Erro no upload da imagem.');
      }
    } catch (err) {
      console.error('Erro no upload do clube:', err);
      alert('Falha ao processar a imagem do clube.');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleRegulationsUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClubRegistry(prev => ({ ...prev, regulationsFileName: file.name }));
    }
  };

  const handleUpdateMemberRole = (memberId: string, role: string) => {
    setClubMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;

    const member = {
      id: `m${Date.now()}`,
      name: newMember.name,
      role: newMember.role,
      photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
      km: '0K'
    };

    setClubMembers(prev => [...prev, member]);
    setNewMember({ name: '', role: 'Membro' });
    setShowAddMemberModal(false);
  };

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/60 pb-8">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
            MOTO <span className="text-orange-500">CLUBES</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            EXPLORE A IRMANDADE OU GERENCIE SEU CLUBE
          </p>
        </div>
        
        {activeMainTab === 'explorar' && (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar clubes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800/50 rounded-xl py-3 pl-12 pr-6 text-sm font-bold focus:border-orange-500 outline-none transition-all w-64 backdrop-blur-sm"
              />
            </div>
          </div>
        )}
      </header>

      {/* Tabs para navegar entre Explorar e Gestão */}
      <div className="flex border-b border-slate-800/60 max-w-2xl">
        <button
          onClick={() => setActiveMainTab('explorar')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 transition-all relative group",
            activeMainTab === 'explorar' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 font-black italic uppercase tracking-[0.2em] text-[10px] transition-all",
            activeMainTab === 'explorar' ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
          )}>
            <Shield size={14} className={cn(activeMainTab === 'explorar' ? "text-orange-500" : "text-slate-400")} />
            EXPLORAR CLUBES
          </div>
          {activeMainTab === 'explorar' && (
            <motion.div 
              layoutId="activeMainTabPill" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
            />
          )}
        </button>

        <button
          onClick={handleOpenGestaoTab}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 transition-all relative group",
            activeMainTab === 'gestao' ? "text-orange-500" : "text-slate-500 hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center gap-2 font-black italic uppercase tracking-[0.2em] text-[10px] transition-all",
            activeMainTab === 'gestao' ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
          )}>
            {isVip ? (
              <Settings size={14} className={cn(activeMainTab === 'gestao' ? "text-orange-500" : "text-slate-400")} />
            ) : (
              <Lock size={13} className="text-amber-400" />
            )}
            <span>GESTÃO DO MEU CLUBE {isVip ? '' : '(PRO)'}</span>
          </div>
          {activeMainTab === 'gestao' && (
            <motion.div 
              layoutId="activeMainTabPill" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,85,0,0.4)]" 
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeMainTab === 'explorar' ? (
          <motion.div 
            key="explorar-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredClubs.map((club) => (
              <motion.div 
                key={club.id}
                whileHover={{ y: -8 }}
                className="bento-card p-0 overflow-hidden group border-slate-800/60 bg-slate-900/40 hover:border-orange-500/30 transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={club.image} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={club.name} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-2xl">
                      <img src={club.logo} className="w-full h-full object-contain rounded-lg" alt="Club Logo" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">{club.name}</h3>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-1 italic">
                        <MapPin size={10} className="text-orange-500" />
                        {club.city}
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5 shadow-xl">
                      <Star size={12} className="fill-orange-500 text-orange-500" />
                      <span className="text-[10px] font-black text-white">{club.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                    "{club.description}"
                  </p>

                  <div className="flex items-center justify-between border-y border-slate-800 py-4 bg-slate-950/20 px-4 -mx-4">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 italic">Membros</span>
                      <div className="flex items-center gap-1.5 text-white">
                        <Users size={14} className="text-orange-500" />
                        <span className="text-sm font-black tracking-tight">{club.members}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 italic">Categoria</span>
                      <span className="text-[10px] font-black text-white px-2 py-0.5 bg-slate-800 rounded uppercase tracking-[0.2em] italic border border-slate-700/50">{club.category}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/motoclub/${club.id}`)}
                    className="w-full py-4 rounded-[1.5rem] bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-orange-500 group-hover:text-white group-hover:border-orange-400 group-hover:shadow-[0_10px_25px_rgba(255,85,0,0.3)] transition-all italic"
                  >
                    MAIS INFORMAÇÕES
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredClubs.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Shield size={32} className="text-slate-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-400 italic uppercase">Nenhum Moto Clube Encontrado</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">SEJA O PRIMEIRO A REGISTRAR SEU CLUBE NA COMUNIDADE</p>
                </div>
                <button
                  onClick={handleOpenGestaoTab}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 cursor-pointer flex items-center gap-2 mx-auto"
                >
                  {isVip ? <Plus size={14} /> : <Lock size={13} className="text-amber-300" />}
                  <span>{isVip ? "Cadastrar Meu Moto Clube" : "Cadastrar Moto Clube (VIP Pro)"}</span>
                </button>
              </div>
            )}
          </motion.div>
        ) : !isVip ? (
          <motion.div
            key="gestao-pane-locked"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-orange-500/30 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto space-y-6 my-8"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
              <Lock size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase text-white">FUNDAÇÃO E GESTÃO DE MOTO CLUBE</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                No Plano Gratuito você tem permissão para explorar todos os Moto Clubes públicos e enviar sua candidatura como membro. Para fundar seu próprio clube, nomear diretoria, definir estatutos e ter mural restrito, ative o MotoLegado Pro ou solicite o Modo Bonificado.
              </p>
            </div>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
            >
              Liberar Fundação de Moto Clube
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="gestao-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Gestão Sub-Tabs */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
              <div className="flex bg-slate-900/40 p-2 rounded-2xl gap-2 border border-slate-800/60 flex-1 w-full max-w-xl">
                <button 
                  onClick={() => setGestaoSubTab('dados')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    gestaoSubTab === 'dados' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                  )}
                >
                  Dados do Clube
                </button>
                <button 
                  onClick={() => setGestaoSubTab('comando')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    gestaoSubTab === 'comando' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                  )}
                >
                  Hierarquia (Comando)
                </button>
                <button 
                  onClick={() => setGestaoSubTab('solicitacoes')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative",
                    gestaoSubTab === 'solicitacoes' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                  )}
                >
                  Solicitações
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white flex items-center justify-center rounded-full text-[8px] border-2 border-slate-950 font-black">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>

              <button 
                onClick={() => navigate('/motoclub/1')} 
                className="w-full md:w-auto px-8 py-3 bg-slate-950 border border-orange-500/30 text-orange-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-600/5"
              >
                <Search size={14} className="group-hover:scale-110 transition-transform" />
                Ver Página Pública
              </button>
            </div>

            {/* DADOS DO CLUBE SECTION */}
            {gestaoSubTab === 'dados' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column - Form Fields inside standardized card */}
                  <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles size={18} className="text-orange-500" />
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Editar Detalhes do Clube</h3>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome do MC</label>
                      <input 
                        type="text" 
                        value={clubRegistry.name}
                        onChange={(e) => setClubRegistry(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Cidade Base / Sede</label>
                      <input 
                        type="text" 
                        value={clubRegistry.city}
                        onChange={(e) => setClubRegistry(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 text-white" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Presidente</label>
                        <div className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold text-slate-400 capitalize italic">
                          {clubRegistry.president}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Data de Fundação</label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" />
                          <input 
                            type="date" 
                            value={clubRegistry.foundationDate}
                            onChange={(e) => setClubRegistry(prev => ({ ...prev, foundationDate: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-12 text-sm font-bold focus:border-orange-500 outline-none transition-all text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Categoria do Clube</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={16} />
                        <select 
                          value={clubRegistry.category}
                          onChange={(e) => setClubRegistry(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 pl-12 text-sm font-bold focus:border-orange-500 outline-none appearance-none cursor-pointer text-white"
                        >
                          <option value="Cruiser">Cruiser (Harley, Custom)</option>
                          <option value="Touring">Touring (Viagens Longas)</option>
                          <option value="Mixed">Misto (Big Trail)</option>
                          <option value="Sport">Sport (Alta Perf.)</option>
                          <option value="Classic">Classic / Retro</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Sobre o Clube</label>
                      <textarea 
                        value={clubRegistry.about}
                        onChange={(e) => setClubRegistry(prev => ({ ...prev, about: e.target.value }))}
                        placeholder="Breve descrição do moto clube..."
                        className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none transition-all placeholder:text-slate-700 min-h-[120px] resize-none text-white leading-relaxed" 
                      />
                    </div>
                  </div>

                  {/* Right Column - Club Logo Upload in standardized card */}
                  <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <Camera size={18} className="text-orange-500" />
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Logo (Brasão)</h3>
                      </div>
                      
                      <input 
                        type="file" 
                        ref={clubLogoInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleClubFileUpload(e, 'logo')}
                      />
                      
                      <div 
                        onClick={() => !isUploadingLogo && clubLogoInputRef.current?.click()}
                        className="aspect-square bg-slate-950 border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-[2rem] flex flex-col items-center justify-center gap-6 cursor-pointer transition-all group overflow-hidden relative shadow-inner"
                      >
                        {isUploadingLogo ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={32} className="text-orange-500 animate-spin" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Enviando Brasão...</span>
                          </div>
                        ) : clubRegistry.logo ? (
                          <img src={clubRegistry.logo} className="w-full h-full object-contain p-8" alt="Club Logo" />
                        ) : (
                          <>
                            <Shield size={48} className="text-slate-700 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Carregar Brasão</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-medium italic text-center mt-6 uppercase tracking-widest">
                      O brasão identifica o clube nos rankings e mapas do sistema.
                    </p>
                  </div>
                </div>

                {/* Banner Upload inside standardized card */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera size={18} className="text-orange-500" />
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Banner do Clube</h3>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={clubBannerInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleClubFileUpload(e, 'banner')}
                  />
                  <div 
                    onClick={() => !isUploadingBanner && clubBannerInputRef.current?.click()}
                    className="w-full h-48 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group overflow-hidden relative"
                  >
                    {isUploadingBanner ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="text-orange-500 animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Enviando Capa...</span>
                      </div>
                    ) : clubRegistry.banner ? (
                      <img src={clubRegistry.banner} className="w-full h-full object-cover" alt="Club Banner" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 group-hover:text-orange-500 transition-all">
                          <Camera size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Escolha uma foto lendária para a capa do seu clube</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Regulation upload card inside standardized card */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-orange-500" />
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Regimento Interno</h3>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">PDF, DOCX, TXT</span>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={regulationsInputRef} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleRegulationsUpload}
                  />

                  <div 
                    className={cn(
                      "w-full border-2 border-dashed rounded-[2rem] p-8 transition-all relative overflow-hidden",
                      clubRegistry.regulationsFileName 
                        ? "border-emerald-500/30 bg-emerald-500/5 animate-pulse" 
                        : "border-slate-800 bg-slate-950 hover:border-orange-500/50 cursor-pointer"
                    )}
                    onClick={() => !clubRegistry.regulationsFileName && regulationsInputRef.current?.click()}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                          clubRegistry.regulationsFileName ? "bg-emerald-500 text-white" : "bg-slate-900 border border-slate-800 text-slate-600"
                        )}>
                          {clubRegistry.regulationsFileName ? <FileText size={24} /> : <FileUp size={24} />}
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-black italic uppercase tracking-tighter",
                            clubRegistry.regulationsFileName ? "text-emerald-400" : "text-white"
                          )}>
                            {clubRegistry.regulationsFileName || "Anexar Estatuto / Regimento Interno"}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {clubRegistry.regulationsFileName ? "REGIMENTO ATIVADO COM SUCESSO" : "CLIQUE PARA DEPOSITAR O DOCUMENTO"}
                          </p>
                        </div>
                      </div>

                      {clubRegistry.regulationsFileName && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setClubRegistry(prev => ({ ...prev, regulationsFileName: null }));
                          }}
                          className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-all shadow-md"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COMANDO SECTION (Hierarquia) */}
            {gestaoSubTab === 'comando' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="space-y-8 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10"
              >
                <div className="flex items-center gap-3">
                  <Crown size={20} className="text-orange-500" />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Painel de Patentes e Comando</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {clubMembers.map((member) => (
                    <div key={member.id} className="bg-slate-950 border border-slate-800/50 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-orange-500/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-orange-500/30 transition-all">
                          <img src={member.photo} className="w-full h-full object-cover" alt="Member" />
                        </div>
                        <div>
                          <h4 className="font-black text-white italic text-lg leading-tight">{member.name}</h4>
                          <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1">{member.km} Km na estrada</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto md:self-center justify-between md:justify-end">
                        <div className="relative group/select">
                          <select 
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                            className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 focus:border-orange-500 outline-none cursor-pointer pr-10 hover:bg-slate-800 transition-all text-white"
                          >
                            <option value="Membro">Membro</option>
                            <option value="Presidente">Presidente</option>
                            <option value="Vice-Presidente">Vice-Presidente</option>
                            <option value="Tesoureiro(a)">Tesoureiro(a)</option>
                            <option value="Secretário(a)">Secretário(a)</option>
                            <option value="Road Captain">Road Captain</option>
                            <option value="Sargento-de-Armas">Sargento-de-Armas</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                        </div>
                        
                        {member.role !== 'Presidente' && (
                          <button 
                            onClick={() => setClubMembers(prev => prev.filter(m => m.id !== member.id))}
                            className="p-2.5 text-slate-600 hover:text-red-500 hover:scale-105 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-orange-500/50 text-slate-600 hover:text-orange-500 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-slate-950"
                >
                  <Plus size={16} /> ADICIONAR NOVO INTEGRADOR MANUALMENTE
                </button>
              </motion.div>
            )}

            {/* SOLICITAÇÕES SECTION */}
            {gestaoSubTab === 'solicitacoes' && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-8 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-10"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                    <Users size={22} className="text-orange-500" />
                    Candidatos ao Colete
                  </h3>
                  <span className="text-[10px] font-black px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-slate-500 uppercase tracking-widest">
                    FILA DE ESPERA • {pendingRequests.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {pendingRequests.map((req, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={req.id}
                      className="bg-slate-950 border border-slate-800/50 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:border-orange-500/30 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-orange-500/30 transition-all">
                            <img src={req.photo} className="w-full h-full object-cover" alt={req.name} />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-lg">
                            <Shield size={10} className="text-orange-500" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white italic">{req.name}</h4>
                          <div className="flex flex-wrap items-center gap-5 mt-2">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <MapPin size={12} className="text-orange-600" /> {req.city}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Motorcycle size={12} className="text-orange-600 animate-pulse" /> {req.bike}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button 
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 lg:w-32 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-500 hover:text-white hover:bg-red-600/20 hover:border-red-600/50 transition-all tracking-widest"
                        >
                          RECUSAR
                        </button>
                        <button 
                          onClick={() => {
                            // Approving adds them to clubMembers
                            const newUser = {
                              id: `m${Date.now()}`,
                              name: req.name,
                              photo: req.photo,
                              role: 'Membro',
                              km: '100'
                            };
                            setClubMembers(prev => [...prev, newUser]);
                            handleApprove(req.id);
                          }}
                          className="flex-1 lg:w-48 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                          COLETAR RECRUTA
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {pendingRequests.length === 0 && (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Check size={40} className="text-slate-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-slate-400 italic uppercase">ESTRADA LIMPA</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Nenhuma nova candidatura no fluxo atual</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL GLOBAL PARA CADASTRO DE MEMBROS */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemberModal(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-orange-400" />
              
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Novo Recruta</h3>
              
              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Nome / Apelido</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none text-white placeholder:text-slate-700" 
                    placeholder="Ex: Carlos 'Mão de Ferro'"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Cargo Inicial</label>
                  <div className="relative">
                    <select 
                      value={newMember.role}
                      onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold focus:border-orange-500 outline-none appearance-none cursor-pointer text-white"
                    >
                      <option value="Membro">Membro</option>
                      <option value="Vice-Presidente">Vice-Presidente</option>
                      <option value="Tesoureiro(a)">Tesoureiro(a)</option>
                      <option value="Secretário(a)">Secretário(a)</option>
                      <option value="Road Captain">Road Captain</option>
                      <option value="Sargento-de-Armas">Sargento-de-Armas</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 py-5 rounded-2xl bg-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                  >
                    Finalizar Cadastro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature="criar_clube" 
      />
    </div>
  );
}
