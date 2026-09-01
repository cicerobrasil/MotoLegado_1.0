import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  X, 
  ShieldAlert, 
  Search, 
  Sparkles, 
  AlertCircle,
  Tag,
  Link as LinkIcon,
  Check,
  User,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CommunityPost } from '../types';

export const COMMUNITY_CATEGORIES = [
  "TUDO", 
  "ENCONTROS", 
  "VIAGENS", 
  "EXPEDIÇÕES", 
  "MECÂNICA", 
  "GERAL"
] as const;

export const POST_CATEGORIES = [
  "ENCONTROS", 
  "VIAGENS", 
  "EXPEDIÇÕES", 
  "MECÂNICA", 
  "GERAL"
] as const;

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post_1",
    user: { 
      name: "João 'Estrada'", 
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100", 
      role: "ROAD CAPTAIN" 
    },
    content: "Chegamos na Serra Catarinense! O asfalto está perfeito e a visibilidade está incrível. Quem estiver por perto, cola junto no Mirante do Rastro da Serpente!",
    image: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&q=80&w=800",
    category: "VIAGENS",
    likes: 42,
    comments: 12,
    timestamp: "Há 2 horas",
    status: 'aprovado',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    commentsList: [
      { id: 'c1', author: 'Sérgio V8', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'Excelente trecho! Cuidado na curva do KM 45.', createdAt: 'Há 1 hora' },
      { id: 'c2', author: 'Mariana Sombra', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', text: 'Saindo de Floripa à tarde para encontrar o grupo!', createdAt: 'Há 30 min' }
    ]
  },
  {
    id: "post_2",
    user: { 
      name: "Julia Lins", 
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100", 
      role: "Membro Ativo" 
    },
    content: "Pé na estrada rumo ao encontro nacional! Alguém mais saindo de Curitiba amanhã cedo? Vamos organizar um comboio com apoio de guincho!",
    image: "",
    category: "ENCONTROS",
    likes: 128,
    comments: 45,
    timestamp: "Há 5 horas",
    status: 'aprovado',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    commentsList: [
      { id: 'c3', author: 'Marcos Bandeira', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', text: 'Nômades MC saindo do Posto Graal às 07h!', createdAt: 'Há 2 horas' }
    ]
  },
  {
    id: "post_3",
    user: {
      name: "Carlos 'Garagem'",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
      role: "Mecânico Colaborador"
    },
    content: "Dica rápida de manutenção preventiva antes da viagem no fim de semana: chequem a tensão da corrente, o fluido de freio e a pressão dos pneus a frio!",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    category: "MECÂNICA",
    likes: 89,
    comments: 19,
    timestamp: "Há 1 dia",
    status: 'aprovado',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "post_pend_1",
    user: {
      name: "Marcelo 'Rider'",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
      role: "Piloto Explorador"
    },
    content: "Organizando expedição para a Serra do Rastro do Serpente em São Paulo! Procurando mais 3 pilotos para fechar o grupo de apoio com caminhonete.",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=800",
    category: "EXPEDIÇÕES",
    likes: 0,
    comments: 0,
    timestamp: "Em Análise",
    status: 'pendente',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export function Feed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("TUDO");
  const [feedViewTab, setFeedViewTab] = useState<'mural' | 'meus_posts'>('mural');
  const [searchText, setSearchText] = useState("");

  // Post Creator Form State
  const [postContent, setPostContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ENCONTROS");
  const [postImage, setPostImage] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlText, setImageUrlText] = useState("");
  const [authorName, setAuthorName] = useState("Você (Piloto Motolegado)");
  
  // Modals & Feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentInputs, setNewCommentInputs] = useState<Record<string, string>>({});

  // Likes state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Report modal state
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Load Posts from LocalStorage
  const loadPosts = () => {
    const saved = localStorage.getItem('motolegado_community_posts_v1');
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem('motolegado_community_posts_v1', JSON.stringify(INITIAL_POSTS));
    }
  };

  useEffect(() => {
    loadPosts();

    const handleSync = () => loadPosts();
    window.addEventListener('community-posts-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('community-posts-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const savePosts = (updated: CommunityPost[]) => {
    setPosts(updated);
    localStorage.setItem('motolegado_community_posts_v1', JSON.stringify(updated));
    window.dispatchEvent(new Event('community-posts-updated'));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Image Upload Handler via FileReader
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Selecione uma imagem menor que 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
        setImageFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyImageUrl = () => {
    if (imageUrlText.trim()) {
      setPostImage(imageUrlText.trim());
      setImageFileName("URL externa");
      setShowImageUrlInput(false);
      setImageUrlText("");
    }
  };

  const handleRemoveImage = () => {
    setPostImage("");
    setImageFileName("");
  };

  // Submit Post for Moderation
  const handleSubmitPost = (e: FormEvent) => {
    e.preventDefault();

    if (!postContent.trim()) {
      showToast("Por favor, digite o conteúdo do seu post.");
      return;
    }

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      user: {
        name: authorName.trim() || "Você (Piloto Motolegado)",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
        role: "Membro Motolegado"
      },
      content: postContent.trim(),
      image: postImage,
      category: selectedCategory,
      likes: 0,
      comments: 0,
      timestamp: "Aguardando Moderação",
      status: 'pendente', // REQUIRES MODERATOR APPROVAL
      createdAt: new Date().toISOString(),
      commentsList: []
    };

    const updated = [newPost, ...posts];
    savePosts(updated);

    // Reset Form
    setPostContent("");
    setPostImage("");
    setImageFileName("");
    setShowImageUrlInput(false);

    // Show Moderator Notice Modal
    setShowSuccessModal(true);
  };

  // Handle Like Toggle
  const handleToggleLike = (postId: string) => {
    const isLiked = !!likedPosts[postId];
    setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));

    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1
        };
      }
      return p;
    });
    savePosts(updated);
  };

  // Handle Comments
  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentInputs[postId]?.trim();
    if (!text) return;

    const updated = posts.map(p => {
      if (p.id === postId) {
        const currentList = p.commentsList || [];
        const newC = {
          id: `c_${Date.now()}`,
          author: authorName,
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
          text,
          createdAt: "Agora mesmo"
        };
        return {
          ...p,
          comments: p.comments + 1,
          commentsList: [...currentList, newC]
        };
      }
      return p;
    });

    savePosts(updated);
    setNewCommentInputs(prev => ({ ...prev, [postId]: "" }));
    showToast("Comentário adicionado com sucesso!");
  };

  // Share Post
  const handleSharePost = (post: CommunityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Confira esta publicação na Comunidade MotoLegado: "${post.content.slice(0, 80)}..."`);
      showToast("Link e texto da publicação copiados para a área de transferência!");
    } else {
      showToast("Publicação compartilhada!");
    }
  };

  // Submit Report to Moderation
  const handleSubmitReport = () => {
    if (!reportingPost || !reportReason.trim()) return;

    const savedReports = localStorage.getItem('motolegado_community_reports');
    let existingReports = [];
    if (savedReports) {
      try { existingReports = JSON.parse(savedReports); } catch (e) { existingReports = []; }
    }

    const newReport = {
      id: `rep_${Date.now()}`,
      author: reportingPost.user.name,
      authorAvatar: reportingPost.user.avatar,
      content: reportingPost.content,
      reportedBy: authorName,
      reason: reportReason,
      reportedAt: "Agora mesmo",
      status: "pendente"
    };

    localStorage.setItem('motolegado_community_reports', JSON.stringify([newReport, ...existingReports]));
    setReportingPost(null);
    setReportReason("");
    showToast("Denúncia enviada com sucesso para a equipe de moderação!");
  };

  // Filter Logic
  const pendingUserPostsCount = posts.filter(p => p.status === 'pendente').length;
  const approvedPosts = posts.filter(p => p.status === 'aprovado' || !p.status);

  const displayedPosts = posts.filter(post => {
    // Search text filter
    const matchesSearch = 
      post.content.toLowerCase().includes(searchText.toLowerCase()) ||
      post.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      post.category.toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // View tab filter
    if (feedViewTab === 'mural') {
      // Show approved posts in main feed
      if (post.status !== 'aprovado' && post.status !== undefined) return false;
    } else if (feedViewTab === 'meus_posts') {
      // Show user's posts or pending posts
      // Show all pending or rejected, or posts created by user
      if (post.status === 'aprovado') return false;
    }

    // Category filter
    if (activeCategory !== "TUDO") {
      if (post.category?.toUpperCase() !== activeCategory.toUpperCase()) return false;
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 bg-slate-950 min-h-screen pb-32">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-amber-300"
          >
            <Sparkles size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
            COMUNIDADE <span className="text-amber-500">MOTOLEGADO</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            RELATOS, DICAS E COMBATENTES DO ASFALTO EM TEMPO REAL
          </p>
        </div>

        {/* Feed View Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setFeedViewTab('mural')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
              feedViewTab === 'mural'
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Sparkles size={14} /> Mural da Comunidade ({approvedPosts.length})
          </button>
          
          <button
            onClick={() => setFeedViewTab('meus_posts')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 relative",
              feedViewTab === 'meus_posts'
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Clock size={14} /> Em Moderação
            {pendingUserPostsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold animate-pulse">
                {pendingUserPostsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 1. CADASTRO DE POST / CRIAR PUBLICAÇÃO */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-amber-500" />
            <h3 className="text-sm font-black italic uppercase text-white tracking-wider">
              CRIAR NOVA PUBLICAÇÃO NA COMUNIDADE
            </h3>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
            <ShieldCheck size={12} /> Moderação Prévia Requerida
          </span>
        </div>

        <form onSubmit={handleSubmitPost} className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-800 shrink-0 hidden sm:block">
              <img 
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" 
                className="w-full h-full object-cover" 
                alt="Seu avatar" 
                referrerPolicy="no-referrer" 
              />
            </div>

            <div className="flex-1 space-y-4">
              
              {/* Textarea for post content */}
              <textarea 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Fale com a estrada... Compartilhe dicas de rotas, fotos de viagens, mecânica ou encontros!" 
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
              />

              {/* SELEÇÃO DO FILTRO / CATEGORIA DA PUBLICAÇÃO */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-amber-500" />
                  SELECIONE O FILTRO / CATEGORIA DA PUBLICAÇÃO:
                </label>
                <div className="flex flex-wrap gap-2">
                  {POST_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5",
                        selectedCategory === cat 
                          ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20" 
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      )}
                    >
                      {selectedCategory === cat && <Check size={10} />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPLOAD DE IMAGEM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-amber-500" />
                    ANEXAR IMAGEM DA VIAGEM / MOTO:
                  </label>
                  {!showImageUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowImageUrlInput(true)}
                      className="text-[9px] font-bold text-amber-500 hover:underline uppercase flex items-center gap-1"
                    >
                      <LinkIcon size={10} /> Inserir URL da Imagem
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageUrlInput(false)}
                      className="text-[9px] font-bold text-slate-500 hover:underline uppercase"
                    >
                      Cancelar URL
                    </button>
                  )}
                </div>

                {/* Upload Controls */}
                {!postImage ? (
                  showImageUrlInput ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="url"
                        placeholder="https://exemplo.com/sua-foto.jpg"
                        value={imageUrlText}
                        onChange={(e) => setImageUrlText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyImageUrl}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase"
                      >
                        Anexar
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-950/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer transition-all text-center sm:text-left group">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0">
                        <Upload size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-300">
                          Clique aqui para Fazer Upload de Imagem
                        </p>
                        <p className="text-[9px] font-medium text-slate-500 uppercase mt-0.5">
                          Suporta arquivos JPG, PNG ou WEBP até 5MB
                        </p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )
                ) : (
                  /* Image Preview */
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group max-h-60">
                    <img 
                      src={postImage} 
                      alt="Prévia da imagem" 
                      className="w-full h-48 object-cover rounded-2xl" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-300 truncate max-w-[150px]">
                        {imageFileName || "Imagem Carregada"}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                        title="Remover imagem"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-mono">
                  <ShieldCheck size={14} className="text-amber-500 shrink-0" />
                  <span>Seu post será analisado pela moderação antes de ir ao feed</span>
                </div>

                <button 
                  type="submit"
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  ENVIAR PARA MODERAÇÃO <Send size={14} />
                </button>
              </div>

            </div>
          </div>
        </form>

      </div>

      {/* 2. CONTROLS BAR: SEARCH & CATEGORY FILTERS */}
      <div className="space-y-4">
        
        {/* Search & Filter header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Buscar publicações por palavra-chave, autor ou filtro..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
            />
            {searchText && (
              <button 
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-[10px] font-black uppercase text-slate-400">
            {displayedPosts.length} publicação(ões) localizada(s)
          </div>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-500 shrink-0">
            <Filter size={16} />
          </div>

          <div className="flex gap-2">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase italic transition-all whitespace-nowrap border",
                  activeCategory === cat 
                    ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/20" 
                    : "bg-slate-900/60 text-slate-400 hover:text-white border-slate-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. POSTS FEED LIST */}
      <div className="space-y-6 pb-20">
        
        {displayedPosts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Clock size={36} className="text-slate-600 mx-auto" />
            <h4 className="text-base font-black italic uppercase text-slate-300">
              Nenhuma publicação encontrada
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {feedViewTab === 'meus_posts' 
                ? "Você ainda não possui publicações aguardando moderação. Utilize o formulário acima para criar uma publicação!"
                : "Nenhum post encontrado para os filtros selecionados. Tente alterar a categoria ou o termo de busca."}
            </p>
          </div>
        ) : (
          displayedPosts.map((post) => {
            const isPending = post.status === 'pendente';
            const isRejected = post.status === 'rejeitado';
            const isApproved = post.status === 'aprovado' || !post.status;
            const isLiked = !!likedPosts[post.id];
            const isCommentsExpanded = !!expandedComments[post.id];

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id} 
                className={cn(
                  "bg-slate-900/50 border rounded-3xl overflow-hidden transition-all group",
                  isPending ? "border-amber-500/60 shadow-lg shadow-amber-500/10" :
                  isRejected ? "border-rose-500/30 opacity-75" : "border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Moderation Status Banner */}
                {isPending && (
                  <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-3 flex items-center justify-between text-amber-300">
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} className="animate-spin text-amber-400 shrink-0" />
                      PUBLICAÇÃO EM ANÁLISE DE MODERAÇÃO
                    </span>
                    <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                      AGUARDANDO APROVAÇÃO
                    </span>
                  </div>
                )}

                {isRejected && (
                  <div className="bg-rose-950/80 border-b border-rose-500/30 px-6 py-3 flex items-center justify-between text-rose-300">
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <XCircle size={14} className="text-rose-400 shrink-0" />
                      PUBLICAÇÃO NÃO APROVADA NA MODERAÇÃO
                    </span>
                    <span className="text-[8px] text-rose-400 font-mono uppercase">REJEITADA</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="p-6 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                      <img 
                        src={post.user.avatar} 
                        className="w-full h-full object-cover" 
                        alt={post.user.name} 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                        {post.user.name}
                      </h4>
                      <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
                        {post.user.role || "Membro"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Category Tag */}
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-amber-400 text-[9px] font-black uppercase rounded-lg">
                      {post.category || "GERAL"}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase font-mono">
                      {post.timestamp}
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 py-2">
                  <p className="text-sm leading-relaxed text-slate-200 font-medium whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Attached Image */}
                {post.image && (
                  <div className="px-6 py-3">
                    <div className="w-full max-h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img 
                        src={post.image} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                        alt="Anexo da publicação" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    {/* Like Button */}
                    <button 
                      onClick={() => handleToggleLike(post.id)}
                      className={cn(
                        "flex items-center gap-2 transition-all group/btn",
                        isLiked ? "text-rose-500 font-bold" : "text-slate-400 hover:text-rose-400"
                      )}
                    >
                      <Heart 
                        size={18} 
                        className={cn(
                          "transition-transform group-active/btn:scale-125",
                          isLiked && "fill-rose-500 text-rose-500"
                        )} 
                      />
                      <span className="text-xs font-black uppercase tracking-wider">{post.likes}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group/btn"
                    >
                      <MessageSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {post.comments} {post.comments === 1 ? 'Comentário' : 'Comentários'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Share Button */}
                    <button 
                      onClick={() => handleSharePost(post)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Compartilhar"
                    >
                      <Share2 size={16} />
                    </button>

                    {/* Report Button */}
                    <button 
                      onClick={() => setReportingPost(post)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Denunciar Publicação à Moderação"
                    >
                      <ShieldAlert size={16} />
                    </button>
                  </div>
                </div>

                {/* EXPANDED COMMENTS SECTION */}
                <AnimatePresence>
                  {isCommentsExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-950 border-t border-slate-800 p-6 space-y-4"
                    >
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        COMENTÁRIOS E INTERAÇÕES
                      </h5>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {(post.commentsList || []).length === 0 ? (
                          <p className="text-xs text-slate-600 italic">Seja o primeiro a comentar nesta publicação!</p>
                        ) : (
                          post.commentsList?.map(c => (
                            <div key={c.id} className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                              <img src={c.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-white">{c.author}</span>
                                  <span className="text-[8px] text-slate-500 font-mono uppercase">{c.createdAt}</span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1">{c.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text"
                          placeholder="Escreva um comentário..."
                          value={newCommentInputs[post.id] || ""}
                          onChange={(e) => setNewCommentInputs({ ...newCommentInputs, [post.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase"
                        >
                          Enviar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        )}

      </div>

      {/* MODAL 1: MODERATION NOTICE SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
                <Clock size={32} className="animate-bounce" />
              </div>

              <div>
                <h3 className="text-xl font-black italic uppercase text-white">
                  PUBLICAÇÃO ENVIADA PARA MODERAÇÃO!
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Obrigado por contribuir com a comunidade MotoLegado. Seu post passará por uma rápida revisão da moderação no Centro de Comando para garantir a segurança e a veracidade das informações na plataforma.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[10px]">
                  <CheckCircle size={12} /> Status Atual: Pendente de Aprovação
                </div>
                <p>Você pode acompanhar o andamento da sua publicação na aba <strong className="text-white">"Em Moderação"</strong> no topo do feed.</p>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setFeedViewTab('meus_posts');
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-600/20"
              >
                ENTENDI & VER MEUS POSTS PENDENTES
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REPORT POST MODAL */}
      <AnimatePresence>
        {reportingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-rose-500 font-black italic uppercase">
                  <ShieldAlert size={20} />
                  <span>DENUNCIAR PUBLICAÇÃO</span>
                </div>
                <button onClick={() => setReportingPost(null)} className="text-slate-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Se esta publicação fere os princípios de respeito, vende itens sem procedência ou apresenta risco à comunidade, descreva o motivo abaixo:
              </p>

              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Conteúdo impróprio, spam, desrespeito ao regulamento..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-black uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase"
                >
                  Enviar Denúncia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
