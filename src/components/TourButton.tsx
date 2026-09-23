import { Compass, Sparkles } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { cn } from '../lib/utils';

interface TourButtonProps {
  variant?: 'top-menu' | 'sidebar' | 'dashboard';
  className?: string;
}

export function TourButton({ variant = 'top-menu', className }: TourButtonProps) {
  const { startTour } = useTour();

  if (variant === 'sidebar') {
    return (
      <button
        onClick={() => startTour(true)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-black uppercase tracking-wider cursor-pointer group",
          className
        )}
        title="Ver Guia de Primeiro Acesso"
      >
        <Compass size={16} className="text-[#ff751f] group-hover:rotate-45 transition-transform shrink-0" />
        <span>Guia do Piloto</span>
      </button>
    );
  }

  if (variant === 'dashboard') {
    return (
      <button
        onClick={() => startTour(true)}
        className={cn(
          "px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-[#ff751f]/50 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group whitespace-nowrap",
          className
        )}
        title="Iniciar Guia Interativo de Recursos"
      >
        <Sparkles size={14} className="text-[#ff751f] group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Guia do Piloto</span>
        <span className="sm:hidden">Guia</span>
      </button>
    );
  }

  // Default: top-menu
  return (
    <button
      onClick={() => startTour(true)}
      title="Guia de Primeiro Acesso: Conheça as funcionalidades"
      aria-label="Guia do Piloto"
      className={cn(
        "h-10 px-2.5 md:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#ff751f]/50 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group shrink-0",
        className
      )}
    >
      <Compass size={17} className="text-[#ff751f] group-hover:rotate-45 transition-transform shrink-0" />
      <span className="hidden md:inline-block text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white whitespace-nowrap">
        Guia do Piloto
      </span>
    </button>
  );
}
