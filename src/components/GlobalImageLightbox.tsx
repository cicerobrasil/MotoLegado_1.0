import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink, 
  Maximize2,
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useImageLightbox } from '../context/ImageLightboxContext';

export function GlobalImageLightbox() {
  const { state, closeImage } = useImageLightbox();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Reseta zoom e posição ao abrir uma nova imagem
  useEffect(() => {
    if (state.isOpen) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [state.isOpen, state.imageUrl]);

  if (!state.isOpen || !state.imageUrl) return null;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleToggleZoom = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = state.imageUrl;
      const sanitizedName = (state.title || 'motolegado_foto')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .substring(0, 30);
      a.download = `${sanitizedName}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(state.imageUrl, '_blank');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(prev + 0.25, 3.5));
    } else {
      setZoomLevel(prev => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={closeImage}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md p-3 sm:p-6 overflow-hidden select-none"
      >
        {/* Top Header Bar */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-lg z-10"
        >
          {/* Título e Subtítulo da Imagem */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <ImageIcon size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white truncate">
                {state.title || 'Visualização da Foto'}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                {state.subtitle || 'MotoLegado • Foto em tamanho completo'}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Reduzir Zoom (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-[10px] font-mono font-bold text-orange-400 px-1 min-w-[36px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.5}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn size={16} />
              </button>
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
                  title="Restaurar Tamanho Original"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            {/* Abrir original em nova aba */}
            <button
              type="button"
              onClick={() => window.open(state.imageUrl, '_blank')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Abrir imagem original"
            >
              <ExternalLink size={16} />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Baixar Foto"
            >
              <Download size={16} />
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={closeImage}
              className="p-2 sm:p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 transition-all cursor-pointer ml-1"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Central Image Container */}
        <div 
          className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 sm:p-6 overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleToggleZoom}
            className="relative flex items-center justify-center max-w-full max-h-full"
            style={{
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <img
              src={state.imageUrl}
              alt={state.title || 'Foto'}
              className="max-w-full max-h-[75vh] sm:max-h-[80vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 pointer-events-auto"
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Footer Hint Bar */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="text-center text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-900/60 border border-slate-800/60 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-3 shadow-lg"
        >
          <span className="flex items-center gap-1.5">
            <Maximize2 size={12} className="text-orange-500" />
            Duplo clique ou use a roda do mouse para dar zoom
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">ESC</kbd> ou clique fora para fechar</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GlobalImageLightbox;
