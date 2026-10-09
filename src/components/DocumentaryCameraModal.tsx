import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  SwitchCamera, 
  X, 
  Check, 
  Trash2, 
  Image as ImageIcon, 
  ShieldCheck, 
  MapPin, 
  Compass, 
  Clock, 
  Bike, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentaryProof, DocumentaryProofType } from '../types';
import { uploadImageToStorage } from '../lib/storage';

export const PROOF_TYPES: { id: DocumentaryProofType; label: string; icon: string; desc: string }[] = [
  { id: 'arrival', label: 'Ponto de Chegada', icon: '🏁', desc: 'Placa, marco ou pórtico do destino concluído' },
  { id: 'odometer', label: 'Odômetro / Painel', icon: '🧭', desc: 'Foto nítida do painel com KM inicial/final' },
  { id: 'motorcycle', label: 'Moto no Ponto Turístico', icon: '🏍️', desc: 'Sua motocicleta no mirante ou atração' },
  { id: 'scenic', label: 'Paisagem da Estrada', icon: '🌄', desc: 'Curvas, serra, mirantes e belezas da rota' },
  { id: 'receipt', label: 'Comprovante / Parada', icon: '⛽', desc: 'Cupom de combustível, pedágio ou restaurante' },
  { id: 'brotherhood', label: 'Confraria / Irmandade', icon: '👥', desc: 'Foto com moto clube ou parceiros de estrada' },
  { id: 'general', label: 'Prova Geral', icon: '📸', desc: 'Registro complementar do roteiro' }
];

interface DocumentaryCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachProofs: (proofs: DocumentaryProof[]) => void;
  routeTitle?: string;
  destination?: string;
  pilotName?: string;
  pilotMotorcycle?: string;
  existingProofs?: DocumentaryProof[];
}

export function DocumentaryCameraModal({
  isOpen,
  onClose,
  onAttachProofs,
  routeTitle,
  destination,
  pilotName = 'Piloto MotoLegado',
  pilotMotorcycle,
  existingProofs = []
}: DocumentaryCameraModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentaryProofType>('arrival');
  const [caption, setCaption] = useState('');
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedProofs, setStagedProofs] = useState<DocumentaryProof[]>([]);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Inicializa geolocalização para certidão documental
  useEffect(() => {
    if (isOpen && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5))
          });
        },
        () => {
          // Permissão negada ou indisponível silenciosamente
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isOpen]);

  // Inicialização do fluxo da Câmera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Câmera direta não suportada neste navegador. Use a câmera nativa do aparelho abaixo.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Erro ao abrir câmera:', err);
      let msg = 'Não foi possível acessar a câmera do dispositivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão de acesso à câmera negada. Você pode liberar a permissão ou usar a Câmera Nativa do aparelho.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera encontrada no dispositivo.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Controla abertura / fechamento do modal
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      setStagedProofs([]);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Alterna câmera traseira / frontal
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Carimbo oficial na foto (Canvas Stamp)
  const drawWatermarkOnImage = async (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Desenha imagem original
        ctx.drawImage(img, 0, 0);

        if (!applyWatermark) {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
          return;
        }

        // Barra inferior estilizada de certificação documental
        const bannerHeight = Math.max(100, Math.round(canvas.height * 0.14));
        const yStart = canvas.height - bannerHeight;

        // Fundo escuro semitransparente com gradiente
        const gradient = ctx.createLinearGradient(0, yStart - 20, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(3, 7, 18, 0)');
        gradient.addColorStop(0.25, 'rgba(3, 7, 18, 0.88)');
        gradient.addColorStop(1, 'rgba(3, 7, 18, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, yStart - 20, canvas.width, bannerHeight + 20);

        // Faixa de destaque laranja superior da barra
        ctx.fillStyle = '#f97316';
        ctx.fillRect(0, yStart - 2, canvas.width, 3);

        const padX = Math.round(canvas.width * 0.04);
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Título e Logo da Certificação
        ctx.font = `900 ${Math.round(bannerHeight * 0.22)}px sans-serif`;
        ctx.fillStyle = '#f97316';
        ctx.fillText('MOTOLEGADO', padX, yStart + bannerHeight * 0.32);

        ctx.font = `700 ${Math.round(bannerHeight * 0.16)}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(' | PROVA DOCUMENTAL OFICIAL', padX + ctx.measureText('MOTOLEGADO').width + 8, yStart + bannerHeight * 0.32);

        // Dados do Roteiro / Destino
        const rName = (routeTitle || destination || 'ROTEIRO CONCLUÍDO').toUpperCase();
        ctx.font = `800 ${Math.round(bannerHeight * 0.18)}px sans-serif`;
        ctx.fillStyle = '#f3f4f6';
        ctx.fillText(`📍 ${rName}`, padX, yStart + bannerHeight * 0.58);

        // Piloto, Moto e Timestamp
        const pilotInfo = pilotMotorcycle ? `${pilotName} • ${pilotMotorcycle}` : pilotName;
        let metaStr = `👤 ${pilotInfo}  |  🕒 ${dateStr} às ${timeStr}`;
        if (userCoords) {
          metaStr += `  |  🌐 ${userCoords.latitude}, ${userCoords.longitude}`;
        }

        ctx.font = `600 ${Math.round(bannerHeight * 0.14)}px sans-serif`;
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(metaStr, padX, yStart + bannerHeight * 0.84);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Disparo do Obturador (Tirar Foto)
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Flash visual
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Se estiver em selfie/user, inverte horizontalmente para efeito espelho natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Fallback: Disparo da Câmera Nativa do Aparelho (Mobile / PWA)
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Salvar foto capturada com carimbo e metadados
  const handleSaveProofItem = async (keepCameraOpen: boolean = false) => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      // Gera carimbo documental se habilitado
      const finalImage = await drawWatermarkOnImage(capturedImage);

      // Faz upload persistente ou usa dataUrl de fallback
      let finalUrl = finalImage;
      try {
        const response = await fetch(finalImage);
        const blob = await response.blob();
        const file = new File([blob], `proof_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const uploadRes = await uploadImageToStorage(file, { folder: 'trips' });
        if (uploadRes.success && uploadRes.url) {
          finalUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn('Fallback para imagem base64:', err);
      }

      const now = new Date();
      const newProof: DocumentaryProof = {
        id: `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: finalUrl,
        type: selectedType,
        caption: caption.trim() || undefined,
        timestamp: `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        location: routeTitle || destination || undefined,
        coords: userCoords || undefined,
        hasWatermark: applyWatermark
      };

      const updatedStaged = [...stagedProofs, newProof];
      setStagedProofs(updatedStaged);

      if (keepCameraOpen) {
        setCapturedImage(null);
        setCaption('');
        startCamera();
      } else {
        // Conclui e anexa todas as fotos adicionadas
        onAttachProofs(updatedStaged);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao processar prova documental:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Descarta foto capturada e volta ao visor ao vivo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Input nativo oculto para acionar a câmera do sistema no mobile */}
      <input
        type="file"
        ref={fallbackInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCameraCapture}
      />
      {/* Input para carregar foto da galeria do aparelho */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleNativeCameraCapture}
      />

      {/* Efeito flash de obturador */}
      {shutterFlash && (
        <div className="fixed inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-150 opacity-90" />
      )}

      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Header HUD */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Camera size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase italic tracking-wide">
                  Câmera de Prova <span className="text-orange-500">Documental</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={11} /> CERTIFICADA
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 truncate max-w-[260px] sm:max-w-md">
                {routeTitle ? `Roteiro: ${routeTitle}` : destination ? `Destino: ${destination}` : 'Diário de Bordo MotoLegado'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Visor da Câmera ou Preview da Imagem */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] sm:min-h-[420px] overflow-hidden">
          {!capturedImage ? (
            /* VISOR AO VIVO */
            <div className="relative w-full h-full flex items-center justify-center min-h-[340px] sm:min-h-[420px]">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover max-h-[60vh]"
              />

              {/* HUD / Mira de Alinhamento e Metadados em Tempo Real */}
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                {/* Top HUD info */}
                <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-white/90 drop-shadow-md">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-md px-2.5 py-1 backdrop-blur-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>REC AO VIVO</span>
                  </div>

                  {userCoords && (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-md px-2.5 py-1 backdrop-blur-xs flex items-center gap-1 text-slate-300">
                      <MapPin size={11} className="text-orange-500" />
                      <span>{userCoords.latitude}, {userCoords.longitude}</span>
                    </div>
                  )}
                </div>

                {/* Viewfinder crosshairs corners */}
                <div className="relative w-full flex-1 flex items-center justify-center my-4">
                  <div className="w-48 h-48 sm:w-64 sm:h-64 border border-white/20 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500 -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500 -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500 -mb-0.5 -mr-0.5" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border border-orange-500/60 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Bottom HUD info */}
                <div className="text-center">
                  <span className="text-[10px] font-bold text-white/80 bg-slate-950/70 border border-slate-800/80 px-3 py-1 rounded-full backdrop-blur-xs">
                    Posicione o marco, odômetro ou moto dentro do visor
                  </span>
                </div>
              </div>

              {/* Mensagem de Erro de Câmera */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <AlertCircle size={40} className="text-amber-500" />
                  <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                  <button
                    onClick={() => fallbackInputRef.current?.click()}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <Camera size={14} /> Abrir Câmera do Celular
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW DA FOTO CAPTURADA */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img
                src={capturedImage}
                alt="Prova Documental"
                className="w-full h-auto max-h-[50vh] object-contain bg-black"
              />

              {/* Selo sobreposto indicando carimbo */}
              {applyWatermark && (
                <div className="absolute top-3 left-3 bg-slate-950/80 border border-orange-500/50 rounded-lg px-2.5 py-1 text-[10px] font-black text-orange-400 backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                  <ShieldCheck size={13} className="text-orange-500" />
                  Carimbo de Certificação Ativado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles de Disparo & Configuração da Foto */}
        <div className="p-3 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
          {!capturedImage ? (
            /* Ações de Captura */
            <div className="flex items-center justify-between gap-3">
              {/* Troca de Câmera (Traseira / Frontal) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
                title="Inverter Câmera (Frontal / Traseira)"
              >
                <SwitchCamera size={20} />
              </button>

              {/* Botão Obturador Principal */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!isCameraActive}
                className="flex-1 max-w-[200px] h-14 rounded-full bg-orange-600 hover:bg-orange-500 active:scale-95 border-4 border-slate-950 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={20} />
                <span>Tirar Foto</span>
              </button>

              {/* Botões de Mídia: Galeria e Câmera Nativa */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
                  title="Escolher foto da Galeria do Celular/PC"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center"
                  title="Abrir Câmera Nativa do Celular"
                >
                  <Camera size={20} className="text-orange-500" />
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Classificação da Prova Documental */
            <div className="space-y-3">
              {/* Seleção do Tipo de Prova */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tipo de Prova Documental
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PROOF_TYPES.map((t) => {
                    const isSelected = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id)}
                        className={`text-left p-2 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-orange-600/20 border-orange-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-base">{t.icon}</span>
                        <div className="truncate">
                          <p className="truncate font-black">{t.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legenda / Observação */}
              <div>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex: Foto do odômetro marcando 1.250 km ou placa do mirante..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Toggle de Carimbo Documental */}
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={applyWatermark ? 'text-orange-500' : 'text-slate-500'} />
                  <span className="text-xs font-bold text-slate-300">
                    Gravar Carimbo Oficial com Data, Hora & Rota
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyWatermark(!applyWatermark)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${applyWatermark ? 'bg-orange-600' : 'bg-slate-700'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${applyWatermark ? 'right-0.5' : 'left-0.5'}`}
                  />
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={14} /> Repetir
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProofItem(true)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> Salvar & Tirar Outra
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProofItem(false)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                >
                  <Check size={14} /> Anexar ao Diário
                </button>
              </div>
            </div>
          )}

          {/* Miniatura das Fotos Já Capturadas nesta sessão */}
          {stagedProofs.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                <span>{stagedProofs.length} {stagedProofs.length === 1 ? 'Prova Fotografada' : 'Provas Fotografadas'} nesta sessão</span>
                <button
                  type="button"
                  onClick={() => {
                    onAttachProofs(stagedProofs);
                    onClose();
                  }}
                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold"
                >
                  <CheckCircle2 size={12} /> Concluir e Anexar Todas
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {stagedProofs.map((sp) => (
                  <div key={sp.id} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                    <img src={sp.url} alt="Miniatura" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStagedProofs((prev) => prev.filter((p) => p.id !== sp.id))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600/90 text-white flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
