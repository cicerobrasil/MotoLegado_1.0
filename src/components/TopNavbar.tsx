import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { LogoMark } from './LogoMark';
import { TourButton } from './TourButton';
import { AccessibilityButton } from './AccessibilityButton';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

const ROUTE_NAMES: Record<string, string> = {
  '/dashboard': 'Central do Piloto',
  '/routes': 'Roteiros Estradeiros',
  '/motoclub': 'Moto Clubes & Irmandades',
  '/motoclubes': 'Moto Clubes & Irmandades',
  '/events': 'Calendário de Encontros',
  '/partners': 'Parceiros Oficiais',
  '/feed': 'Mural da Comunidade',
  '/community': 'Mural da Comunidade',
  '/logbook': 'Diário de Bordo',
  '/achievements': 'Conquistas & Medalhas',
  '/ranking': 'Ranking Global',
  '/leaderboard': 'Ranking Global',
  '/command-center': 'Centro de Comando',
  '/admin': 'Centro de Comando',
  '/profile': 'Perfil do Piloto',
  '/profile/settings': 'Configurações do Perfil'
};

export function TopNavbar({ onOpenSidebar }: TopNavbarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  const pilotName = profile?.name || 'Piloto MotoLegado';
  const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;

  const currentPageTitle = ROUTE_NAMES[location.pathname] || 'MotoLegado';

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-[#001b3d]/90 backdrop-blur-md border-b border-[#1e293b] px-3.5 sm:px-6 md:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Toggle & LogoMark OR Desktop Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#ff751f] transition-colors cursor-pointer shrink-0"
          aria-label="Abrir Menu de Navegação"
          title="Abrir Menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center shrink-0">
          <Link 
            to="/dashboard"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center"
            aria-label="MotoLegado Início"
          >
            <LogoMark size="sm" />
          </Link>
        </div>

        {/* Desktop Breadcrumb Context Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 select-none truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-slate-400">MOTOLEGADO</span>
          <ChevronRight size={14} className="text-slate-600 shrink-0" />
          <span className="text-white italic tracking-tight font-black">{currentPageTitle}</span>
        </div>
      </div>

      {/* Right: Quick Action Controls (Guia, Tema & Perfil) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Guia do Piloto */}
        <TourButton variant="top-menu" />

        {/* Legibilidade & Tema */}
        <AccessibilityButton variant="top-menu" />

        {/* Pilot Avatar Profile Link */}
        <Link 
          to="/profile" 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#00273d] border-2 border-slate-700/80 hover:border-[#ff751f] overflow-hidden shrink-0 transition-all shadow-sm group"
          title={`Perfil de ${pilotName}`}
          aria-label="Meu Perfil"
        >
          <img 
            src={pilotAvatar} 
            alt={pilotName} 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
          />
        </Link>
      </div>
    </header>
  );
}
