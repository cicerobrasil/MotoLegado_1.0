import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // 1. Reset de scroll automático para o topo sempre que mudar de página
  const scrollToTopInstant = useCallback(() => {
    // Window e documentos globais
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Container principal de scroll do layout (tag <main> com overflow-y-auto)
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }

    // Qualquer outro elemento scrollável presente na visualização
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach((el) => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, []);

  useEffect(() => {
    scrollToTopInstant();

    // Pequeno delay para garantir que componentes renderizados assincronamente também fiquem no topo
    const timer = setTimeout(scrollToTopInstant, 40);
    return () => clearTimeout(timer);
  }, [pathname, search, scrollToTopInstant]);

  // 2. Monitorar a rolagem tanto no window quanto no container <main>
  useEffect(() => {
    const checkScrollPosition = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const mainEl = document.querySelector('main');
      const mainScroll = mainEl ? mainEl.scrollTop : 0;

      const currentScroll = Math.max(windowScroll, mainScroll);
      setIsVisible(currentScroll > 240);
    };

    // Escuta no window
    window.addEventListener('scroll', checkScrollPosition, { passive: true });

    // Escuta no container <main>
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', checkScrollPosition, { passive: true });
    }

    // Checagem inicial
    checkScrollPosition();

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      if (mainEl) {
        mainEl.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [pathname]);

  // 3. Ação do botão flutuante com animação suave
  const handleScrollToTopSmooth = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach((el) => {
      (el as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <button
      type="button"
      onClick={handleScrollToTopSmooth}
      aria-label="Voltar ao topo da página"
      title="Voltar ao topo"
      className={cn(
        "fixed z-50 flex items-center justify-center gap-1.5 p-3 sm:px-4 sm:py-3 rounded-2xl sm:rounded-full",
        "bg-gradient-to-r from-orange-600 via-[#ff751f] to-amber-500 hover:from-orange-500 hover:to-amber-400",
        "text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-orange-600/35",
        "border border-orange-400/30 backdrop-blur-md cursor-pointer group",
        "transition-all duration-300 ease-out transform",
        "bottom-20 sm:bottom-8 right-4 sm:right-8",
        isVisible 
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
          : "opacity-0 translate-y-6 scale-90 pointer-events-none"
      )}
    >
      <ArrowUp 
        size={20} 
        className="transition-transform duration-300 group-hover:-translate-y-1" 
        strokeWidth={2.7}
      />
      <span className="hidden sm:inline-block font-mono text-[11px] font-black">
        TOPO
      </span>
    </button>
  );
}
