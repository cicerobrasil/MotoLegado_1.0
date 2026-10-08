import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, Clock, ArrowRight, Plus, Search, Sparkles, Navigation, 
  ExternalLink, RefreshCw, Check, Fuel, Info, X, Heart, Award,
  ShieldAlert, CheckCircle, XCircle, Lock, Camera, Upload, Image as ImageIcon,
  AlertCircle, Trash2, Loader2, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route, RouteDifficulty, RouteRatingMetrics, RouteReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { isUserProOrBonificado } from '../lib/permissions';
import { UpgradeModal } from './UpgradeModal';
import { uploadImageToStorage } from '../lib/storage';

export const DEFAULT_ROUTE_FALLBACK = "https://images.unsplash.com/photo-1502472091351-875c941d9c98?auto=format&fit=crop&q=80&w=1200";

export const PRESET_ROUTE_IMAGES = [
  { label: 'Serra & Curvas', url: 'https://images.unsplash.com/photo-1502472091351-875c941d9c98?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Montanhas & Estrada', url: 'https://images.unsplash.com/photo-1471466054146-e71bcc0d2bb2?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Pôr do Sol no Asfalto', url: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Aventura & Viagem', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200' }
];

export function sanitizeAndExtractImageUrl(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Remove aspas ou tags residuais
  str = str.replace(/^[<"'\s]+|[>"'\s]+$/g, '');

  // Markdown image format: ![alt](url)
  const mdMatch = str.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch && mdMatch[1]) {
    str = mdMatch[1];
  }

  // Google Images redirect / search URL: ?imgurl=...
  if (str.includes('imgurl=')) {
    try {
      const match = str.match(/imgurl=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {}
  }

  // Google Drive: /file/d/FILE_ID/view...
  if (str.includes('drive.google.com') && str.includes('/file/d/')) {
    const fileIdMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }

  // Dropbox: ?dl=0 -> ?raw=1
  if (str.includes('dropbox.com') && str.includes('dl=0')) {
    str = str.replace('dl=0', 'raw=1');
  }

  // Se o usuário digitou sem protocolo (ex: images.unsplash.com/...)
  if (!str.startsWith('http://') && !str.startsWith('https://') && !str.startsWith('data:') && !str.startsWith('/')) {
    if (str.includes('.') && !str.includes(' ')) {
      str = `https://${str}`;
    }
  }

  return str;
}

// Função utilitária para estimar ou extrair métricas de distância e duração com alta fidelidade
export function estimateRouteMetrics(route: Partial<Route>): { distance: string; duration: string } {
  // 1. Distância explícita cadastrada
  if (route.distance && Number(route.distance) > 0) {
    const distNum = Number(route.distance);
    let dur = route.duration || '';
    if (!dur) {
      const totalMinutes = Math.round((distNum / 65) * 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      dur = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`;
    }
    return { distance: String(distNum), duration: dur };
  }

  // 2. Extração inteligente via regex a partir de descrição, dicas e endereços
  const fullText = `${route.name || ''} ${route.description || ''} ${route.riderTips || ''} ${route.mapsAddress || ''}`;
  const distMatch = fullText.match(/(\d{1,4}(?:[.,]\d+)?)\s*(?:km|kms|quilômetros|quilometros)\b/i);
  let distNum = distMatch ? parseFloat(distMatch[1].replace(',', '.')) : 0;

  const durMatch = fullText.match(/(\d{1,2})\s*(?:h|hrs|horas?)(?:\s*(?:e\s*)?(\d{1,2})\s*(?:min|minutos?))?/i);
  let durStr = '';
  if (durMatch) {
    const h = durMatch[1];
    const m = durMatch[2];
    durStr = m ? `${h}h ${m}min` : `${h}h 00min`;
  }

  // 3. Fallback inteligente de acordo com o nível de dificuldade
  if (!distNum || distNum <= 0) {
    switch (route.difficulty) {
      case RouteDifficulty.EASY:
        distNum = 95;
        break;
      case RouteDifficulty.MEDIUM:
        distNum = 180;
        break;
      case RouteDifficulty.HARD:
        distNum = 290;
        break;
      case RouteDifficulty.EXPERT:
        distNum = 420;
        break;
      default:
        distNum = 150;
    }
  }

  if (!durStr) {
    const totalMinutes = Math.round((distNum / 65) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    durStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`;
  }

  return {
    distance: String(Math.round(distNum)),
    duration: durStr
  };
}

export function Routes() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isVip = isUserProOrBonificado(profile);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleLaunchInLogbook = (targetRoute: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const metrics = estimateRouteMetrics(targetRoute);
    const query = new URLSearchParams({
      routeTitle: targetRoute.name,
      routeDest: targetRoute.mapsAddress || targetRoute.endPoint || '',
      routeOrigin: targetRoute.startPoint || '',
      routeDesc: targetRoute.description || '',
      routeImg: targetRoute.image || '',
      routeMaps: targetRoute.mapsUrl || '',
      routeDist: metrics.distance,
      routeDuration: metrics.duration
    }).toString();
    navigate(`/logbook?${query}`);
  };

  const handleCompleteRouteWithCamera = (targetRoute: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const metrics = estimateRouteMetrics(targetRoute);
    const query = new URLSearchParams({
      routeTitle: targetRoute.name,
      routeDest: targetRoute.mapsAddress || targetRoute.endPoint || '',
      routeOrigin: targetRoute.startPoint || '',
      routeDesc: targetRoute.description || '',
      routeImg: targetRoute.image || '',
      routeMaps: targetRoute.mapsUrl || '',
      routeDist: metrics.distance,
      routeDuration: metrics.duration,
      openCamera: 'true'
    }).toString();
    navigate(`/logbook?${query}`);
  };

  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'populares' | 'favoritos' | 'meus' | 'moderacao'>('todos');
  const [searchText, setSearchText] = useState('');
  
  // Modals & Notifications state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateRoute = () => {
    if (!isVip) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setNewTitle('');
    setNewMapsAddress('');
    setNewDistance('');
    setNewDuration('');
    setNewImage('');
    setNewDescription('');
    setNewRiderTips('');
    setNewAiTouristInfo('');
    setAiError(null);
    setIsCreateModalOpen(true);
  };
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<Route | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Rejection modal
  const [rejectingRouteId, setRejectingRouteId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Photo Upload & Preview State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDetailPhoto, setIsUploadingDetailPhoto] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // New Route Form State
  const [newTitle, setNewTitle] = useState('');
  const [newMapsAddress, setNewMapsAddress] = useState('');
  const [newDistance, setNewDistance] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<RouteDifficulty>(RouteDifficulty.MEDIUM);
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRiderTips, setNewRiderTips] = useState('');
  const [newAiTouristInfo, setNewAiTouristInfo] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setImageLoadError(false);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'routes',
        userId: profile?.id || 'pilot'
      });

      if (result.success && result.url) {
        setNewImage(result.url);
        showToast('Foto da rota carregada com sucesso!', 'success');
      } else {
        showToast(result.error || 'Erro ao enviar foto.', 'error');
      }
    } catch (err: any) {
      showToast('Falha no upload: ' + (err?.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDetailPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRouteDetail) return;

    setIsUploadingDetailPhoto(true);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'routes',
        userId: profile?.id || 'pilot'
      });

      if (result.success && result.url) {
        const updatedRoute = { ...selectedRouteDetail, image: result.url };
        setSelectedRouteDetail(updatedRoute);
        const updatedList = routes.map(r => r.id === selectedRouteDetail.id ? updatedRoute : r);
        saveRoutes(updatedList);
        showToast('Foto da rota atualizada com sucesso!', 'success');
      } else {
        showToast(result.error || 'Erro ao enviar foto.', 'error');
      }
    } catch (err: any) {
      showToast('Falha no upload: ' + (err?.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsUploadingDetailPhoto(false);
      e.target.value = '';
    }
  };

  // Initial Metrics State for Create
  const [newMetrics, setNewMetrics] = useState<RouteRatingMetrics>({
    paisagem: 5,
    asfalto: 4,
    curvas: 4,
    seguranca: 4,
    infraestrutura: 4
  });

  // AI Loading state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // User Rating Form State
  const [userReviewComment, setUserReviewComment] = useState('');
  const [userReviewMetrics, setUserReviewMetrics] = useState<RouteRatingMetrics>({
    paisagem: 5,
    asfalto: 4,
    curvas: 4,
    seguranca: 4,
    infraestrutura: 4
  });

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('motolegado_routes_v3') || localStorage.getItem('motolegado_routes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mockIds = ['serra-rio-rastro', 'estrada-graciosa', 'rota-das-hortensias', 'route-pending-1', '1'];
          const cleaned = parsed.filter((r: Route) => {
            const name = (r.name || '').toLowerCase();
            const address = (r.mapsAddress || '').toLowerCase();
            const author = (r.author?.name || '').toLowerCase();
            const isMock = mockIds.includes(r.id) ||
              name.includes('cunha') || name.includes('paraty') || address.includes('cunha') || address.includes('paraty') ||
              author.includes('renato') || name.includes('estrada real');
            return !isMock;
          });
          setRoutes(cleaned);
          localStorage.setItem('motolegado_routes_v3', JSON.stringify(cleaned));
          localStorage.setItem('motolegado_routes', JSON.stringify(cleaned));
          return;
        }
      } catch (e) {
        console.error("Error loading routes", e);
      }
    }
    setRoutes([]);
    localStorage.setItem('motolegado_routes_v3', JSON.stringify([]));
    localStorage.setItem('motolegado_routes', JSON.stringify([]));
  }, []);

  const saveRoutes = (updated: Route[]) => {
    setRoutes(updated);
    localStorage.setItem('motolegado_routes_v3', JSON.stringify(updated));
    localStorage.setItem('motolegado_routes', JSON.stringify(updated));
    window.dispatchEvent(new Event('routes-updated'));
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5500);
  };

  // Moderator Approve Route
  const handleApproveRoute = (routeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = routes.map(r => r.id === routeId ? { ...r, status: 'aprovado' as const, rejectionReason: undefined } : r);
    saveRoutes(updated);
    if (selectedRouteDetail && selectedRouteDetail.id === routeId) {
      setSelectedRouteDetail({ ...selectedRouteDetail, status: 'aprovado', rejectionReason: undefined });
    }
    showToast("✓ Roteiro APROVADO com sucesso! Agora ele está visível publicamente na comunidade.", "success");
  };

  // Moderator Reject Route
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRouteId) return;

    const reason = rejectionReasonText.trim() || 'O roteiro necessita de mais detalhes nas informações de percurso ou endereço.';
    const updated = routes.map(r => r.id === rejectingRouteId ? { ...r, status: 'rejeitado' as const, rejectionReason: reason } : r);
    saveRoutes(updated);

    if (selectedRouteDetail && selectedRouteDetail.id === rejectingRouteId) {
      setSelectedRouteDetail({ ...selectedRouteDetail, status: 'rejeitado', rejectionReason: reason });
    }

    setRejectingRouteId(null);
    setRejectionReasonText('');
    showToast("✕ Roteiro REJEITADO. O autor poderá revisar as informações.", "error");
  };

  // Generate Tourist Info using Gemini AI
  const handleGenerateAiInfo = async (
    titleToUse: string,
    addressToUse: string,
    descToUse: string,
    setTargetState: (val: string) => void
  ) => {
    if (!titleToUse.trim()) {
      alert("Por favor, preencha o Título do Roteiro primeiro para gerar as informações com IA.");
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/routes/ai-tourist-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToUse,
          address: addressToUse,
          description: descToUse
        })
      });

      const data = await res.json();
      if (res.ok && data.touristInfo) {
        setTargetState(data.touristInfo);
      } else {
        throw new Error(data.error || "Não foi possível gerar informações turísticas.");
      }
    } catch (err: any) {
      console.warn("API Error, using intelligent fallback", err);
      const generatedFallback = `🏛️ **Destaques Turísticos & Atrações do Local ("${titleToUse}"):**
- Mirante panorâmico com parada estratégica para apreciação da paisagem natural.
- Pontos turísticos históricos regionais e marcos geográficos de destaque.

📜 **Curiosidades Históricas:**
- Região tradicional marcada por antigas rotas de tropeiros e ligação entre municípios vizinhos.

🍲 **Gastronomia Típica Recomendada:**
- Pratos típicos da culinária local, cafés coloniais e lanchonetes de estrada com produtos artesanais da região.

📸 **Dicas de Fotografia & Melhores Horários:**
- Registros incríveis ao amanhecer ou no final da tarde, aproveitando a iluminação suave sobre as curvas e a pista.`;

      setTargetState(generatedFallback);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Create Route Handler (Submitted for Moderation)
  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      alert("Informe o título do roteiro!");
      return;
    }

    const calculatedAvgRating = parseFloat(
      ((newMetrics.paisagem + newMetrics.asfalto + newMetrics.curvas + newMetrics.seguranca + newMetrics.infraestrutura) / 5).toFixed(1)
    );

    const formattedMapsUrl = newMapsAddress.startsWith('http')
      ? newMapsAddress
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newMapsAddress || newTitle)}`;

    const sanitizedImage = sanitizeAndExtractImageUrl(newImage);
    const finalImage = sanitizedImage.trim() || DEFAULT_ROUTE_FALLBACK;

    const metrics = estimateRouteMetrics({
      name: newTitle.trim(),
      mapsAddress: newMapsAddress.trim(),
      description: newDescription.trim(),
      riderTips: newRiderTips.trim(),
      difficulty: newDifficulty,
      distance: newDistance ? parseInt(newDistance.replace(/\D/g, ''), 10) : undefined,
      duration: newDuration.trim() || undefined
    });

    const newRouteItem: Route = {
      id: "route-" + Date.now(),
      name: newTitle.trim(),
      mapsAddress: newMapsAddress.trim() || newTitle.trim(),
      mapsUrl: formattedMapsUrl,
      description: newDescription.trim() || "Roteiro cadastrado pelo piloto no MotoLegado.",
      riderTips: newRiderTips.trim() || "Verifique a calibragem dos pneus e nível de combustível antes de partir.",
      aiTouristInfo: newAiTouristInfo.trim() || undefined,
      difficulty: newDifficulty,
      distance: parseInt(metrics.distance, 10),
      duration: metrics.duration,
      image: finalImage,
      author: {
        name: "Você (Piloto)",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
      },
      rating: calculatedAvgRating,
      totalRatingsCount: 1,
      ratingMetrics: newMetrics,
      reviews: [],
      createdAt: new Date().toISOString().split('T')[0],
      isFavorite: false,
      status: 'pendente' // NOVO ROTEIRO VEM PENDENTE DE MODERAÇÃO
    };

    const updated = [newRouteItem, ...routes];
    saveRoutes(updated);

    // Reset Form
    setNewTitle('');
    setNewMapsAddress('');
    setNewDistance('');
    setNewDuration('');
    setNewDescription('');
    setNewRiderTips('');
    setNewAiTouristInfo('');
    setNewImage('');
    setIsCreateModalOpen(false);

    // Notify user & select moderation tab or detail
    showToast("🛡️ Roteiro cadastrado! Ele foi enviado para a MODERAÇÃO e ficará visível para a comunidade assim que for aprovado.", "info");
    setSelectedRouteDetail(newRouteItem);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = routes.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r);
    saveRoutes(updated);
    if (selectedRouteDetail && selectedRouteDetail.id === id) {
      setSelectedRouteDetail({ ...selectedRouteDetail, isFavorite: !selectedRouteDetail.isFavorite });
    }
  };

  // Submit User Review / Rating to Selected Route
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteDetail) return;

    const overallRating = parseFloat(
      ((userReviewMetrics.paisagem + userReviewMetrics.asfalto + userReviewMetrics.curvas + userReviewMetrics.seguranca + userReviewMetrics.infraestrutura) / 5).toFixed(1)
    );

    const newReview: RouteReview = {
      id: "rev-" + Date.now(),
      pilotName: "Piloto Registrado",
      pilotAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
      date: "Hoje",
      overallRating,
      comment: userReviewComment.trim() || "Roteiro excelente! Ótimas curvas e belas paisagens.",
      metrics: userReviewMetrics
    };

    const existingReviews = selectedRouteDetail.reviews || [];
    const updatedReviews = [newReview, ...existingReviews];
    const newTotalCount = selectedRouteDetail.totalRatingsCount + 1;

    // Recalculate average metrics
    const curMetrics = selectedRouteDetail.ratingMetrics;
    const updatedMetrics: RouteRatingMetrics = {
      paisagem: parseFloat(((curMetrics.paisagem * selectedRouteDetail.totalRatingsCount + userReviewMetrics.paisagem) / newTotalCount).toFixed(1)),
      asfalto: parseFloat(((curMetrics.asfalto * selectedRouteDetail.totalRatingsCount + userReviewMetrics.asfalto) / newTotalCount).toFixed(1)),
      curvas: parseFloat(((curMetrics.curvas * selectedRouteDetail.totalRatingsCount + userReviewMetrics.curvas) / newTotalCount).toFixed(1)),
      seguranca: parseFloat(((curMetrics.seguranca * selectedRouteDetail.totalRatingsCount + userReviewMetrics.seguranca) / newTotalCount).toFixed(1)),
      infraestrutura: parseFloat(((curMetrics.infraestrutura * selectedRouteDetail.totalRatingsCount + userReviewMetrics.infraestrutura) / newTotalCount).toFixed(1)),
    };

    const updatedAvgRating = parseFloat(
      ((updatedMetrics.paisagem + updatedMetrics.asfalto + updatedMetrics.curvas + updatedMetrics.seguranca + updatedMetrics.infraestrutura) / 5).toFixed(1)
    );

    const updatedRoute: Route = {
      ...selectedRouteDetail,
      rating: updatedAvgRating,
      totalRatingsCount: newTotalCount,
      ratingMetrics: updatedMetrics,
      reviews: updatedReviews
    };

    const updatedRoutesList = routes.map(r => r.id === updatedRoute.id ? updatedRoute : r);
    saveRoutes(updatedRoutesList);
    setSelectedRouteDetail(updatedRoute);

    setIsRatingModalOpen(false);
    setUserReviewComment('');
    showToast("Avaliação e notas de pilotagem registradas com sucesso!", "success");
  };

  // Filtered List
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.mapsAddress.toLowerCase().includes(searchText.toLowerCase()) ||
      r.description.toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'moderacao') return r.status === 'pendente';
    if (activeFilter === 'meus') return r.author?.name === "Você (Piloto)";
    if (activeFilter === 'favoritos') return r.isFavorite && (r.status === 'aprovado' || !r.status);
    if (activeFilter === 'populares') return r.rating >= 4.8 && (r.status === 'aprovado' || !r.status);

    // Default 'todos': Approved routes OR user's own created routes (which show status badge)
    return (r.status === 'aprovado' || !r.status) || r.author?.name === "Você (Piloto)";
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl border font-bold text-xs flex items-center justify-between gap-3 shadow-xl z-50",
              toastMessage.type === 'success' ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" :
              toastMessage.type === 'error' ? "bg-rose-950/90 border-rose-500/50 text-rose-200" :
              "bg-amber-950/90 border-amber-500/50 text-amber-200"
            )}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
              {toastMessage.type === 'error' && <XCircle size={18} className="text-rose-400 shrink-0" />}
              {toastMessage.type === 'info' && <ShieldAlert size={18} className="text-amber-400 shrink-0" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER & TOP ACTION BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800/80 pb-6 sm:pb-8 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-2xl shrink-0">
              <Navigation size={24} className="sm:w-7 sm:h-7" />
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                ROTEIROS <span className="text-orange-500">LEGADOS</span>
              </h1>
              <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                EXPEDIÇÕES COM MODERAÇÃO E DICAS TURÍSTICAS VIA IA
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleOpenCreateRoute}
          className="w-full lg:w-auto btn-primary"
        >
          {isVip ? <Plus size={16} /> : <Lock size={15} />}
          <span>{isVip ? "CRIAR ROTEIRO AGORA" : "+ CRIAR ROTEIRO (VIP PRO)"}</span>
        </button>
      </header>

      {/* FILTER & MODERATION NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome do roteiro, cidade ou atrações..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          {[
            { id: 'todos', label: 'Todos os Roteiros' },
            { id: 'populares', label: '⭐ Mais Avaliados' },
            { id: 'favoritos', label: '❤️ Meus Favoritos' },
            { id: 'meus', label: '👤 Meus Roteiros' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "whitespace-nowrap shrink-0",
                activeFilter === f.id ? "btn-filter-active" : "btn-filter-inactive"
              )}
            >
              <span>{f.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ROUTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredRoutes.map((route, i) => {
          const isPending = route.status === 'pendente';
          const isRejected = route.status === 'rejeitado';
          const isApproved = route.status === 'aprovado' || !route.status;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={route.id} 
              onClick={() => setSelectedRouteDetail(route)}
              className={cn(
                "bg-slate-900/50 border rounded-3xl overflow-hidden group cursor-pointer transition-all hover:shadow-xl flex flex-col justify-between relative",
                isPending ? "border-amber-500/50 hover:border-amber-400" :
                isRejected ? "border-rose-500/50 hover:border-rose-400" :
                "border-slate-800 hover:border-orange-500/60 hover:shadow-orange-500/10"
              )}
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={route.image || DEFAULT_ROUTE_FALLBACK} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={route.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_ROUTE_FALLBACK;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-800 text-[10px] font-black uppercase tracking-widest text-orange-400">
                        {route.difficulty}
                      </span>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-md text-slate-950 font-black rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Clock size={11} /> Aguardando Moderação
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 bg-emerald-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40 font-black rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <Check size={11} /> Aprovado
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 bg-rose-950/80 backdrop-blur-md text-rose-300 border border-rose-500/40 font-black rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <X size={11} /> Rejeitado
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={(e) => handleToggleFavorite(route.id, e)}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-md border transition-all shrink-0",
                        route.isFavorite 
                          ? "bg-rose-600/80 text-white border-rose-500" 
                          : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                      )}
                    >
                      <Heart size={14} className={route.isFavorite ? "fill-white" : ""} />
                    </button>
                  </div>

                  {/* Title on Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {route.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                      <MapPin size={12} className="text-orange-500 shrink-0" />
                      {route.mapsAddress}
                    </p>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {route.description}
                  </p>

                  {/* Metrics Stats */}
                  <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-800/80 bg-slate-950/40 px-2 sm:px-3 rounded-2xl text-center">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Distância</span>
                      <span className="text-xs font-black text-orange-400 font-mono">
                        {estimateRouteMetrics(route).distance} KM
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Tempo</span>
                      <span className="text-xs font-bold text-slate-300 font-mono truncate block">
                        {estimateRouteMetrics(route).duration}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Dificuldade</span>
                      <span className="text-xs font-black text-slate-300 uppercase truncate block">{route.difficulty}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Avaliação</span>
                      <span className="text-xs font-black text-amber-400 flex items-center justify-center gap-1">
                        <Star size={11} className="fill-amber-400" />
                        {route.rating}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason if Rejected */}
                  {isRejected && route.rejectionReason && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-300">
                      <strong>Motivo da recusa:</strong> {route.rejectionReason}
                    </div>
                  )}

                  {/* AI Badge Indicator if AI content exists */}
                  {route.aiTouristInfo && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase text-amber-400">
                      <Sparkles size={12} />
                      Com Dicas Turísticas por IA
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Action & Moderator Actions */}
              <div className="p-6 pt-0 space-y-2">
                {isPending && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button 
                      onClick={(e) => handleApproveRoute(route.id, e)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <CheckCircle size={14} /> APROVAR
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRejectingRouteId(route.id); }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <XCircle size={14} /> REJEITAR
                    </button>
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={(e) => handleLaunchInLogbook(route, e)}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group/btn"
                      title="Lançar este roteiro no seu Diário de Bordo para alimentar o Dashboard"
                    >
                      <BookOpen size={13} className="text-orange-500 group-hover/btn:scale-110 transition-transform" />
                      <span>No Diário</span>
                    </button>

                    <button 
                      onClick={(e) => handleCompleteRouteWithCamera(route, e)}
                      className="py-2.5 rounded-xl bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/40 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group/cam active:scale-95"
                      title="Tirar foto com a câmera para comprovar e concluir este roteiro no Diário de Bordo"
                    >
                      <Camera size={13} className="group-hover/cam:scale-110 transition-transform" />
                      <span>Comprovar</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setSelectedRouteDetail(route)}
                    className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 text-xs font-black uppercase tracking-wider text-slate-200 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    VER DETALHES & AVALIAÇÕES
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
            <Navigation size={36} className="text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-lg font-black italic uppercase text-slate-300">Nenhum Roteiro Encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeFilter === 'moderacao' 
                ? "Não há nenhum roteiro pendente aguardando moderação no momento!" 
                : "Tente alterar os termos da busca ou crie o primeiro roteiro para esta categoria."}
            </p>
            {activeFilter !== 'moderacao' && (
              <button 
                onClick={handleOpenCreateRoute}
                className="btn-primary mx-auto"
              >
                {isVip ? <Plus size={14} /> : <Lock size={14} className="text-amber-300" />}
                <span>{isVip ? "+ CRIAR ROTEIRO AGORA" : "+ CRIAR ROTEIRO (VIP PRO)"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CRIAR ROTEIRO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
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
              className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full my-4 sm:my-8 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                    <Plus size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white">
                      CRIAR NOVO ROTEIRO LEGADO
                    </h2>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <ShieldAlert size={12} />
                      O roteiro passará por moderação antes de ser publicado na comunidade
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateRoute} className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                    <Navigation size={14} /> 1. DADOS PRINCIPAIS DO ROTEIRO
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Título do Roteiro *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Rota das Curvas da Serra Gaúcha"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Endereço no Google Maps / Localização *</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="text"
                          required
                          placeholder="Ex: RS-235, Gramado / Canela - RS ou Link do Google Maps"
                          value={newMapsAddress}
                          onChange={(e) => setNewMapsAddress(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Nível de Dificuldade</label>
                      <select 
                        value={newDifficulty}
                        onChange={(e) => setNewDifficulty(e.target.value as RouteDifficulty)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 uppercase"
                      >
                        <option value={RouteDifficulty.EASY}>Fácil (Pista boa e poucas curvas)</option>
                        <option value={RouteDifficulty.MEDIUM}>Médio (Trecho misto e serras moderadas)</option>
                        <option value={RouteDifficulty.HARD}>Difícil (Serras travadas e tráfego)</option>
                        <option value={RouteDifficulty.EXPERT}>Especialista (Curvas extremas e alta altitude)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Distância Estimada (KM)</label>
                      <input 
                        type="text"
                        placeholder="Ex: 220"
                        value={newDistance}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewDistance(val);
                          const num = parseInt(val.replace(/\D/g, ''), 10);
                          if (!isNaN(num) && num > 0 && !newDuration) {
                            const totalMinutes = Math.round((num / 65) * 60);
                            const hours = Math.floor(totalMinutes / 60);
                            const mins = totalMinutes % 60;
                            setNewDuration(hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : '00min'}` : `${mins}min`);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Duração Estimada de Viagem</label>
                      <input 
                        type="text"
                        placeholder="Ex: 3h 30min"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Foto de Capa do Roteiro */}
                    <div className="md:col-span-2 space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Camera size={13} className="text-orange-500" />
                          Foto de Capa do Roteiro (Upload ou Link)
                        </label>
                        {newImage && (
                          <button
                            type="button"
                            onClick={() => { setNewImage(''); setImageLoadError(false); }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} />
                            <span>Remover Foto</span>
                          </button>
                        )}
                      </div>

                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />

                      {/* Dropzone / Preview visual */}
                      <div
                        onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                        className={cn(
                          "w-full aspect-[21/9] sm:aspect-[3/1] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
                          newImage 
                            ? "border-slate-800 bg-slate-950 shadow-lg" 
                            : "border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-950/60 hover:bg-slate-900/40"
                        )}
                      >
                        {isUploadingPhoto ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={28} className="text-orange-500 animate-spin" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Enviando foto...</span>
                          </div>
                        ) : newImage ? (
                          <>
                            <img 
                              src={newImage} 
                              alt="Preview da Rota" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={() => setImageLoadError(true)}
                              onLoad={() => setImageLoadError(false)}
                            />
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600">
                                <Camera size={14} />
                                Trocar Foto
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center p-4">
                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-orange-400 group-hover:scale-110 transition-all">
                              <Upload size={18} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                                Tirar Foto ou Escolher da Galeria
                              </p>
                              <p className="text-[9px] font-medium text-slate-500 mt-0.5">
                                Ou cole o link de uma imagem externa abaixo
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {imageLoadError && newImage && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold">O link da imagem não pôde ser carregado diretamente.</p>
                            <p className="text-[11px] text-rose-300/80">
                              Links de páginas ou serviços protegidos não exibem fotos diretamente. Você pode fazer o upload da foto acima ou selecionar um dos modelos abaixo.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Input de link direto */}
                      <div className="space-y-1">
                        <input 
                          type="text"
                          placeholder="Ou cole a URL direta da imagem (ex: https://...)"
                          value={newImage}
                          onChange={(e) => {
                            const sanitized = sanitizeAndExtractImageUrl(e.target.value);
                            setNewImage(sanitized);
                            setImageLoadError(false);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      {/* Modelos recomendados */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          Ou escolha uma foto recomendada para esta rota:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_ROUTE_IMAGES.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewImage(preset.url);
                                setImageLoadError(false);
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                                newImage === preset.url
                                  ? "bg-orange-500/20 border-orange-500 text-orange-400"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                              )}
                            >
                              📷 {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Description & Rider Tips */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                    <Info size={14} /> 2. DESCRIÇÃO E DICAS PARA PILOTOS
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Descrição do Local e Experiência do Percurso</label>
                      <textarea 
                        rows={3}
                        placeholder="Descreva o que os pilotos encontrarão nesta rota (paisagens, qualidade do piso, trechos históricos)..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Maiores Informações & Dicas Técnicas do Local</label>
                      <textarea 
                        rows={3}
                        placeholder="Dicas sobre postos de combustível, condições de asfalto, pontos de apoio para café, radares, melhor época do ano..."
                        value={newRiderTips}
                        onChange={(e) => setNewRiderTips(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Tourist Info Section */}
                <div className="space-y-4 pt-2 border-t border-slate-800 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                        <Sparkles size={16} /> 3. INFORMAÇÕES TURÍSTICAS COM INTELIGÊNCIA ARTIFICIAL
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Obtenha automaticamente atrações turísticas, fatos históricos, gastronomia e dicas fotográficas.
                      </p>
                    </div>

                    <button 
                      type="button"
                      disabled={isAiGenerating}
                      onClick={() => handleGenerateAiInfo(newTitle, newMapsAddress, newDescription, setNewAiTouristInfo)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                    >
                      {isAiGenerating ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Gerando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Gerar via IA Gemini
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-[10px] text-rose-400 font-mono">{aiError}</p>
                  )}

                  <textarea 
                    rows={5}
                    placeholder="Clique no botão acima para gerar automaticamente informações turísticas por IA, ou digite manualmente..."
                    value={newAiTouristInfo}
                    onChange={(e) => setNewAiTouristInfo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono leading-relaxed"
                  />
                </div>

                {/* Initial Metrics Ratings */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                    <Star size={14} /> 4. ESCALA DE AVALIAÇÃO INICIAL DO PILOTO (1 a 5)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    {[
                      { key: 'paisagem', label: 'Paisagem & Mirantes' },
                      { key: 'asfalto', label: 'Qualidade do Asfalto' },
                      { key: 'curvas', label: 'Nível das Curvas' },
                      { key: 'seguranca', label: 'Segurança na Pista' },
                      { key: 'infraestrutura', label: 'Infraestrutura de Apoio' }
                    ].map(metric => (
                      <div key={metric.key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                          <span>{metric.label}</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {(newMetrics as any)[metric.key]} / 5
                          </span>
                        </div>
                        <input 
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={(newMetrics as any)[metric.key]}
                          onChange={(e) => setNewMetrics({
                            ...newMetrics,
                            [metric.key]: Number(e.target.value)
                          })}
                          className="w-full accent-orange-500 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    Roteiro passará por moderação
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-7 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider italic shadow-lg shadow-orange-600/30 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      ENVIAR PARA MODERAÇÃO
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: DETALHES DO ROTEIRO COM MAPS, IA, AVALIAÇÕES & PAINEL DE MODERAÇÃO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRouteDetail && (
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
              className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full my-4 sm:my-8 shadow-2xl overflow-hidden"
            >
              
              {/* Detail Header Banner */}
              <div className="relative h-52 sm:h-64 md:h-80 overflow-hidden">
                <img 
                  src={selectedRouteDetail.image || DEFAULT_ROUTE_FALLBACK} 
                  className="w-full h-full object-cover"
                  alt={selectedRouteDetail.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_ROUTE_FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/60 to-slate-950/30" />

                <input 
                  type="file" 
                  ref={detailPhotoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleDetailPhotoUpload} 
                />

                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button 
                    onClick={() => detailPhotoInputRef.current?.click()}
                    disabled={isUploadingDetailPhoto}
                    className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 text-xs font-bold text-white rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer disabled:opacity-50"
                    title="Atualizar ou trocar foto desta rota"
                  >
                    {isUploadingDetailPhoto ? (
                      <Loader2 size={13} className="text-orange-400 animate-spin" />
                    ) : (
                      <Camera size={13} className="text-orange-400" />
                    )}
                    <span>{isUploadingDetailPhoto ? 'Enviando...' : 'Trocar Foto'}</span>
                  </button>

                  <button 
                    onClick={() => setSelectedRouteDetail(null)}
                    className="p-2 sm:p-2.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-full border border-slate-700 backdrop-blur-md transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                      {selectedRouteDetail.difficulty}
                    </span>
                    
                    {/* Status Badge */}
                    {selectedRouteDetail.status === 'pendente' && (
                      <span className="px-3 py-1 bg-amber-500/90 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Clock size={12} />
                        Pendente de Moderação
                      </span>
                    )}
                    {selectedRouteDetail.status === 'aprovado' && (
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <Check size={12} />
                        Aprovado pelo Moderador
                      </span>
                    )}
                    {selectedRouteDetail.status === 'rejeitado' && (
                      <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <X size={12} />
                        Rejeitado
                      </span>
                    )}

                    <span className="px-3.5 py-1 bg-slate-950/80 border border-slate-800 text-amber-400 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                      <Star size={12} className="fill-amber-400" />
                      {selectedRouteDetail.rating} / 5.0 ({selectedRouteDetail.totalRatingsCount} avaliações)
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white drop-shadow-md">
                    {selectedRouteDetail.name}
                  </h2>

                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    {selectedRouteDetail.mapsAddress}
                  </p>
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="p-6 md:p-8 space-y-8 max-h-[65vh] overflow-y-auto">
                
                {/* MODERATOR CONTROL BOX IN DETAIL MODAL */}
                {selectedRouteDetail.status === 'pendente' && (
                  <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={22} className="text-amber-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-amber-300">
                          Ação do Moderador para este Roteiro
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Analise as informações abaixo. Deseja aprovar para liberar o roteiro na comunidade?
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                      <button 
                        onClick={() => handleApproveRoute(selectedRouteDetail.id)}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCircle size={16} /> APROVAR ROTEIRO
                      </button>
                      <button 
                        onClick={() => setRejectingRouteId(selectedRouteDetail.id)}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <XCircle size={16} /> REJEITAR
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Distância</span>
                    <span className="text-xs font-black text-orange-400 font-mono">
                      {estimateRouteMetrics(selectedRouteDetail).distance} KM
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Duração Estimada</span>
                    <span className="text-xs font-black text-slate-300 font-mono">
                      {estimateRouteMetrics(selectedRouteDetail).duration}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Nível de Dificuldade</span>
                    <span className="text-xs font-black text-amber-400 uppercase">{selectedRouteDetail.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Avaliação Média</span>
                    <span className="text-xs font-black text-amber-400 flex items-center justify-center gap-1">
                      <Star size={12} className="fill-amber-400" />
                      {selectedRouteDetail.rating} / 5.0
                    </span>
                  </div>
                </div>

                {/* GOOGLE MAPS DIRECT LINK & INTERACTIVE BUTTON */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <MapPin size={16} className="text-orange-500" />
                      LOCALIZAÇÃO E NAVEGAÇÃO NO GOOGLE MAPS
                    </h4>
                    <p className="text-xs text-slate-400">
                      {selectedRouteDetail.mapsAddress}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCompleteRouteWithCamera(selectedRouteDetail)}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer transition-all active:scale-95"
                      title="Tirar foto com a câmera para comprovar e concluir este roteiro no Diário de Bordo"
                    >
                      <Camera size={14} />
                      TIRAR FOTO / COMPROVAR
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchInLogbook(selectedRouteDetail)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                      title="Lançar este roteiro no seu Diário de Bordo para alimentar o Dashboard"
                    >
                      <BookOpen size={14} className="text-orange-500" />
                      LANÇAR NO DIÁRIO
                    </button>

                    <a 
                      href={selectedRouteDetail.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRouteDetail.mapsAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm shrink-0 transition-all"
                    >
                      <ExternalLink size={14} />
                      GOOGLE MAPS
                    </a>
                  </div>
                </div>

                {/* Description & Rider Tips */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider mb-2 flex items-center gap-2">
                      <Info size={16} /> DESCRIÇÃO DO LOCAL E PERCURSO
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      {selectedRouteDetail.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider mb-2 flex items-center gap-2">
                      <Fuel size={16} /> MAIORES INFORMAÇÕES & DICAS PARA PILOTOS
                    </h4>
                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 whitespace-pre-line">
                      {selectedRouteDetail.riderTips}
                    </div>
                  </div>
                </div>

                {/* AI Tourist Info Section */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                      <Sparkles size={16} /> INFORMAÇÕES TURÍSTICAS DO LOCAL (IA GEMINI)
                    </h4>

                    {!selectedRouteDetail.aiTouristInfo && (
                      <button 
                        disabled={isAiGenerating}
                        onClick={() => handleGenerateAiInfo(
                          selectedRouteDetail.name, 
                          selectedRouteDetail.mapsAddress, 
                          selectedRouteDetail.description,
                          (generated) => {
                            const updated = { ...selectedRouteDetail, aiTouristInfo: generated };
                            setSelectedRouteDetail(updated);
                            saveRoutes(routes.map(r => r.id === updated.id ? updated : r));
                          }
                        )}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5"
                      >
                        {isAiGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Gerar com IA
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {selectedRouteDetail.aiTouristInfo || "Nenhuma informação turística gerada ainda. Clique em 'Gerar com IA' para obter atracoes, historia e dicas turisticas do local."}
                  </div>
                </div>

                {/* Rating Metrics & Reviews */}
                <div className="space-y-6 pt-4 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        AVALIAÇÃO DA PISTA PELOS PILOTOS (1 A 5 ESTRELAS)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Baseado em {selectedRouteDetail.totalRatingsCount} {selectedRouteDetail.totalRatingsCount === 1 ? 'piloto' : 'pilotos'}
                      </p>
                    </div>

                    <button 
                      onClick={() => setIsRatingModalOpen(true)}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                    >
                      <Star size={14} className="fill-white" />
                      AVALIAR ROTEIRO
                    </button>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    {[
                      { label: 'Paisagem & Mirantes', score: selectedRouteDetail.ratingMetrics.paisagem },
                      { label: 'Qualidade do Asfalto', score: selectedRouteDetail.ratingMetrics.asfalto },
                      { label: 'Nível das Curvas', score: selectedRouteDetail.ratingMetrics.curvas },
                      { label: 'Segurança na Pista', score: selectedRouteDetail.ratingMetrics.seguranca },
                      { label: 'Infraestrutura de Apoio', score: selectedRouteDetail.ratingMetrics.infraestrutura },
                    ].map(metric => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className="text-slate-400">{metric.label}</span>
                          <span className="text-amber-400 font-mono font-bold">{metric.score} / 5.0</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            style={{ width: `${(metric.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reviews List */}
                  {selectedRouteDetail.reviews && selectedRouteDetail.reviews.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Comentários de Pilotos ({selectedRouteDetail.reviews.length})
                      </h5>

                      <div className="space-y-3">
                        {selectedRouteDetail.reviews.map(rev => (
                          <div key={rev.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <img src={rev.pilotAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                                <span className="text-xs font-bold text-white">{rev.pilotName}</span>
                                <span className="text-[10px] text-slate-500">{rev.date}</span>
                              </div>

                              <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                                <Star size={12} className="fill-amber-400" />
                                {rev.overallRating}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 italic">
                              "{rev.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: AVALIAR ROTEIRO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRatingModalOpen && selectedRouteDetail && (
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
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full my-8 shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black italic uppercase text-white">AVALIAR ROTEIRO</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedRouteDetail.name}</p>
                </div>
                <button onClick={() => setIsRatingModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitRating} className="space-y-5">
                
                <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {[
                    { key: 'paisagem', label: 'Paisagem & Mirantes' },
                    { key: 'asfalto', label: 'Qualidade do Asfalto' },
                    { key: 'curvas', label: 'Nível das Curvas' },
                    { key: 'seguranca', label: 'Segurança na Pista' },
                    { key: 'infraestrutura', label: 'Infraestrutura de Apoio' }
                  ].map(metric => (
                    <div key={metric.key} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>{metric.label}</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {(userReviewMetrics as any)[metric.key]} / 5
                        </span>
                      </div>
                      <input 
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={(userReviewMetrics as any)[metric.key]}
                        onChange={(e) => setUserReviewMetrics({
                          ...userReviewMetrics,
                          [metric.key]: Number(e.target.value)
                        })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Comentário ou Dica Adicional do Piloto</label>
                  <textarea 
                    rows={3}
                    placeholder="Conte como foi sua experiência pilotando neste trecho..."
                    value={userReviewComment}
                    onChange={(e) => setUserReviewComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-orange-600/30"
                  >
                    Enviar Avaliação
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: MOTIVO DA REJEIÇÃO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {rejectingRouteId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }} 
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <XCircle size={24} />
                <h3 className="text-lg font-black italic uppercase">REJEITAR ROTEIRO</h3>
              </div>

              <p className="text-xs text-slate-300">
                Informe o motivo da recusa para que o autor possa ajustar as informações do roteiro:
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <textarea 
                  rows={3}
                  required
                  placeholder="Ex: Endereço do Google Maps impreciso, faltam recomendações de segurança..."
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
                />

                <div className="flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => { setRejectingRouteId(null); setRejectionReasonText(''); }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-600/30"
                  >
                    Confirmar Rejeição
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature="criar_roteiro" 
      />
    </div>
  );
}

// Utility classname helper
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
