import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Type, Sun, Moon } from 'lucide-react';

interface AccessibilityButtonProps {
  variant?: 'header' | 'sidebar' | 'floating' | 'compact' | 'top-menu';
}

export function AccessibilityButton({ variant = 'header' }: AccessibilityButtonProps) {
  const { openModal, theme, fontSize } = useAccessibility();

  if (variant === 'top-menu') {
    return (
      <button
        data-tour="top-theme"
        onClick={openModal}
        title="Legibilidade & Tema: Ajustar tamanho de letra e contraste"
        aria-label="Legibilidade & Tema"
        className="h-10 px-2.5 md:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#ff751f]/50 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group shrink-0"
      >
        <Eye size={17} className="text-[#ff751f] group-hover:scale-110 transition-transform shrink-0" />
        <span className="hidden md:inline-block text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white whitespace-nowrap">
          Legibilidade & Tema
        </span>
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        onClick={openModal}
        aria-label="Opções de Acessibilidade e Tamanho da Letra"
        title="Ajustar tamanho da letra e contraste"
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 bg-slate-900/90 hover:bg-orange-600 text-white border-2 border-orange-500/60 hover:border-orange-400 p-3 rounded-2xl shadow-2xl backdrop-blur-md transition-all transform hover:scale-105 flex items-center gap-2 group cursor-pointer"
      >
        <Eye size={18} className="text-orange-400 group-hover:text-white" />
        <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider">
          Visual {fontSize === 'large' ? '(A+)' : fontSize === 'xlarge' ? '(AA+)' : ''}
        </span>
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={openModal}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all text-xs font-black uppercase tracking-wider cursor-pointer group"
      >
        <Eye size={16} className="text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
        <span>Legibilidade & Tema</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={openModal}
        title="Acessibilidade: Ajustar letra e cores"
        aria-label="Acessibilidade"
        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-orange-400 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <Eye size={17} />
        <Type size={13} className="text-orange-400" />
      </button>
    );
  }

  // Default header variant
  return (
    <button
      onClick={openModal}
      title="Acessibilidade: Aumentar letra e contraste"
      aria-label="Ajustar visibilidade e tamanho de texto"
      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm group whitespace-nowrap shrink-0"
    >
      {theme === 'light' ? (
        <Sun size={15} className="text-amber-500 group-hover:rotate-45 transition-transform shrink-0" />
      ) : (
        <Moon size={15} className="text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
      )}
      <span>Visual</span>
      <span className="text-[10px] bg-orange-500/15 border border-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded font-black">
        {fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}
      </span>
    </button>
  );
}
