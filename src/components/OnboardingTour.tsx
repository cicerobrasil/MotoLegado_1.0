import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink
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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update target bounding box and position tooltip
  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
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
            const tooltipWidth = 420;
            const tooltipHeight = 260;
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
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, currentStep, currentStepIndex]);

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

  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNavigateToFeature = () => {
    if (currentStep.path) {
      navigate(currentStep.path);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={skipTour}
      />

      {/* Target element spotlight glow */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-[#ff751f] shadow-[0_0_25px_rgba(255,117,31,0.6)] animate-pulse transition-all duration-300 z-[9995]"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        />
      )}

      {/* Explanatory Tooltip Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-slate-900/95 border-2 border-slate-700 hover:border-[#ff751f]/60 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Step Badge & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
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
            aria-label="Pular Guia"
            title="Pular Guia"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          {currentStep.description}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
              className="text-[11px] font-bold text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Ir para esta página"
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
