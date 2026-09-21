import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Type, Sun, Moon } from 'lucide-react';

interface AccessibilityButtonProps {
  variant?: 'header' | 'sidebar' | 'floating' | 'compact';
}

export function AccessibilityButton({ variant = 'header' }: AccessibilityButtonProps) {
  const { openModal, theme, fontSize } = useAccessibility();

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
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition-all text-xs font-black uppercase tracking-wider cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-orange-400 group-hover:scale-110 transition-transform" />
          <span>Legibilidade & Tema</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
          <span>{theme === 'light' ? '☀️ Claro' : '🌙 Escuro'}</span>
          <span>•</span>
          <span>{fontSize === 'normal' ? 'Aa' : fontSize === 'large' ? 'Aa+' : 'AA+'}</span>
        </div>
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
      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
    >
      {theme === 'light' ? (
        <Sun size={15} className="text-amber-500 group-hover:rotate-45 transition-transform" />
      ) : (
        <Moon size={15} className="text-orange-400 group-hover:scale-110 transition-transform" />
      )}
      <span className="hidden sm:inline">Visual & Letra</span>
      <span className="text-[10px] bg-orange-500/15 border border-orange-500/30 text-orange-400 px-1.5 py-0.5 rounded font-black">
        {fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}
      </span>
    </button>
  );
}
