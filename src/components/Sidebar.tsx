
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Map as MapIcon, 
  Newspaper, 
  Layers, 
  LogOut, 
  User,
  Shield,
  ShieldCheck,
  Calendar,
  Store,
  X,
  BookOpen,
  Crown
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { isUserProOrBonificado } from "../lib/permissions";
import { UpgradeModal } from "./UpgradeModal";
import { PWAInstallButton } from "./PWAInstallButton";
import { LogoMark } from "./LogoMark";
import { TourButton } from "./TourButton";
import { getPilotLiveGamification } from "../lib/gamification";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: Layers, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Eventos", path: "/events" },
  { icon: Store, label: "Parceiros", path: "/partners" },
  { icon: BookOpen, label: "Diário & Checklist", path: "/logbook" },
  { icon: Newspaper, label: "COMUNIDADE", path: "/community" },
  { icon: MapIcon, label: "Roteiros", path: "/routes" },
  { icon: Trophy, label: "Conquistas", path: "/achievements" },
  { icon: Crown, label: "Ranking Global", path: "/ranking" },
  { icon: Shield, label: "Moto Clubes", path: "/motoclubes" },
  { icon: ShieldCheck, label: "CENTRO DE COMANDO", path: "/command-center", adminOnly: true },
];

const BOTTOM_NAV_ITEMS = [
  { icon: Layers, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Eventos", path: "/events" },
  { icon: Store, label: "Parceiros", path: "/partners" },
  { icon: BookOpen, label: "Diário", path: "/logbook" },
  { icon: User, label: "Perfil", path: "/profile" },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: SidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isVip = isUserProOrBonificado(profile);

  const pilotName = profile?.name || 'Piloto MotoLegado';
  
  const [livePoints, setLivePoints] = useState(() => getPilotLiveGamification().pointsBreakdown.totalPoints);
  const [liveTier, setLiveTier] = useState(() => getPilotLiveGamification().rankInfo.currentTier.title);

  useEffect(() => {
    const update = () => {
      const g = getPilotLiveGamification();
      setLivePoints(g.pointsBreakdown.totalPoints);
      setLiveTier(g.rankInfo.currentTier.title);
    };
    window.addEventListener('storage', update);
    window.addEventListener('motolegado_gamification_updated', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('motolegado_gamification_updated', update);
    };
  }, []);

  const pilotTier = liveTier || profile?.tier || 'Bronze';
  const pilotPoints = livePoints ?? profile?.points ?? 0;
  const pilotAvatar = (profile?.avatar_url && !profile.avatar_url.includes('56ceb5ecca61'))
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(pilotName)}&background=ea580c&color=ffffff&bold=true`;
  const isAdmin = profile?.role === 'admin' || 
    profile?.name?.toLowerCase().includes('admin') || 
    profile?.email?.toLowerCase().includes('admin') || 
    profile?.email?.toLowerCase() === 'ciceroranieri@gmail.com';

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  // Do not render sidebar on the landing page ("/")
  if (location.pathname === "/") {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-[#001b3d]/80 backdrop-blur-sm z-45"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container (Desktop static + Mobile Sliding Drawer) */}
      <aside className={cn(
        "fixed left-0 top-0 w-64 h-screen bg-[#00273d] border-r border-[#1e293b] flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 lg:p-8 flex items-center justify-between gap-3">
          <Link 
            to="/dashboard" 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center"
            aria-label="MotoLegado Início"
          >
            <LogoMark size="md" />
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const tourAttr = item.path === '/routes' 
              ? 'nav-routes' 
              : item.path === '/motoclubes' 
              ? 'nav-motoclubes' 
              : item.path === '/partners' 
              ? 'nav-partners' 
              : item.path === '/ranking' 
              ? 'nav-ranking'
              : undefined;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={tourAttr}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-[#ff751f]/15 text-[#ff751f] font-black italic uppercase text-xs tracking-widest shadow-sm" 
                    : "text-slate-300 hover:text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-[#ff751f]" : "group-hover:text-[#ff751f] group-hover:scale-110 transition-all")} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-[#ff751f] rounded-r-full shadow-[0_0_10px_rgba(255,117,31,0.6)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 sm:p-5 border-t border-[#1e293b] bg-[#001b3d]/60 backdrop-blur-md space-y-3">
          {/* User Pilot Profile Card */}
          <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group cursor-pointer decoration-none">
            <div className="w-10 h-10 rounded-lg bg-[#001b3d] border border-[#1e293b] overflow-hidden group-hover:border-[#ff751f] transition-all shadow-lg shrink-0">
              <img src={pilotAvatar} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black uppercase italic tracking-tight text-[#e2e8f0] group-hover:text-amber-400 transition-colors truncate">{pilotName}</p>
              {isAdmin ? (
                <p className="text-[9px] text-[#ff751f] font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>🛡️</span> COMANDO • ADMIN
                </p>
              ) : profile?.plan_type === 'bonificado' ? (
                <p className="text-[9px] text-amber-400 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>🎁</span> BONIFICADO • VIP PRO
                </p>
              ) : (profile?.plan_type === 'pago' || profile?.is_pro) ? (
                <p className="text-[9px] text-[#ff751f] font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>🔥</span> PILOTO PRO • VIP
                </p>
              ) : (
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>🟢</span> ASFALTO • {pilotTier} ({pilotPoints} PTS)
                </p>
              )}
            </div>
          </Link>

          {/* Action: PWA Install & Guided Tour */}
          <div className="space-y-2 pt-1">
            <TourButton variant="sidebar" />
            <PWAInstallButton variant="sidebar" />
          </div>

          {(!isVip || isAdmin) && (
            <button
              onClick={() => {
                setIsOpen(false);
                setIsUpgradeModalOpen(true);
              }}
              className="w-full btn-primary py-2.5 px-3"
            >
              <Crown size={14} />
              <span>Assine aqui!</span>
            </button>
          )}

          <div className="pt-2 border-t border-[#1e293b] flex flex-col gap-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors py-1 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#00273d]/95 backdrop-blur-xl border-t border-[#1e293b] flex items-center justify-around px-2 z-40 shadow-2xl">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors",
                isActive ? "text-[#ff751f] font-black" : "text-slate-300 hover:text-white font-bold"
              )}
            >
              <item.icon size={18} className={cn(isActive ? "text-[#ff751f] scale-110" : "")} />
              <span className="text-[9px] uppercase tracking-tighter truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </>
  );
}
