import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Compass,
  BookOpen,
  Route as RouteIcon,
  Trophy,
  Shield,
  Store,
  Eye,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useTour } from '../context/TourContext';

export function OnboardingTour() {
  const { 
    isActive, 
    currentStepIndex, 
    currentStep, 
    totalSteps, 
    nextStep, 
    prevStep, 
    skipTour 
  } = useTour();

  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-navigate to relevant page for current step if needed
  useEffect(() => {
    if (!isActive) return;

    if (currentStep.path && location.pathname !== currentStep.path) {
      navigate(currentStep.path);
    }
  }, [isActive, currentStepIndex, currentStep.path, location.pathname, navigate]);

  // Update target bounding box and position tooltip
  const updatePosition = useCallback(() => {
    if (!isActive) return;

    if (!currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Check if element is currently rendered with dimensions
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        
        // Scroll smoothly into view if offscreen
        const isOffScreen = rect.top < 80 || rect.bottom > window.innerHeight - 80;
        if (isOffScreen) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Calculate ideal placement
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Mobile: keep docked at bottom for clean reachability
          setTooltipStyle({
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            zIndex: 9999
          });
        } else {
          // Desktop: smart floating position near target
          const tooltipWidth = 440;
          const tooltipHeight = 360;
          const margin = 16;

          let top = rect.bottom + margin;
          let left = Math.max(margin, Math.min(rect.left, window.innerWidth - tooltipWidth - margin));

          // If it would overflow bottom, position above
          if (top + tooltipHeight > window.innerHeight) {
            top = Math.max(margin, rect.top - tooltipHeight - margin);
          }

          setTooltipStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${tooltipWidth}px`,
            zIndex: 9999
          });
        }
        return;
      }
    }

    // Fallback: centered modal
    setTargetRect(null);
    setTooltipStyle({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: window.innerWidth < 640 ? 'calc(100% - 32px)' : '460px',
      zIndex: 9999
    });
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    // Small delay to allow react-router transitions and DOM rendering
    const timer = setTimeout(updatePosition, 120);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, updatePosition, location.pathname, currentStepIndex]);

  if (!isActive) return null;

  const renderIcon = (name: string) => {
    const props = { size: 22, className: "text-[#ff751f]" };
    switch (name) {
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Route': return <RouteIcon {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Store': return <Store {...props} />;
      case 'Eye': return <Eye {...props} />;
      case 'Compass':
      default: return <Compass {...props} />;
    }
  };

  const renderStepPreview = (stepId: string) => {
    switch (stepId) {
      case 'telemetry':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-orange-500/30 p-3.5 flex flex-col gap-2.5 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Telemetria de Estrada Ativa
              </span>
              <span className="font-mono text-amber-400 font-bold">TEMPO REAL</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Odômetro</span>
                <span className="text-xs font-black text-white font-mono">1.250 km</span>
              </div>
              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Média</span>
                <span className="text-xs font-black text-orange-400 font-mono">84 km/h</span>
              </div>
              <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-bold uppercase">Nível</span>
                <span className="text-xs font-black text-amber-400 font-mono">Prata II</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>Evolução na Temporada</span>
              <span className="text-orange-400 font-bold">78% da meta</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 h-full w-[78%] rounded-full animate-pulse" />
            </div>
          </div>
        );
      case 'logbook':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
              <BookOpen size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">Diário Oficial de Bordo</span>
              <p className="text-xs font-bold text-white truncate">Serra do Rio do Rastro ➔ Urubici</p>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>📍 184 km</span>
                <span>•</span>
                <span>📸 6 fotos</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">+280 PTS</span>
              </span>
            </div>
          </div>
        );
      case 'routes':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <RouteIcon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Roteiro Curado & GPS</span>
              <p className="text-xs font-bold text-white truncate">Rota dos Vinhedos & Mirantes da Serra</p>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <Sparkles size={11} className="text-amber-400 inline" />
                <span>IA: Guia turístico, gastronomia e curvas</span>
              </span>
            </div>
          </div>
        );
      case 'ranking':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-amber-500/30 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">🥇</div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Classificação Geral</span>
                <span className="text-xs font-black text-white">Patente: Alfa das Rodovias</span>
                <span className="text-[10px] text-slate-400 block font-mono">Top 5% dos pilotos no Brasil</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-black border border-amber-500/40">
              5.420 PTS
            </span>
          </div>
        );
      case 'motoclubes':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
              <Shield size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">Irmandades Oficiais</span>
              <p className="text-xs font-bold text-white truncate">Sedes, Colete Virtual e Mural Interno</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Validação de novos integrantes e eventos exclusivos</span>
            </div>
          </div>
        );
      case 'partners':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-purple-500/30 p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
              <Store size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">Rede de Vantagens</span>
              <p className="text-xs font-bold text-white truncate">10% a 25% OFF em Oficinas e Pousadas</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Apresente seu código e valide o benefício</span>
            </div>
          </div>
        );
      case 'accessibility':
        return (
          <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/30 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block">Modo Estrada Solar</span>
                <span className="text-xs font-bold text-white">Alto Contraste & Tipografia Dinâmica</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              Otimizado
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNavigateToFeature = () => {
    if (currentStep.path) {
      navigate(currentStep.path);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto">
      {/* Dark overlay backdrop with transparent cutout hole over targetRect so the highlighted element shines bright */}
      {targetRect ? (
        <svg 
          className="fixed inset-0 w-full h-full z-[9990] pointer-events-auto"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              {/* White background: dark overlay is visible everywhere */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cutout: transparent hole right over the highlighted element */}
              <rect
                x={Math.max(0, targetRect.left - 6)}
                y={Math.max(0, targetRect.top - 6)}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="24"
                ry="24"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.78)"
            mask="url(#tour-spotlight-mask)"
            onClick={skipTour}
          />
        </svg>
      ) : (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300 z-[9990]"
          onClick={skipTour}
        />
      )}

      {/* Target element spotlight glow border */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-3xl border-2 border-[#ff751f] shadow-[0_0_35px_rgba(255,117,31,0.65)] animate-pulse transition-all duration-300 z-[9995]"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        />
      )}

      {/* Explanatory Tooltip Card / Manual Screen */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-slate-900/98 border-2 border-slate-700/80 hover:border-[#ff751f]/70 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Step Badge & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
              {renderIcon(currentStep.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                  {currentStep.category}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Passo {currentStepIndex + 1} de {totalSteps}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-white mt-1">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={skipTour}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar Manual"
            title="Fechar Manual"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          {currentStep.description}
        </p>

        {/* Visual Preview / Demo of the Feature in the Manual */}
        {renderStepPreview(currentStep.id)}

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-orange-600 to-amber-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {/* Quick jump to page if applicable */}
          {currentStep.path && (
            <button
              onClick={handleNavigateToFeature}
              className="text-[11px] font-bold text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
              title="Abrir esta área agora"
            >
              <span>Abrir área</span>
              <ExternalLink size={12} />
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
            )}

            <button
              onClick={nextStep}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-orange-600/30 cursor-pointer"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Concluir Guia</span>
                </>
              ) : (
                <>
                  <span>Próximo</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
