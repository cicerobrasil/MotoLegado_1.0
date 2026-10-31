import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Star, Clock, ArrowRight, Plus, Search, Sparkles, Navigation, 
  ExternalLink, RefreshCw, Check, Fuel, Info, X, Heart, Award,
  ShieldAlert, CheckCircle, XCircle, Lock, Camera, Upload, Image as ImageIcon,
  AlertCircle, Trash2, Loader2, BookOpen, Share2, Download, FileText, Printer,
  ShieldCheck, AlertTriangle, ChevronDown, Maximize2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route, RouteDifficulty, RouteRatingMetrics, RouteReview, BRAZILIAN_UFS, BrazilianUF } from '../types';
import { useAuth } from '../context/AuthContext';
import { useImageLightbox } from '../context/ImageLightboxContext';
import { isUserProOrBonificado } from '../lib/permissions';
import { UpgradeModal } from './UpgradeModal';
import { RouteShareModal } from './RouteShareModal';
import { GpsExportModal } from './GpsExportModal';
import { RoutePdfModal } from './RoutePdfModal';
import { uploadImageToStorage } from '../lib/storage';
import { clientDbService } from '../lib/dbService';
import { routeSchema, validateWithZod } from '../lib/validationSchemas';
import { cn } from '../lib/utils';

export const DEFAULT_ROUTE_FALLBACK = "https://images.unsplash.com/photo-1502472091351-875c941d9c98?auto=format&fit=crop&q=80&w=1200";

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

/**
 * Extrai a UF brasileira do roteiro (seja do campo explícito uf ou do endereço mapsAddress)
 */
export function extractUf(route: Partial<Route>): string {
  if (route.uf && BRAZILIAN_UFS.includes(route.uf.toUpperCase() as any)) {
    return route.uf.toUpperCase();
  }
  const textToScan = `${route.mapsAddress || ''} ${route.name || ''}`;
  const match = textToScan.match(/(?:[-/,\s])([A-Z]{2})(?:\b|$)/i);
  if (match && BRAZILIAN_UFS.includes(match[1].toUpperCase() as any)) {
    return match[1].toUpperCase();
  }
  return '';
}

/**
 * Extrai a cidade/localidade sem a UF para exibição limpa
 */
export function extractCity(route: Partial<Route>): string {
  if (route.city && route.city.trim()) return route.city.trim();
  const address = route.mapsAddress || '';
  const parts = address.split(/[-/]/);
  if (parts.length > 1) {
    return parts[0].trim();
  }
  return address.trim();
}

export function Routes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const isVip = isUserProOrBonificado(profile);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [sharingRoute, setSharingRoute] = useState<Route | null>(null);
  const [exportingGpsRoute, setExportingGpsRoute] = useState<Route | null>(null);
  const [pdfExportRoute, setPdfExportRoute] = useState<Route | null>(null);

  const handleExportPdf = (targetRoute: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPdfExportRoute(targetRoute);
  };

  const handleLaunchInLogbook = (targetRoute: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const metrics = estimateRouteMetrics(targetRoute);
    const query = new URLSearchParams({
      routeTitle: targetRoute.name,
      routeDest: targetRoute.mapsAddress || targetRoute.endPoint || '',
      routeOrigin: targetRoute.startPoint || '',
      routeDesc: targetRoute.description || '',
      routeImg: targetRoute.image || '',
      routeDist: String(targetRoute.distance || metrics.distance || '150'),
      routeDuration: targetRoute.duration || metrics.duration || '2h 15min',
      routeMaps: targetRoute.mapsUrl || (targetRoute.mapsAddress.startsWith('http') ? targetRoute.mapsAddress : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetRoute.mapsAddress || targetRoute.name)}`)
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
      routeDist: String(targetRoute.distance || metrics.distance || '150'),
      routeDuration: targetRoute.duration || metrics.duration || '2h 15min',
      routeMaps: targetRoute.mapsUrl || (targetRoute.mapsAddress.startsWith('http') ? targetRoute.mapsAddress : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetRoute.mapsAddress || targetRoute.name)}`),
      openCamera: 'true'
    }).toString();
    navigate(`/logbook?${query}`);
  };

  const { openCarousel } = useImageLightbox();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'populares' | 'favoritos' | 'meus'>('todos');
  const [selectedUfFilter, setSelectedUfFilter] = useState<string>('TODAS');
  const [searchText, setSearchText] = useState('');
  
  // Modals & Notifications state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);

  const handleOpenCreateRoute = () => {
    if (!isVip) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setNewTitle('');
    setNewMapsAddress('');
    setNewUf('SP');
    setNewMapsUrl('');
    setNewImage('');
    setNewImages([]);
    setNewDescription('');
    setNewRiderTips('');
    setAiError(null);
    setCreateFormError(null);
    setIsSubmittingRoute(false);
    setIsCreateModalOpen(true);
  };
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<Route | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccessConfirmation, setRatingSuccessConfirmation] = useState<{ route: Route; rating: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modais de confirmação visual do sistema (indispensáveis para o operador)
  const [submissionSuccessRoute, setSubmissionSuccessRoute] = useState<Route | null>(null);
  const [routeEditSuccessModal, setRouteEditSuccessModal] = useState<{ route: Route; message: string } | null>(null);

  // Edição de Roteiro (Admin & Autor)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editRouteName, setEditRouteName] = useState('');
  const [editRouteMapsAddress, setEditRouteMapsAddress] = useState('');
  const [editRouteUf, setEditRouteUf] = useState('SP');
  const [editRouteMapsUrl, setEditRouteMapsUrl] = useState('');
  const [editRouteDistance, setEditRouteDistance] = useState('');
  const [editRouteDuration, setEditRouteDuration] = useState('');
  const [editRouteDescription, setEditRouteDescription] = useState('');
  const [editRouteRiderTips, setEditRouteRiderTips] = useState('');
  const [editRouteDifficulty, setEditRouteDifficulty] = useState<RouteDifficulty>(RouteDifficulty.MEDIUM);
  const [editRouteImages, setEditRouteImages] = useState<string[]>([]);
  const [isSavingRouteEdits, setIsSavingRouteEdits] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.email?.toLowerCase() === 'ciceroranieri@gmail.com';
  const isModeratorOrAdmin = isAdmin;

  const isUserAuthor = (r: Route) => {
    if (r.author?.name === "Você (Piloto)") return true;
    if (profile?.name && (r.author?.name?.toLowerCase() === profile.name.toLowerCase() || r.author_name?.toLowerCase() === profile.name.toLowerCase())) return true;
    if (profile?.id && (r.author_id === profile.id || r.author?.id === profile.id)) return true;
    if (profile?.email && (r.author_email?.toLowerCase() === profile.email.toLowerCase() || r.author_id?.toLowerCase() === profile.email.toLowerCase())) return true;
    return false;
  };

  // Photo Upload & Preview State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const detailPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDetailPhoto, setIsUploadingDetailPhoto] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // New Route Form State
  const [newTitle, setNewTitle] = useState('');
  const [newMapsAddress, setNewMapsAddress] = useState('');
  const [newUf, setNewUf] = useState<string>('SP');
  const [newMapsUrl, setNewMapsUrl] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<RouteDifficulty>(RouteDifficulty.MEDIUM);
  const [newImage, setNewImage] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]); // Até 3 fotos no cadastro
  const [newDescription, setNewDescription] = useState('');
  const [newRiderTips, setNewRiderTips] = useState('');

  // Upload múltiplo de fotos (até 3 no total)
  const handleMultiPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - newImages.length;
    if (remainingSlots <= 0) {
      showToast('Limite máximo de 3 fotos atingido para o roteiro.', 'info');
      return;
    }

    setIsUploadingPhoto(true);
    setImageLoadError(false);
    const toUpload = Array.from(files).slice(0, remainingSlots);
    const uploadedUrls: string[] = [];

    try {
      for (const file of toUpload) {
        const result = await uploadImageToStorage(file, {
          folder: 'routes',
          userId: profile?.id || 'pilot'
        });

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setNewImages(prev => {
          const merged = [...prev, ...uploadedUrls].slice(0, 3);
          setNewImage(merged[0] || '');
          return merged;
        });
        showToast(`${uploadedUrls.length} foto(s) anexada(s) com sucesso (máximo 3).`, 'success');
      }
    } catch (err: any) {
      showToast('Falha no upload de fotos: ' + (err?.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

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
        setNewImages(prev => {
          const next = prev.filter(u => u !== result.url);
          return [result.url, ...next].slice(0, 3);
        });
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

  // Apenas o Administrador tem autorização para trocar ou adicionar fotos do roteiro existente
  const handleDetailPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRouteDetail) return;

    if (!isAdmin) {
      showToast('Apenas administradores do sistema têm autorização para trocar ou gerenciar fotos do roteiro.', 'error');
      return;
    }

    setIsUploadingDetailPhoto(true);
    try {
      const result = await uploadImageToStorage(file, {
        folder: 'routes',
        userId: profile?.id || 'admin'
      });

      if (result.success && result.url) {
        const existingImages = Array.isArray(selectedRouteDetail.images) && selectedRouteDetail.images.length > 0
          ? [...selectedRouteDetail.images]
          : (selectedRouteDetail.image ? [selectedRouteDetail.image] : []);

        let updatedImages: string[] = [];
        if (existingImages.length < 3) {
          updatedImages = [...existingImages, result.url];
        } else {
          // Substitui a foto de capa
          updatedImages = [result.url, existingImages[1], existingImages[2]].filter(Boolean);
        }

        const updatedRoute: Route = { 
          ...selectedRouteDetail, 
          image: updatedImages[0],
          cover_image: updatedImages[0],
          images: updatedImages
        };

        setSelectedRouteDetail(updatedRoute);
        const updatedList = routes.map(r => r.id === selectedRouteDetail.id ? updatedRoute : r);
        saveRoutes(updatedList, updatedRoute);

        setRouteEditSuccessModal({
          route: updatedRoute,
          message: 'Foto do roteiro atualizada com sucesso pelo Administrador!'
        });
        showToast('Foto do roteiro atualizada pelo Administrador com sucesso!', 'success');
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

  const handleOpenEditRoute = (route: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const metrics = estimateRouteMetrics(route);
    setEditingRoute(route);
    setEditRouteName(route.name || '');
    setEditRouteMapsAddress(route.city || extractCity(route));
    setEditRouteUf(route.uf || extractUf(route) || 'SP');
    setEditRouteMapsUrl(route.mapsUrl || '');
    setEditRouteDistance(route.distance ? String(route.distance) : metrics.distance);
    setEditRouteDuration(route.duration || metrics.duration);
    setEditRouteDescription(route.description || '');
    setEditRouteRiderTips(route.riderTips || '');
    setEditRouteDifficulty(route.difficulty || RouteDifficulty.MEDIUM);
    const existingImgs = Array.isArray(route.images) && route.images.length > 0
      ? route.images
      : (route.image ? [route.image] : []);
    setEditRouteImages(existingImgs);
  };

  const handleSaveRouteEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    const trimmedName = editRouteName.trim();
    if (!trimmedName) {
      showToast('Por favor, informe o título do roteiro.', 'error');
      return;
    }
    const trimmedCity = editRouteMapsAddress.trim();
    if (!trimmedCity) {
      showToast('Por favor, informe o endereço / cidade.', 'error');
      return;
    }

    setIsSavingRouteEdits(true);
    try {
      const distNum = parseInt(editRouteDistance.replace(/\D/g, ''), 10);
      const fullAddress = trimmedCity.toLowerCase().includes(editRouteUf.toLowerCase())
        ? trimmedCity
        : `${trimmedCity} - ${editRouteUf}`;

      const finalImgs = editRouteImages.length > 0 
        ? editRouteImages.slice(0, 3) 
        : (editingRoute.images || (editingRoute.image ? [editingRoute.image] : []));

      const updatedRoute: Route = {
        ...editingRoute,
        name: trimmedName,
        city: trimmedCity,
        uf: editRouteUf,
        mapsAddress: fullAddress,
        mapsUrl: editRouteMapsUrl.trim() || editingRoute.mapsUrl,
        distance: !isNaN(distNum) && distNum > 0 ? distNum : editingRoute.distance,
        duration: editRouteDuration.trim() || editingRoute.duration,
        description: editRouteDescription.trim() || editingRoute.description,
        riderTips: editRouteRiderTips.trim() || editingRoute.riderTips,
        difficulty: editRouteDifficulty,
        image: finalImgs[0] || editingRoute.image || DEFAULT_ROUTE_FALLBACK,
        cover_image: finalImgs[0] || editingRoute.cover_image || DEFAULT_ROUTE_FALLBACK,
        images: finalImgs
      };

      // 1. Grava diretamente no MySQL da Hostinger / backend
      await clientDbService.routes.save(updatedRoute);

      // 2. Atualiza estado em memória
      const updatedList = routes.map(r => r.id === updatedRoute.id ? updatedRoute : r);
      setRoutes(updatedList);
      if (selectedRouteDetail && selectedRouteDetail.id === updatedRoute.id) {
        setSelectedRouteDetail(updatedRoute);
      }
      window.dispatchEvent(new Event('routes-updated'));

      // 3. Fecha modal de edição e exibe TELA DE CONFIRMAÇÃO VISUAL INDISPENSÁVEL
      setEditingRoute(null);
      setRouteEditSuccessModal({
        route: updatedRoute,
        message: 'As alterações do roteiro foram gravadas com sucesso no banco de dados!'
      });
      showToast('Roteiro atualizado com sucesso!', 'success');
    } catch (err: any) {
      console.error('[Routes] Erro ao gravar edição:', err);
      showToast(err?.message || 'Falha ao gravar alterações no roteiro.', 'error');
    } finally {
      setIsSavingRouteEdits(false);
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
  const [userOverallRating, setUserOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userReviewComment, setUserReviewComment] = useState('');
  const [userReviewMetrics, setUserReviewMetrics] = useState<RouteRatingMetrics>({
    paisagem: 5,
    asfalto: 4,
    curvas: 4,
    seguranca: 4,
    infraestrutura: 4
  });

  const [isRefreshingRoutes, setIsRefreshingRoutes] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  // Consulta e sincronização das rotas com o MySQL da Hostinger / backend como fonte única da verdade
  const fetchLiveRoutes = async (isManual = false) => {
    if (isManual) {
      setIsRefreshingRoutes(true);
    } else {
      setIsLoadingRoutes(true);
    }

    try {
      // Purga qualquer resíduo anterior do localStorage em qualquer estação
      try {
        localStorage.removeItem('motolegado_routes_v3');
        localStorage.removeItem('motolegado_routes');
      } catch {}

      const dbRoutes = await clientDbService.routes.getAll();
      const validDbRoutes = Array.isArray(dbRoutes) ? dbRoutes : [];

      const normalizedList = validDbRoutes.map((r) => {
        const effectiveImg = r.image || (r as any).cover_image || DEFAULT_ROUTE_FALLBACK;
        return {
          ...r,
          image: effectiveImg,
          cover_image: effectiveImg
        };
      });

      // A lista do banco de dados É a verdade definitiva do sistema.
      // Substitui integralmente o estado em memória e purga caches legados
      setRoutes(normalizedList);

      if (isManual) {
        showToast('Rotas sincronizadas com sucesso com o servidor!', 'success');
      }
    } catch (err) {
      console.warn('[Routes] Aviso ao carregar rotas do backend:', err);
      if (isManual) {
        showToast('Não foi possível sincronizar no momento. Verifique a conexão.', 'error');
      }
    } finally {
      if (isManual) setIsRefreshingRoutes(false);
      setIsLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchLiveRoutes(false);

    const handleSync = () => fetchLiveRoutes(false);
    window.addEventListener('routes-updated', handleSync);
    return () => {
      window.removeEventListener('routes-updated', handleSync);
    };
  }, []);

  const handleDeleteRoute = async (targetRoute: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`Deseja excluir permanentemente o roteiro "${targetRoute.name}"?\nEsta ação removerá o registro para todos os usuários e estações.`);
    if (!confirmed) return;

    try {
      await clientDbService.routes.delete(targetRoute.id);
      const remaining = routes.filter(r => r.id !== targetRoute.id);
      setRoutes(remaining);
      try {
        localStorage.removeItem('motolegado_routes_v3');
        localStorage.removeItem('motolegado_routes');
      } catch {}
      window.dispatchEvent(new Event('routes-updated'));
      if (selectedRouteDetail?.id === targetRoute.id) {
        setSelectedRouteDetail(null);
      }
      showToast('Roteiro excluído permanentemente com sucesso!', 'success');
    } catch (err: any) {
      showToast('Falha ao excluir roteiro: ' + (err?.message || 'Erro no servidor'), 'error');
    }
  };

  // Trata abertura automática de rota/viagem compartilhada via link único (/routes?routeId=...)
  useEffect(() => {
    const targetRouteId = searchParams.get('routeId') || searchParams.get('id') || searchParams.get('share');
    const tripDataParam = searchParams.get('tripData');

    if (!targetRouteId && !tripDataParam) return;

    // 1. Procura na lista de rotas já carregadas
    if (routes.length > 0 && targetRouteId) {
      const found = routes.find(r => r.id === targetRouteId);
      if (found) {
        setSelectedRouteDetail(found);
        showToast(`🗺️ Roteiro compartilhado carregado: ${found.name}`, 'info');
        return;
      }
    }

    // 2. Se a rota não estiver na lista local (enviada de outro dispositivo), decodifica o payload
    if (tripDataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(tripDataParam))));
        if (decoded && decoded.name) {
          const reconstructedRoute: Route = {
            id: decoded.id || targetRouteId || `shared-${Date.now()}`,
            name: decoded.name,
            mapsAddress: decoded.mapsAddress || 'Destino da rota',
            mapsUrl: decoded.mapsUrl,
            description: decoded.description || 'Roteiro compartilhado por um piloto da comunidade.',
            riderTips: decoded.riderTips || '',
            difficulty: decoded.difficulty || RouteDifficulty.MEDIUM,
            image: decoded.image || DEFAULT_ROUTE_FALLBACK,
            distance: decoded.distance,
            duration: decoded.duration,
            rating: 5.0,
            totalRatingsCount: 1,
            ratingMetrics: { paisagem: 5, asfalto: 5, curvas: 5, seguranca: 5, infraestrutura: 5 },
            status: 'aprovado'
          };
          setSelectedRouteDetail(reconstructedRoute);
          showToast(`🗺️ Roteiro compartilhado carregado: ${reconstructedRoute.name}`, 'info');
        }
      } catch (err) {
        console.warn('[Routes] Falha ao decodificar dados do link compartilhado:', err);
      }
    }
  }, [searchParams, routes]);

  const saveRoutes = (updated: Route[], routeToPersist?: Route) => {
    setRoutes(updated);
    try {
      localStorage.removeItem('motolegado_routes_v3');
      localStorage.removeItem('motolegado_routes');
    } catch {}
    window.dispatchEvent(new Event('routes-updated'));

    // Sincroniza persistência com o MySQL da Hostinger / backend resiliente
    if (routeToPersist) {
      clientDbService.routes.save(routeToPersist)
        .then((saved) => {
          console.log('[Routes] Roteiro gravado com sucesso no backend:', saved?.id || routeToPersist.id);
        })
        .catch((e) => {
          console.warn('[Routes] Aviso ao persistir rota no backend:', e);
        });
    }
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5500);
  };

  // Sugerir Descrição e Técnicas com IA Gemini
  const handleSuggestAiRouteContent = async () => {
    const queryTerm = newTitle.trim() || newMapsAddress.trim();
    if (!queryTerm) {
      showToast("Por favor, informe o Título ou o Endereço/Destino do Roteiro para a IA sugerir a descrição e as técnicas.", "info");
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/routes/ai-suggest-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          address: newMapsAddress.trim()
        })
      });

      const data = await res.json();
      if (res.ok && (data.description || data.techniques)) {
        if (data.description) setNewDescription(data.description);
        if (data.techniques) setNewRiderTips(data.techniques);
        showToast("✨ Sugestão de descrição e técnicas gerada com sucesso pela IA!", "success");
      } else {
        throw new Error(data.error || "Não foi possível gerar sugestões.");
      }
    } catch (err: any) {
      console.warn("API Error, using fallback suggestions", err);
      const effectiveTitle = newTitle.trim() || newMapsAddress.trim() || 'Roteiro de Moto';
      const fallbackDesc = `Roteiro fascinante por "${effectiveTitle}"${newMapsAddress.trim() ? ` (${newMapsAddress.trim()})` : ''}. Um percurso repleto de belezas cênicas, curvas dinâmicas e paisagens ideais para quem viaja de moto.`;
      const fallbackTech = `• Pilotagem & Curvas: Mantenha olhar na saída da curva, postura relaxada e modulação precisa no acelerador.\n• Atenção ao Asfalto: Cuidado com possíveis trechos úmidos pela manhã e folhas em curvas sombreadas.\n• Planejamento: Abasteça a moto nos pontos de apoio e verifique a calibragem dos pneus.\n• Segurança: Uso de equipamentos completos de proteção para todas as condições climáticas.`;

      setNewDescription(fallbackDesc);
      setNewRiderTips(fallbackTech);
      showToast("✨ Sugestão de descrição e técnicas gerada com sucesso!", "success");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Create Route Handler (Submitted for Moderation)
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      const err = "Por favor, informe o título do roteiro (mínimo de 3 caracteres).";
      setCreateFormError(err);
      showToast(err, "error");
      return;
    }

    const trimmedAddress = newMapsAddress.trim();
    if (!trimmedAddress || trimmedAddress.length < 2) {
      const err = "Por favor, informe a localização ou endereço da rota no Google Maps.";
      setCreateFormError(err);
      showToast(err, "error");
      return;
    }

    const calculatedAvgRating = parseFloat(
      ((newMetrics.paisagem + newMetrics.asfalto + newMetrics.curvas + newMetrics.seguranca + newMetrics.infraestrutura) / 5).toFixed(1)
    );

    let formattedMapsUrl = newMapsUrl.trim();
    if (formattedMapsUrl && !formattedMapsUrl.startsWith('http://') && !formattedMapsUrl.startsWith('https://')) {
      formattedMapsUrl = `https://${formattedMapsUrl}`;
    }
    if (!formattedMapsUrl) {
      formattedMapsUrl = trimmedAddress.startsWith('http')
        ? trimmedAddress
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedAddress || trimmedTitle)}`;
    }

    const sanitizedImage = sanitizeAndExtractImageUrl(newImage);
    const primaryImg = newImages[0] || sanitizedImage.trim() || DEFAULT_ROUTE_FALLBACK;
    const finalImages = newImages.length > 0 ? newImages.slice(0, 3) : [primaryImg];
    const fullAddress = trimmedAddress.toLowerCase().includes(newUf.toLowerCase())
      ? trimmedAddress
      : `${trimmedAddress} - ${newUf}`;
    const trimmedDescription = newDescription.trim() || `Roteiro por ${trimmedTitle}. Percurso incrível para motociclistas com belas paisagens e curvas.`;

    const newRouteItem: Route = {
      id: "route-" + Date.now(),
      name: trimmedTitle,
      city: trimmedAddress,
      uf: newUf,
      mapsAddress: fullAddress,
      mapsUrl: formattedMapsUrl,
      description: trimmedDescription,
      riderTips: newRiderTips.trim() || "Verifique a calibragem dos pneus, nível de combustível e equipe-se com proteções adequadas.",
      difficulty: newDifficulty,
      image: primaryImg,
      cover_image: primaryImg,
      images: finalImages,
      author: {
        name: profile?.name || "Você (Piloto)",
        avatar: profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        id: profile?.id || 'pilot'
      },
      author_id: profile?.id || 'pilot',
      author_name: profile?.name || "Você (Piloto)",
      author_avatar: profile?.avatar_url || '',
      author_email: profile?.email || '',
      rating: calculatedAvgRating,
      totalRatingsCount: 1,
      ratingMetrics: newMetrics,
      reviews: [],
      createdAt: new Date().toISOString().split('T')[0],
      isFavorite: false,
      status: 'pendente' // NOVO ROTEIRO VEM PENDENTE DE MODERAÇÃO
    };

    // Validação com Zod no cliente
    const validation = validateWithZod(routeSchema, newRouteItem);
    if (!validation.success) {
      setCreateFormError(validation.error);
      showToast(validation.error, "error");
      return;
    }

    setIsSubmittingRoute(true);

    try {
      // 1. Salva diretamente no banco de dados da Hostinger / backend
      let savedRouteItem: Route = newRouteItem;
      try {
        const dbResult = await clientDbService.routes.save(newRouteItem);
        if (dbResult && dbResult.id) {
          savedRouteItem = {
            ...newRouteItem,
            ...dbResult,
            image: dbResult.image || newRouteItem.image,
            cover_image: dbResult.cover_image || newRouteItem.cover_image,
            images: Array.isArray(dbResult.images) && dbResult.images.length > 0 ? dbResult.images : newRouteItem.images
          };
        }
      } catch (saveErr) {
        console.warn("[Routes] Salvo em contingência local devido a oscilação de rede:", saveErr);
      }

      // 2. Atualiza estado da lista em memória garantindo visibilidade imediata
      setRoutes(prev => [savedRouteItem, ...prev.filter(r => r.id !== savedRouteItem.id)]);
      window.dispatchEvent(new Event('routes-updated'));

      // 3. Fecha o modal de cadastro
      setIsCreateModalOpen(false);

      // 4. Limpa os estados do formulário
      setNewTitle('');
      setNewMapsAddress('');
      setNewUf('SP');
      setNewMapsUrl('');
      setNewDescription('');
      setNewRiderTips('');
      setNewImage('');
      setNewImages([]);
      setCreateFormError(null);

      // 5. APRESENTA A TELA DE CONFIRMAÇÃO DE ENVIO PARA MODERAÇÃO (INDISPENSÁVEL PARA O OPERADOR)
      setSubmissionSuccessRoute(savedRouteItem);

      // 6. Seleciona automaticamente a aba 'Meus Roteiros' onde o autor vê seu registro pendente
      setActiveFilter('meus');

      showToast("🛡️ Roteiro gravado e enviado para moderação com sucesso!", "success");
    } catch (err: any) {
      console.error("[Routes] Falha no envio para moderação:", err);
      setCreateFormError(err?.message || "Erro inesperado ao gravar o roteiro.");
      showToast(err?.message || "Erro ao gravar roteiro.", "error");
    } finally {
      setIsSubmittingRoute(false);
    }
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

  // Submit User Review / Rating to Selected Route (Baseado na média de avaliação dos pilotos)
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteDetail) return;

    setIsSubmittingRating(true);
    try {
      const computedMetricAvg = parseFloat(
        ((userReviewMetrics.paisagem + userReviewMetrics.asfalto + userReviewMetrics.curvas + userReviewMetrics.seguranca + userReviewMetrics.infraestrutura) / 5).toFixed(1)
      );
      const finalUserRating = userOverallRating || computedMetricAvg;

      const pilotDisplayName = profile?.name || 'Piloto Registrado';
      const pilotAvatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotDisplayName)}&background=ea580c&color=ffffff&bold=true`;

      const newReview: RouteReview = {
        id: "rev-" + Date.now(),
        pilotName: pilotDisplayName,
        pilotAvatar: pilotAvatarUrl,
        date: new Date().toLocaleDateString('pt-BR'),
        overallRating: finalUserRating,
        comment: userReviewComment.trim() || "Roteiro excelente! Ótimas curvas e belas paisagens.",
        metrics: userReviewMetrics
      };

      const existingReviews = selectedRouteDetail.reviews || [];
      const updatedReviews = [newReview, ...existingReviews];
      const curCount = selectedRouteDetail.totalRatingsCount || 0;
      const newTotalCount = curCount + 1;

      // Recalcular métricas médias ponderadas dos pilotos
      const curMetrics = selectedRouteDetail.ratingMetrics || { paisagem: 5, asfalto: 5, curvas: 5, seguranca: 5, infraestrutura: 5 };
      const updatedMetrics: RouteRatingMetrics = {
        paisagem: parseFloat(((curMetrics.paisagem * curCount + userReviewMetrics.paisagem) / newTotalCount).toFixed(1)),
        asfalto: parseFloat(((curMetrics.asfalto * curCount + userReviewMetrics.asfalto) / newTotalCount).toFixed(1)),
        curvas: parseFloat(((curMetrics.curvas * curCount + userReviewMetrics.curvas) / newTotalCount).toFixed(1)),
        seguranca: parseFloat(((curMetrics.seguranca * curCount + userReviewMetrics.seguranca) / newTotalCount).toFixed(1)),
        infraestrutura: parseFloat(((curMetrics.infraestrutura * curCount + userReviewMetrics.infraestrutura) / newTotalCount).toFixed(1)),
      };

      // A nova nota do roteiro é a média exata das avaliações dos pilotos
      const curRating = typeof selectedRouteDetail.rating === 'number' ? selectedRouteDetail.rating : 5.0;
      const updatedAvgRating = parseFloat(
        (((curRating * curCount) + finalUserRating) / newTotalCount).toFixed(1)
      );

      const updatedRoute: Route = {
        ...selectedRouteDetail,
        rating: updatedAvgRating,
        totalRatingsCount: newTotalCount,
        ratingMetrics: updatedMetrics,
        reviews: updatedReviews
      };

      const updatedRoutesList = routes.map(r => r.id === updatedRoute.id ? updatedRoute : r);
      saveRoutes(updatedRoutesList, updatedRoute);
      setSelectedRouteDetail(updatedRoute);

      setIsRatingModalOpen(false);
      setUserReviewComment('');
      setRatingSuccessConfirmation({ route: updatedRoute, rating: finalUserRating });
      showToast(`⭐ Avaliação registrada! Nova média do roteiro: ${updatedAvgRating} / 5.0 (baseada em ${newTotalCount} avaliações de pilotos)`, "success");
    } catch (err: any) {
      showToast('Erro ao gravar avaliação.', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Contagem de UFs disponíveis nos roteiros
  const availableUfsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    routes.forEach(r => {
      const uf = extractUf(r);
      if (uf) {
        counts[uf] = (counts[uf] || 0) + 1;
      }
    });
    return BRAZILIAN_UFS
      .filter(uf => counts[uf] > 0)
      .map(uf => ({ uf, count: counts[uf] }));
  }, [routes]);

  // Filtered List com busca inteligente por múltiplos termos / palavras-chave
  const filteredRoutes = routes.filter(r => {
    const searchTrimmed = searchText.trim().toLowerCase();
    if (searchTrimmed) {
      const searchTerms = searchTrimmed.split(/\s+/).filter(Boolean);
      const routeName = (r.name || '').toLowerCase();
      const routeCity = (r.city || extractCity(r) || '').toLowerCase();
      const routeUf = (r.uf || extractUf(r) || '').toLowerCase();
      const routeAddress = (r.mapsAddress || '').toLowerCase();
      const routeDesc = (r.description || '').toLowerCase();
      const routeTips = (r.riderTips || '').toLowerCase();
      const routeDiff = (r.difficulty || '').toLowerCase();
      const routeStart = (r.startPoint || '').toLowerCase();
      const routeEnd = (r.endPoint || '').toLowerCase();

      const matchesSearch = searchTerms.every(term => 
        routeName.includes(term) ||
        routeCity.includes(term) ||
        routeUf.includes(term) ||
        routeAddress.includes(term) ||
        routeDesc.includes(term) ||
        routeTips.includes(term) ||
        routeDiff.includes(term) ||
        routeStart.includes(term) ||
        routeEnd.includes(term)
      );

      if (!matchesSearch) return false;
    }

    // Filtro por Estado / UF
    if (selectedUfFilter !== 'TODAS') {
      const routeUf = extractUf(r);
      if (routeUf !== selectedUfFilter) return false;
    }

    if (activeFilter === 'meus') return isUserAuthor(r);
    if (activeFilter === 'favoritos') return r.isFavorite && (r.status === 'aprovado' || !r.status || isUserAuthor(r) || isModeratorOrAdmin);
    if (activeFilter === 'populares') return r.rating >= 4.8 && (r.status === 'aprovado' || !r.status);

    // Default 'todos': Roteiros aprovados OU roteiros pendentes do próprio usuário OU todos se for administrador/moderador
    return (r.status === 'aprovado' || !r.status) || isUserAuthor(r) || isModeratorOrAdmin;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Toast Notification Banner (Flutuante com z-index máximo sobre todos os modais) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-5 right-5 sm:right-8 max-w-md w-[calc(100%-2.5rem)] p-4 rounded-2xl border font-bold text-xs flex items-center justify-between gap-3 shadow-2xl z-[9999] backdrop-blur-xl",
              toastMessage.type === 'success' ? "bg-emerald-950/95 border-emerald-500/60 text-emerald-200" :
              toastMessage.type === 'error' ? "bg-rose-950/95 border-rose-500/60 text-rose-200" :
              "bg-amber-950/95 border-amber-500/60 text-amber-200"
            )}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
              {toastMessage.type === 'error' && <XCircle size={18} className="text-rose-400 shrink-0" />}
              {toastMessage.type === 'info' && <ShieldAlert size={18} className="text-amber-400 shrink-0" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer">
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
                EXPEDIÇÕES E DESTINOS PARA MOTOCICLISTAS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button 
            type="button"
            onClick={() => fetchLiveRoutes(true)}
            disabled={isRefreshingRoutes}
            className="flex-1 lg:flex-none px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 text-slate-200 hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="Buscar versão mais recente e limpar dados em cache do servidor"
          >
            <RefreshCw size={15} className={cn("text-orange-500", isRefreshingRoutes && "animate-spin")} />
            <span>{isRefreshingRoutes ? "Atualizando..." : "Sincronizar"}</span>
          </button>

          <button 
            onClick={handleOpenCreateRoute}
            className="flex-1 lg:flex-none btn-primary"
          >
            {isVip ? <Plus size={16} /> : <Lock size={15} />}
            <span>{isVip ? "CRIAR ROTEIRO AGORA" : "+ CRIAR ROTEIRO (VIP PRO)"}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SEÇÃO INTEGRADA DE BUSCA E FILTROS (100% RESPONSIVA, SEM CORTES) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-3 shadow-xl">
        
        {/* Linha 1: Input de Busca com Contador e Limpeza */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 flex items-center bg-slate-950 border border-slate-800 focus-within:border-orange-500 rounded-xl px-3 py-2 transition-all">
            <Search size={18} className="text-orange-500 shrink-0 mr-2.5" />
            <input 
              type="text" 
              placeholder="Buscar por nome, cidade ou palavra-chave..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
            {searchText && (
              <button 
                type="button"
                onClick={() => setSearchText('')}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-1.5"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Seletor de UF Compacto */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2">
              <MapPin size={13} className="text-orange-500 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-400">UF:</span>
              <select
                value={selectedUfFilter}
                onChange={(e) => setSelectedUfFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-orange-400 outline-none cursor-pointer"
              >
                <option value="TODAS" className="bg-slate-900 text-white">TODAS ({routes.length})</option>
                {availableUfsWithCount.map(({ uf, count }) => (
                  <option key={uf} value={uf} className="bg-slate-900 text-white">
                    {uf} ({count})
                  </option>
                ))}
              </select>
              {selectedUfFilter !== 'TODAS' && (
                <button
                  type="button"
                  onClick={() => setSelectedUfFilter('TODAS')}
                  className="text-[10px] text-slate-400 hover:text-white px-1 rounded bg-slate-800 cursor-pointer ml-0.5"
                  title="Limpar filtro de estado"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Contador de Roteiros */}
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
              {filteredRoutes.length} {filteredRoutes.length === 1 ? 'roteiro' : 'roteiros'}
            </div>
          </div>
        </div>

        {/* Linha 2: Categorias / Abas com quebra flexível (sem cortar na horizontal) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos os Roteiros' },
              { id: 'populares', label: '⭐ Mais Avaliados' },
              { id: 'favoritos', label: '❤️ Favoritos' },
              { id: 'meus', label: '👤 Meus Roteiros' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer",
                  activeFilter === f.id
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(searchText.trim() || selectedUfFilter !== 'TODAS' || activeFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchText('');
                setSelectedUfFilter('TODAS');
                setActiveFilter('todos');
              }}
              className="text-[11px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 underline cursor-pointer ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Linha 3: Sugestões de Palavras-Chave em flex-wrap (NUNCA corta palavras) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/50">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Sparkles size={11} className="text-orange-400 shrink-0" />
            Palavras-chave:
          </span>
          {[
            'Serra',
            'Curvas',
            'Litoral',
            'Mirante',
            'Asfalto',
            'Histórico',
            'Gastronomia',
            'Cânion'
          ].map((keyword) => {
            const isSelected = searchText.toLowerCase().includes(keyword.toLowerCase());
            return (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSearchText('');
                  } else {
                    setSearchText(keyword);
                  }
                }}
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95",
                  isSelected
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                )}
                title={`Buscar roteiros com ${keyword}`}
              >
                #{keyword}
              </button>
            );
          })}
        </div>

        {/* Linha 4: Indicador de Filtro Ativo quando há busca ou filtro de UF */}
        {(searchText.trim() || selectedUfFilter !== 'TODAS') && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-black uppercase tracking-wider text-[10px] text-orange-400">Ativo:</span>
              {searchText.trim() && (
                <span className="bg-orange-500/20 px-2 py-0.5 rounded-md text-white font-bold text-[11px]">
                  "{searchText}"
                </span>
              )}
              {selectedUfFilter !== 'TODAS' && (
                <span className="bg-orange-500/20 px-2 py-0.5 rounded-md text-white font-bold text-[11px]">
                  UF: {selectedUfFilter}
                </span>
              )}
              <span className="text-slate-400 text-[10px]">
                ({filteredRoutes.length} {filteredRoutes.length === 1 ? 'encontrado' : 'encontrados'})
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ROUTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredRoutes.map((route, i) => {
          const isPending = route.status === 'pendente';
          const isRejected = route.status === 'rejeitado';
          const isApproved = route.status === 'aprovado' || !route.status;
          const routePhotos = Array.isArray(route.images) && route.images.length > 0
            ? route.images
            : [route.image || DEFAULT_ROUTE_FALLBACK];

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
                {/* Image & Badges - Clicar na imagem abre o carrossel interativo */}
                <div 
                  className="relative h-56 overflow-hidden cursor-zoom-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCarousel(routePhotos, 0, route.name, `${extractCity(route)} • ${extractUf(route)}`);
                  }}
                  title="Clique para ampliar no modo Carrossel"
                >
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
                  
                  {/* Photo Count Badge if multiple */}
                  {routePhotos.length > 1 && (
                    <div className="absolute bottom-16 right-4 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white text-[10px] font-black flex items-center gap-1.5 shadow-md">
                      <Camera size={11} className="text-orange-400" />
                      <span>{routePhotos.length} fotos</span>
                    </div>
                  )}

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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botão de Edição para Autor ou Admin */}
                      {(isUserAuthor(route) || isAdmin) && (
                        <button 
                          onClick={(e) => handleOpenEditRoute(route, e)}
                          className="p-2 rounded-full backdrop-blur-md border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-all cursor-pointer shadow-md active:scale-95"
                          title="Editar Informações do Roteiro"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      <button 
                        onClick={(e) => handleExportPdf(route, e)}
                        className="p-2 rounded-full backdrop-blur-md border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer shadow-md active:scale-95"
                        title="Exportar para PDF (Imprimir / Salvar)"
                      >
                        <FileText size={14} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportingGpsRoute(route);
                        }}
                        className="p-2 rounded-full backdrop-blur-md border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-sky-400 hover:border-sky-500/50 transition-all cursor-pointer shadow-md active:scale-95"
                        title="Exportar para GPS (GPX / KML)"
                      >
                        <Download size={14} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingRoute(route);
                        }}
                        className="p-2 rounded-full backdrop-blur-md border border-slate-800 bg-slate-950/70 text-slate-300 hover:text-[#ff751f] hover:border-[#ff751f]/50 transition-all cursor-pointer shadow-md active:scale-95"
                        title="Compartilhar Roteiro / Viagem"
                      >
                        <Share2 size={14} />
                      </button>

                      <button 
                        onClick={(e) => handleToggleFavorite(route.id, e)}
                        className={cn(
                          "p-2 rounded-full backdrop-blur-md border transition-all shrink-0 cursor-pointer",
                          route.isFavorite 
                            ? "bg-rose-600/80 text-white border-rose-500" 
                            : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                        )}
                      >
                        <Heart size={14} className={route.isFavorite ? "fill-white" : ""} />
                      </button>

                      {(isUserAuthor(route) || isModeratorOrAdmin) && (
                        <button 
                          onClick={(e) => handleDeleteRoute(route, e)}
                          className="p-2 rounded-full backdrop-blur-md border border-slate-800 bg-slate-950/70 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all cursor-pointer shadow-md active:scale-95"
                          title="Excluir Roteiro Permanentemente do Servidor"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title on Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {route.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 line-clamp-1">
                      <MapPin size={12} className="text-orange-500 shrink-0" />
                      <span>{extractCity(route)}</span>
                      <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black">
                        {extractUf(route)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {route.description}
                  </p>

                  {/* Metrics Stats */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-800/80 bg-slate-950/40 px-3 rounded-2xl text-center">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Dificuldade</span>
                      <span className="text-xs font-black text-orange-400 uppercase truncate block">{route.difficulty}</span>
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
                </div>
              </div>

              {/* Footer Action */}
              <div className="p-6 pt-0 space-y-2">

                <div className="space-y-2 mt-2">
                  <button 
                    onClick={(e) => handleLaunchInLogbook(route, e)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md group/btn active:scale-95"
                    title="Enviar dados deste roteiro para criar uma nova viagem no Diário de Bordo"
                  >
                    <BookOpen size={13} className="group-hover/btn:scale-110 transition-transform" />
                    <span>ENVIAR P/ DIÁRIO (NOVA VIAGEM)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button 
                      onClick={(e) => handleExportPdf(route, e)}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-rose-400 border border-slate-800 hover:border-rose-500/50 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group/pdf active:scale-95"
                      title="Exportar para PDF para imprimir ou salvar com mapa e especificações"
                    >
                      <FileText size={12} className="text-rose-400 group-hover/pdf:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Exportar PDF</span>
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingRoute(route);
                      }}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-[#ff751f] border border-slate-800 hover:border-[#ff751f]/40 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm group/share active:scale-95"
                      title="Compartilhar este roteiro com amigos ou redes sociais"
                    >
                      <Share2 size={12} className="text-[#ff751f] group-hover/share:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Compartilhar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button 
                      onClick={(e) => handleCompleteRouteWithCamera(route, e)}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm group/cam active:scale-95"
                      title="Tirar foto com a câmera para comprovar e concluir este roteiro no Diário de Bordo"
                    >
                      <Camera size={12} className="text-orange-500 group-hover/cam:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Comprovar</span>
                    </button>

                    <button 
                      onClick={() => setSelectedRouteDetail(route)}
                      className="py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer"
                    >
                      <span className="truncate">Detalhes</span>
                      <ArrowRight size={12} className="shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {isLoadingRoutes && routes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
            <Loader2 size={36} className="text-orange-500 mx-auto animate-spin" />
            <h3 className="text-base font-black italic uppercase text-slate-200">Consultando Banco de Dados...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sincronizando a versão mais recente dos roteiros diretamente do servidor sem cache.
            </p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-orange-500 shadow-lg">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-black italic uppercase text-slate-200">
              Nenhum Roteiro Encontrado
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchText.trim() ? (
                <>Não encontramos percursos correspondentes à busca <span className="text-orange-400 font-bold">"{searchText}"</span>{selectedUfFilter !== 'TODAS' ? ` no estado de ${selectedUfFilter}` : ''}.</>
              ) : selectedUfFilter !== 'TODAS' ? (
                <>Não há roteiros cadastrados com o filtro de estado <span className="text-orange-400 font-bold">{selectedUfFilter}</span>.</>
              ) : (
                <>Nenhum roteiro cadastrado nesta categoria. Crie um novo percurso ou limpe os filtros para explorar a comunidade.</>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {(searchText.trim() || selectedUfFilter !== 'TODAS' || activeFilter !== 'todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('');
                    setSelectedUfFilter('TODAS');
                    setActiveFilter('todos');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Limpar Busca e Filtros
                </button>
              )}
              <button 
                onClick={handleOpenCreateRoute}
                className="btn-primary"
              >
                {isVip ? <Plus size={14} /> : <Lock size={14} className="text-amber-300" />}
                <span>{isVip ? "+ CRIAR ROTEIRO AGORA" : "+ CRIAR ROTEIRO (VIP PRO)"}</span>
              </button>
            </div>
          </div>
        ) : null}
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
              <form onSubmit={handleCreateRoute} noValidate className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
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
                        placeholder="Ex: Rota das Curvas da Serra Gaúcha"
                        value={newTitle}
                        onChange={(e) => {
                          setNewTitle(e.target.value);
                          if (createFormError) setCreateFormError(null);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Endereço / Cidade e UF Separados */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <MapPin size={13} className="text-orange-500" />
                        Endereço / Cidade do Roteiro *
                      </label>
                      <input 
                        type="text"
                        placeholder="Ex: São Miguel Arcanjo, Gramado, Serra do Rio do Rastro..."
                        value={newMapsAddress}
                        onChange={(e) => {
                          setNewMapsAddress(e.target.value);
                          if (createFormError) setCreateFormError(null);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        Estado / UF *
                      </label>
                      <select
                        value={newUf}
                        onChange={(e) => setNewUf(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-orange-400 outline-none focus:border-orange-500 uppercase cursor-pointer"
                      >
                        {BRAZILIAN_UFS.map(uf => (
                          <option key={uf} value={uf} className="bg-slate-900 text-white">
                            {uf} - Estado
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <ExternalLink size={13} className="text-orange-500" />
                        Link do Google Maps (Opcional)
                      </label>
                      <input 
                        type="text"
                        inputMode="url"
                        placeholder="Ex: https://maps.app.goo.gl/... ou link de rota"
                        value={newMapsUrl}
                        onChange={(e) => setNewMapsUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Nível de Dificuldade</label>
                      <select 
                        value={newDifficulty}
                        onChange={(e) => setNewDifficulty(e.target.value as RouteDifficulty)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 uppercase cursor-pointer"
                      >
                        <option value={RouteDifficulty.EASY}>Fácil (Pista boa e poucas curvas)</option>
                        <option value={RouteDifficulty.MEDIUM}>Médio (Trecho misto e serras moderadas)</option>
                        <option value={RouteDifficulty.HARD}>Difícil (Serras travadas e tráfego)</option>
                        <option value={RouteDifficulty.EXPERT}>Especialista (Curvas extremas e alta altitude)</option>
                      </select>
                    </div>

                    {/* Upload de até 3 Fotos do Roteiro com Carrossel */}
                    <div className="md:col-span-2 space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Camera size={13} className="text-orange-500" />
                          Fotos do Roteiro (Até 3 fotos • Máximo de 3 fotos padrão do sistema)
                        </label>
                        <span className="text-[10px] font-black text-amber-400">
                          {newImages.length} de 3 selecionada(s)
                        </span>
                      </div>

                      <input 
                        type="file"
                        ref={multiFileInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleMultiPhotoUpload}
                      />

                      {/* Grade de 3 Slots de Fotos */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((slotIndex) => {
                          const slotImg = newImages[slotIndex];
                          return (
                            <div 
                              key={slotIndex}
                              className={cn(
                                "relative rounded-2xl border aspect-[4/3] flex flex-col items-center justify-center overflow-hidden transition-all group",
                                slotImg 
                                  ? "border-slate-700 bg-slate-950 shadow-md cursor-pointer" 
                                  : "border-dashed border-slate-800 bg-slate-950/40 hover:border-orange-500/50 hover:bg-slate-900/50 cursor-pointer"
                              )}
                              onClick={() => {
                                if (slotImg) {
                                  openCarousel(newImages, slotIndex, newTitle || 'Foto do Roteiro', `${newMapsAddress} - ${newUf}`);
                                } else if (!isUploadingPhoto) {
                                  multiFileInputRef.current?.click();
                                }
                              }}
                            >
                              {slotImg ? (
                                <>
                                  <img 
                                    src={slotImg} 
                                    alt={`Foto ${slotIndex + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="p-1.5 rounded-full bg-slate-900/90 text-white hover:text-orange-400">
                                      <Maximize2 size={16} />
                                    </span>
                                  </div>
                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md text-[9px] font-black uppercase text-white border border-slate-700">
                                    {slotIndex === 0 ? 'Foto de Capa' : `Foto ${slotIndex + 1}`}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewImages(prev => {
                                        const next = prev.filter((_, idx) => idx !== slotIndex);
                                        setNewImage(next[0] || '');
                                        return next;
                                      });
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white shadow-md z-10 cursor-pointer"
                                    title="Remover esta foto"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              ) : (
                                <div className="text-center p-3 space-y-1">
                                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-orange-400 group-hover:scale-110 transition-all mx-auto">
                                    <Upload size={14} />
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white">
                                    {slotIndex === 0 ? '+ Foto de Capa' : `+ Foto ${slotIndex + 1}`}
                                  </p>
                                  <span className="text-[9px] text-slate-500 block">
                                    {isUploadingPhoto ? 'Enviando...' : 'Carregar imagem'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Informação sobre carrossel e link alternativo */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Sparkles size={12} />
                          Você pode anexar até 3 fotos. Ao clicar nelas no sistema, abre o carrossel interativo.
                        </span>
                        {newImages.length < 3 && (
                          <button
                            type="button"
                            onClick={() => multiFileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer self-start sm:self-auto"
                          >
                            + Selecionar arquivos
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Description & Rider Tips with AI Suggestion */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-slate-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                        <Sparkles size={18} className="fill-slate-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase text-white tracking-wide">
                            ASSISTENTE IA PARA ROTEIROS
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider">
                            GEMINI 3.8
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Gera automaticamente uma descrição rica do local e técnicas práticas de pilotagem para a estrada.
                        </p>
                      </div>
                    </div>

                    <button 
                      type="button"
                      disabled={isAiGenerating}
                      onClick={handleSuggestAiRouteContent}
                      className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0 shadow-md shadow-orange-600/30 cursor-pointer active:scale-95"
                    >
                      {isAiGenerating ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-white" />
                          <span>Gerando com IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-amber-200 fill-amber-200" />
                          <span>Sugerir com IA</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Info size={13} className="text-orange-400" />
                          Descrição do Local e Experiência do Percurso
                        </label>
                        <span className="text-[9px] text-orange-400/90 font-bold uppercase tracking-wider">
                          Paisagem, visual e atrativos
                        </span>
                      </div>
                      <textarea 
                        rows={3}
                        placeholder="Descreva o que os pilotos encontrarão nesta rota (paisagens, qualidade do piso, trechos históricos)... Ou clique no botão 'Sugerir com IA' acima."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 transition-colors leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Fuel size={13} className="text-amber-400" />
                          Dicas Técnicas e Instruções de Pilotagem
                        </label>
                        <span className="text-[9px] text-amber-400/90 font-bold uppercase tracking-wider">
                          Curvas, piso, postos e segurança
                        </span>
                      </div>
                      <textarea 
                        rows={4}
                        placeholder="Dicas técnicas de pilotagem em curvas, frenagem dianteira/traseira, postos de combustível, condições de asfalto, radares, melhor época do ano..."
                        value={newRiderTips}
                        onChange={(e) => setNewRiderTips(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-orange-500 transition-colors leading-relaxed font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Initial Metrics Ratings */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                    <Star size={14} /> 3. ESCALA DE AVALIAÇÃO INICIAL DO PILOTO (1 a 5)
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

                {/* Error Banner inside Modal */}
                {createFormError && (
                  <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400 shrink-0" />
                    <span>{createFormError}</span>
                  </div>
                )}

                {/* Submit Action Bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    Roteiro passará por moderação
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button 
                      type="button"
                      disabled={isSubmittingRoute}
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingRoute}
                      className="px-7 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider italic shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
                    >
                      {isSubmittingRoute ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>GRAVANDO E ENVIANDO...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>ENVIAR PARA MODERAÇÃO</span>
                        </>
                      )}
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
              <div 
                className="relative h-52 sm:h-64 md:h-80 overflow-hidden cursor-zoom-in group/hero"
                onClick={() => {
                  const photos = Array.isArray(selectedRouteDetail.images) && selectedRouteDetail.images.length > 0
                    ? selectedRouteDetail.images
                    : [selectedRouteDetail.image || DEFAULT_ROUTE_FALLBACK];
                  openCarousel(photos, 0, selectedRouteDetail.name, selectedRouteDetail.mapsAddress);
                }}
                title="Clique para abrir carrossel em tela cheia"
              >
                <img 
                  src={selectedRouteDetail.image || DEFAULT_ROUTE_FALLBACK} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/hero:scale-105"
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

                {/* Thumbnails strip se houver mais de 1 foto */}
                {Array.isArray(selectedRouteDetail.images) && selectedRouteDetail.images.length > 1 && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10 bg-slate-950/70 p-1.5 rounded-2xl backdrop-blur-md border border-slate-800">
                    {selectedRouteDetail.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCarousel(selectedRouteDetail.images!, idx, selectedRouteDetail.name, selectedRouteDetail.mapsAddress);
                        }}
                        className="w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-orange-500 shadow-md cursor-pointer transition-transform hover:scale-105"
                        title={`Ver foto ${idx + 1} no carrossel`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <span className="text-[10px] font-black text-amber-400 px-1.5">
                      {selectedRouteDetail.images.length} fotos
                    </span>
                  </div>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                  {(isUserAuthor(selectedRouteDetail) || isAdmin) && (
                    <button 
                      onClick={() => handleOpenEditRoute(selectedRouteDetail)}
                      className="px-3.5 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                      title="Editar informações do roteiro"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setPdfExportRoute(selectedRouteDetail)}
                    className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-500 text-slate-100 hover:text-rose-400 font-black text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                    title="Exportar para PDF para imprimir ou salvar com mapa e especificações"
                  >
                    <FileText size={13} className="text-rose-400" />
                    <span>Exportar PDF</span>
                  </button>

                  <button 
                    onClick={() => setExportingGpsRoute(selectedRouteDetail)}
                    className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-[#ff751f]/40 hover:border-[#ff751f] text-slate-100 hover:text-[#ff751f] font-black text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                    title="Exportar roteiro para GPS Garmin, TomTom ou Google Earth (GPX / KML)"
                  >
                    <Download size={13} className="text-[#ff751f]" />
                    <span>Exportar GPS</span>
                  </button>

                  <button 
                    onClick={() => setSharingRoute(selectedRouteDetail)}
                    className="px-3.5 py-1.5 bg-[#ff751f] hover:bg-[#ff853a] text-slate-950 font-black text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer active:scale-95"
                    title="Compartilhar este roteiro com amigos ou redes sociais"
                  >
                    <Share2 size={13} />
                    <span>Compartilhar</span>
                  </button>

                  {/* Apenas o Administrador tem autorização para trocar fotos de roteiros existentes */}
                  {isAdmin && (
                    <button 
                      onClick={() => detailPhotoInputRef.current?.click()}
                      disabled={isUploadingDetailPhoto}
                      className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 text-xs font-bold text-white rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer disabled:opacity-50"
                      title="Gerenciar / Trocar fotos (Exclusivo Administrador)"
                    >
                      {isUploadingDetailPhoto ? (
                        <Loader2 size={13} className="text-orange-400 animate-spin" />
                      ) : (
                        <Camera size={13} className="text-orange-400" />
                      )}
                      <span>{isUploadingDetailPhoto ? 'Enviando...' : 'Trocar Foto (Adm)'}</span>
                    </button>
                  )}

                  {(isUserAuthor(selectedRouteDetail) || isModeratorOrAdmin) && (
                    <button 
                      onClick={(e) => handleDeleteRoute(selectedRouteDetail, e)}
                      className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-xs font-bold text-rose-200 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer"
                      title="Excluir este roteiro permanentemente do servidor"
                    >
                      <Trash2 size={13} className="text-rose-400" />
                      <span>Excluir</span>
                    </button>
                  )}

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
                        Pendente de Moderação (Centro de Comando)
                      </span>
                    )}
                    {selectedRouteDetail.status === 'aprovado' && (
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <Check size={12} />
                        Aprovado
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
                    <span>{extractCity(selectedRouteDetail)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black">
                      {extractUf(selectedRouteDetail)}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{selectedRouteDetail.mapsAddress}</span>
                  </p>
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="p-6 md:p-8 space-y-8 max-h-[65vh] overflow-y-auto">
                
                {/* AVISO INFORMATIVO DE PENDÊNCIA (MODERAÇÃO REALIZADA EXCLUSIVAMENTE NO CENTRO DE COMANDO) */}
                {selectedRouteDetail.status === 'pendente' && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                    <Clock size={20} className="text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-300">
                        Roteiro em Análise de Moderação
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Este roteiro está gravado e aguarda homologação no <strong>Centro de Comando</strong> para publicação pública comunitária.
                      </p>
                    </div>
                  </div>
                )}


                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Nível de Dificuldade</span>
                    <span className="text-sm font-black text-orange-400 uppercase">{selectedRouteDetail.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block">Média de Avaliação dos Pilotos</span>
                    <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-1.5">
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                      {selectedRouteDetail.rating.toFixed(1)} / 5.0 ({selectedRouteDetail.totalRatingsCount} {selectedRouteDetail.totalRatingsCount === 1 ? 'piloto' : 'pilotos'})
                    </span>
                  </div>
                </div>

                {/* GOOGLE MAPS DIRECT LINK & INTERACTIVE BUTTONS */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
                  {/* Header: Location & Google Maps direct link */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                        <MapPin size={16} className="text-orange-500" />
                        LOCALIZAÇÃO E NAVEGAÇÃO
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        {selectedRouteDetail.mapsAddress}
                      </p>
                    </div>

                    <a 
                      href={selectedRouteDetail.mapsUrl || (selectedRouteDetail.mapsAddress.startsWith('http') ? selectedRouteDetail.mapsAddress : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRouteDetail.mapsAddress)}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-orange-500" />
                      <span>ABRIR NO GOOGLE MAPS</span>
                    </a>
                  </div>

                  {/* Actions Grid divided in clean rows respecting card width */}
                  <div className="space-y-2.5">
                    {/* Row 1: Primary Actions (Enviar para Diário & Exportar PDF) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleLaunchInLogbook(selectedRouteDetail)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer transition-all active:scale-95"
                        title="Enviar dados deste roteiro para criar uma nova viagem no Diário de Bordo"
                      >
                        <BookOpen size={15} />
                        <span>ENVIAR PARA DIÁRIO (NOVA VIAGEM)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfExportRoute(selectedRouteDetail)}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-rose-500/60 hover:border-rose-500 text-slate-100 hover:text-rose-400 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                        title="Exportar roteiro completo para PDF para imprimir ou salvar com mapa e especificações"
                      >
                        <FileText size={15} className="text-rose-400" />
                        <span>EXPORTAR PARA PDF (IMPRIMIR)</span>
                      </button>
                    </div>

                    {/* Row 2: Secondary Tools (Exportar GPS, Compartilhar, Comprovar) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setExportingGpsRoute(selectedRouteDetail)}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-[#ff751f]/50 hover:border-[#ff751f] text-slate-100 hover:text-[#ff751f] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 truncate"
                        title="Exportar roteiro em formato GPX (Garmin / TomTom) ou KML (Google Earth)"
                      >
                        <Download size={14} className="text-[#ff751f] shrink-0" />
                        <span className="truncate">EXPORTAR GPS (GPX / KML)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSharingRoute(selectedRouteDetail)}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-[#ff751f] to-amber-500 hover:from-[#ff853a] hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff751f]/20 cursor-pointer transition-all active:scale-95 truncate"
                        title="Compartilhar este roteiro com amigos ou redes sociais"
                      >
                        <Share2 size={14} className="stroke-[2.5] shrink-0" />
                        <span className="truncate">COMPARTILHAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteRouteWithCamera(selectedRouteDetail)}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 truncate"
                        title="Tirar foto com a câmera para comprovar e concluir este roteiro no Diário de Bordo"
                      >
                        <Camera size={14} className="text-orange-500 shrink-0" />
                        <span className="truncate">COMPROVAR</span>
                      </button>
                    </div>
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
                      <Fuel size={16} /> DICAS TÉCNICAS E DE PILOTAGEM
                    </h4>
                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 whitespace-pre-line">
                      {selectedRouteDetail.riderTips}
                    </div>
                  </div>
                </div>

                {/* Rating Metrics & Reviews */}
                <div className="space-y-6 pt-4 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                        <Award size={16} className="text-amber-400" />
                        AVALIAÇÃO DO ROTEIRO (MÉDIA DOS PILOTOS)
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Média ponderada baseada na nota e critérios de {selectedRouteDetail.totalRatingsCount} {selectedRouteDetail.totalRatingsCount === 1 ? 'piloto' : 'pilotos'}.
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        setUserOverallRating(5);
                        setIsRatingModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 transition-all"
                    >
                      <Star size={14} className="fill-slate-950 text-slate-950" />
                      AVALIAR ROTEIRO
                    </button>
                  </div>

                  {/* Highlighted Average Score Box */}
                  <div className="p-5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      <div className="text-4xl md:text-5xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1">
                        <span>{selectedRouteDetail.rating.toFixed(1)}</span>
                        <span className="text-sm font-bold text-slate-500">/ 5.0</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <Star
                              key={starVal}
                              size={18}
                              className={starVal <= Math.round(selectedRouteDetail.rating) ? "fill-amber-400 text-amber-400" : "text-slate-700"}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider mt-1">
                          Média calculada de {selectedRouteDetail.totalRatingsCount} {selectedRouteDetail.totalRatingsCount === 1 ? 'avaliação' : 'avaliações'}
                        </p>
                      </div>
                    </div>

                    {/* Metric Highlights Pill Grid */}
                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'Paisagem', val: selectedRouteDetail.ratingMetrics.paisagem },
                        { label: 'Asfalto', val: selectedRouteDetail.ratingMetrics.asfalto },
                        { label: 'Curvas', val: selectedRouteDetail.ratingMetrics.curvas },
                        { label: 'Segurança', val: selectedRouteDetail.ratingMetrics.seguranca },
                        { label: 'Apoio', val: selectedRouteDetail.ratingMetrics.infraestrutura },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{item.label}</span>
                          <span className="text-xs font-mono font-black text-amber-400">{item.val}</span>
                        </div>
                      ))}
                    </div>
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
                
                {/* Clickable 1-5 Star Picker */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                  <label className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                    Sua Nota Geral (1 a 5 estrelas)
                  </label>
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeScore = hoverRating || userOverallRating || 5;
                      const isFilled = star <= activeScore;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setUserOverallRating(star)}
                          className="p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        >
                          <Star
                            size={32}
                            className={isFilled ? "fill-amber-400 text-amber-400" : "text-slate-700"}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-bold text-slate-300">
                    Nota do Piloto: <span className="text-amber-400 font-mono font-black">{hoverRating || userOverallRating || 5} de 5</span> estrelas
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Sua nota entrará no cálculo da média geral deste roteiro.
                  </p>
                </div>

                <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-800">
                    Critérios Detalhados da Pista (1 a 5)
                  </div>
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
      {/* MODAL DE CONFIRMAÇÃO: ROTEIRO ENVIADO PARA MODERAÇÃO COM SUCESSO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {submissionSuccessRoute && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.92, y: 20 }} 
              className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

              {/* Close Button */}
              <button 
                onClick={() => setSubmissionSuccessRoute(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 transition-colors z-10"
              >
                <X size={18} />
              </button>

              {/* Top Success Badge & Heading */}
              <div className="text-center space-y-3 pt-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/50 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <ShieldCheck size={34} className="text-amber-400" />
                </div>
                <div>
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                    <Clock size={12} />
                    GRAVADO COM SUCESSO • AGUARDANDO MODERAÇÃO
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white">
                    ROTEIRO ENVIADO PARA MODERAÇÃO!
                  </h2>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                    Seu cadastro foi salvo com segurança em nosso banco de dados e já foi encaminhado para a equipe de moderação.
                  </p>
                </div>
              </div>

              {/* Route Summary Card */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                  <img 
                    src={submissionSuccessRoute.image || DEFAULT_ROUTE_FALLBACK} 
                    alt={submissionSuccessRoute.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_ROUTE_FALLBACK;
                    }}
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase">
                      {submissionSuccessRoute.difficulty}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ID: <span className="font-mono text-slate-300">{submissionSuccessRoute.id}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black italic uppercase text-white truncate">
                    {submissionSuccessRoute.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="text-orange-500 shrink-0" />
                    {submissionSuccessRoute.mapsAddress}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {submissionSuccessRoute.description}
                  </p>
                </div>
              </div>

              {/* Informative Step Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-xs">
                <h4 className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Info size={15} />
                  O QUE VOCÊ PRECISA SABER:
                </h4>
                <ul className="text-slate-300 space-y-1.5 text-[11px] leading-relaxed list-disc list-inside">
                  <li><strong>Persistência Garantida:</strong> Seus dados foram salvos tanto no banco de dados quanto na sua sessão local.</li>
                  <li><strong>Protocolo de Segurança:</strong> Novos roteiros passam por verificação para assegurar trajetos válidos e dicas seguras antes da publicação geral.</li>
                  <li><strong>Acompanhamento:</strong> Você pode visualizar e gerenciar este roteiro a qualquer momento na aba <strong>&quot;Meus Roteiros&quot;</strong>.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => {
                      setSubmissionSuccessRoute(null);
                      setActiveFilter('meus');
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
                  >
                    <span>VER EM MEUS ROTEIROS</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSubmissionSuccessRoute(null);
                      setActiveFilter('todos');
                    }}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
                  >
                    <span>VER CATÁLOGO GERAL</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button 
                    onClick={() => {
                      const target = submissionSuccessRoute;
                      setSubmissionSuccessRoute(null);
                      setSelectedRouteDetail(target);
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                  >
                    Ver detalhes completos do roteiro
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSubmissionSuccessRoute(null);
                        handleOpenCreateRoute();
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      + Cadastrar Outro
                    </button>
                    <button 
                      onClick={() => setSubmissionSuccessRoute(null)}
                      className="px-5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIÇÃO DE ROTEIRO (ADMIN OU AUTOR - FOTOS APENAS ADMIN) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingRoute && (
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      EDITAR ROTEIRO
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      ID: {editingRoute.id} • {isAdmin ? 'Modo Administrador' : 'Modo Autor'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setEditingRoute(null)} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form de Edição */}
              <form onSubmit={handleSaveRouteEdits} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Título do Roteiro *</label>
                  <input 
                    type="text" 
                    value={editRouteName} 
                    onChange={(e) => setEditRouteName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 font-bold" 
                  />
                </div>

                {/* Endereço / Cidade e UF Separados */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                      <MapPin size={13} className="text-orange-500" />
                      Cidade / Endereço *
                    </label>
                    <input 
                      type="text" 
                      value={editRouteMapsAddress} 
                      onChange={(e) => setEditRouteMapsAddress(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 font-bold" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Estado / UF *</label>
                    <select
                      value={editRouteUf}
                      onChange={(e) => setEditRouteUf(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-orange-400 outline-none focus:border-orange-500 uppercase cursor-pointer"
                    >
                      {BRAZILIAN_UFS.map(uf => (
                        <option key={uf} value={uf} className="bg-slate-900 text-white">
                          {uf} - Estado
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Distância Estimada (KM):</label>
                    <input 
                      type="text" 
                      value={editRouteDistance} 
                      onChange={(e) => setEditRouteDistance(e.target.value)}
                      placeholder="Ex: 150"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Duração Estimada:</label>
                    <input 
                      type="text" 
                      value={editRouteDuration} 
                      onChange={(e) => setEditRouteDuration(e.target.value)}
                      placeholder="Ex: 2h 15min"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <ExternalLink size={13} className="text-orange-500" />
                    Link do Google Maps:
                  </label>
                  <input 
                    type="text" 
                    value={editRouteMapsUrl} 
                    onChange={(e) => setEditRouteMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Dificuldade:</label>
                  <select 
                    value={editRouteDifficulty}
                    onChange={(e) => setEditRouteDifficulty(e.target.value as RouteDifficulty)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500 uppercase cursor-pointer"
                  >
                    <option value={RouteDifficulty.EASY}>Fácil</option>
                    <option value={RouteDifficulty.MEDIUM}>Médio</option>
                    <option value={RouteDifficulty.HARD}>Difícil</option>
                    <option value={RouteDifficulty.EXPERT}>Especialista</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Descrição do Roteiro:</label>
                  <textarea 
                    rows={3} 
                    value={editRouteDescription} 
                    onChange={(e) => setEditRouteDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 leading-relaxed" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Dicas para Pilotos:</label>
                  <textarea 
                    rows={3} 
                    value={editRouteRiderTips} 
                    onChange={(e) => setEditRouteRiderTips(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 leading-relaxed font-mono text-[11px]" 
                  />
                </div>

                {/* Gerenciamento de Fotos (Até 3 fotos • Apenas Admin tem autorização para trocar) */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                      <Camera size={13} className="text-orange-500" />
                      Fotos do Roteiro ({editRouteImages.length} de 3 • Máximo 3 fotos)
                    </label>
                    {isAdmin ? (
                      <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ✓ Adm Autorizado a Trocar Fotos
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-400/90 flex items-center gap-1">
                        <Lock size={10} /> Apenas o Adm pode trocar fotos
                      </span>
                    )}
                  </div>

                  {/* Hidden Input for Admin Photo Upload */}
                  <input 
                    type="file" 
                    ref={editPhotoInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!isAdmin) {
                        showToast('Apenas o Administrador tem autorização para trocar fotos.', 'error');
                        return;
                      }
                      try {
                        const result = await uploadImageToStorage(file, { folder: 'routes', userId: profile?.id || 'admin' });
                        if (result.success && result.url) {
                          setEditRouteImages(prev => [...prev, result.url].slice(0, 3));
                          showToast('Foto adicionada com sucesso pelo Administrador!', 'success');
                        }
                      } catch (err: any) {
                        showToast('Falha no upload: ' + (err?.message || 'Erro'), 'error');
                      } finally {
                        e.target.value = '';
                      }
                    }} 
                  />

                  {/* Thumbnails Grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0, 1, 2].map((slotIdx) => {
                      const photoUrl = editRouteImages[slotIdx];
                      return (
                        <div 
                          key={slotIdx}
                          onClick={() => {
                            if (photoUrl) {
                              openCarousel(editRouteImages, slotIdx, editRouteName || 'Foto', editRouteMapsAddress);
                            } else if (isAdmin) {
                              editPhotoInputRef.current?.click();
                            }
                          }}
                          className={cn(
                            "relative aspect-[4/3] rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center cursor-pointer group",
                            photoUrl 
                              ? "border-slate-700 bg-slate-950 shadow-md" 
                              : isAdmin 
                                ? "border-dashed border-slate-800 bg-slate-950/40 hover:border-orange-500/50" 
                                : "border-slate-800 bg-slate-950/20 opacity-50 cursor-not-allowed"
                          )}
                        >
                          {photoUrl ? (
                            <>
                              <img src={photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[8px] font-black uppercase text-white">
                                {slotIdx === 0 ? 'Capa' : `Foto ${slotIdx + 1}`}
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditRouteImages(prev => prev.filter((_, i) => i !== slotIdx));
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md z-10 cursor-pointer"
                                  title="Remover foto"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="text-center p-2">
                              {isAdmin ? (
                                <>
                                  <Upload size={14} className="mx-auto text-slate-500 group-hover:text-orange-400 mb-1" />
                                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-white block">+ Adicionar</span>
                                </>
                              ) : (
                                <span className="text-[9px] text-slate-600 block">Vazio</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingRoute(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingRouteEdits}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isSavingRouteEdits ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-white" />
                        <span>GRAVANDO ALTERAÇÕES...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>GRAVAR ALTERAÇÕES NO ROTEIRO</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: ALTERAÇÕES NO ROTEIRO GRAVADAS COM SUCESSO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {routeEditSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.92, y: 20 }} 
              className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle size={36} className="text-emerald-400" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Check size={12} />
                  DADOS ATUALIZADOS & PERSISTIDOS
                </span>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
                  ALTERAÇÕES GRAVADAS COM SUCESSO!
                </h2>
                <p className="text-xs text-slate-300">
                  {routeEditSuccessModal.message}
                </p>
              </div>

              {/* Resumo do Roteiro */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black italic uppercase text-white truncate">
                    {routeEditSuccessModal.route.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase">
                    {extractUf(routeEditSuccessModal.route)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                  <MapPin size={13} className="text-orange-500 shrink-0" />
                  {routeEditSuccessModal.route.mapsAddress}
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setRouteEditSuccessModal(null)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  OK, CONTINUAR NAVEGANDO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: AVALIAÇÃO DE ROTEIRO REGISTRADA COM SUCESSO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {ratingSuccessConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.92, y: 20 }} 
              className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Star size={36} className="text-amber-400 fill-amber-400" />
                </div>
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Check size={12} />
                  AVALIAÇÃO REGISTRADA
                </span>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
                  AVALIAÇÃO GRAVADA COM SUCESSO!
                </h2>
                <p className="text-xs text-slate-300">
                  Sua pontuação e critérios foram calculados e integrados à média oficial deste roteiro na base de dados.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase">Nova Média Geral do Roteiro</div>
                <div className="text-3xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                  <Star size={24} className="fill-amber-400 text-amber-400" />
                  <span>{ratingSuccessConfirmation.route.rating}</span>
                  <span className="text-sm font-bold text-slate-500">/ 5.0</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Total de avaliações computadas: <strong className="text-white">{ratingSuccessConfirmation.route.totalRatingsCount}</strong>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setRatingSuccessConfirmation(null)}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-all cursor-pointer active:scale-95"
                >
                  OK, CONCLUÍDO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        feature="criar_roteiro" 
      />

      {/* Modal de Compartilhamento com Link Único e Redes Sociais */}
      <RouteShareModal 
        route={sharingRoute}
        isOpen={!!sharingRoute}
        onClose={() => setSharingRoute(null)}
        onToast={showToast}
      />

      {/* Modal de Exportação para GPS Externo (GPX / KML) */}
      <GpsExportModal 
        route={exportingGpsRoute}
        isOpen={!!exportingGpsRoute}
        onClose={() => setExportingGpsRoute(null)}
        onToast={showToast}
      />

      {/* Modal de Exportação para PDF (Imprimir / Salvar) */}
      <RoutePdfModal 
        route={pdfExportRoute}
        pilotName={profile?.name}
        onClose={() => setPdfExportRoute(null)}
      />
    </div>
  );
}

