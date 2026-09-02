
import { useState } from "react";
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
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

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
  { icon: Newspaper, label: "COMUNIDADE", path: "/community" },
  { icon: MapIcon, label: "Roteiros", path: "/routes" },
  { icon: Trophy, label: "Conquistas", path: "/achievements" },
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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isSupabaseConfigured, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const pilotName = profile?.name || 'Piloto MotoLegado';
  const pilotTier = profile?.tier || 'Bronze';
  const pilotPoints = profile?.points ?? 0;
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
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 z-40">
        <Link 
          to="/dashboard" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(234,88,12,0.3)]">
            <span className="text-slate-950 font-black text-lg italic leading-none ml-0.5">M</span>
          </div>
          <span className="font-black italic uppercase text-lg tracking-tighter text-white">
            Moto<span className="text-orange-500">Legado</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/profile" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
            <img src={pilotAvatar} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-orange-500 transition-colors cursor-pointer"
            aria-label="Abrir Menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-45"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container (Desktop static + Mobile Sliding Drawer) */}
      <aside className={cn(
        "fixed left-0 top-0 w-64 h-screen bg-slate-950 border-r border-slate-800/60 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 lg:p-8 flex items-center justify-between gap-3">
          <Link 
            to="/dashboard" 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(234,88,12,0.3)] shrink-0">
              <span className="text-slate-950 font-black text-xl italic leading-none ml-0.5">M</span>
            </div>
            <h1 className="font-black italic uppercase text-xl tracking-tighter text-white">Moto<span className="text-orange-500">Legado</span></h1>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-orange-600/10 text-orange-500 font-black italic uppercase text-xs tracking-widest" 
                    : "text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-orange-500" : "group-hover:text-orange-400 group-hover:scale-110 transition-all")} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-orange-600 rounded-r-full shadow-[0_0_10px_rgba(255,85,0,0.5)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/60 bg-slate-900/10 backdrop-blur-md space-y-4">
          <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group cursor-pointer decoration-none">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden group-hover:border-orange-500 transition-all shadow-lg shrink-0">
              <img src={pilotAvatar} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black uppercase italic tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">{pilotName}</p>
              {isAdmin ? (
                <p className="text-[9px] text-orange-400 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>🛡️</span> COMANDO • ADMIN
                </p>
              ) : (
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1 truncate">
                  <span>{isSupabaseConfigured ? '🟢' : '🥈'}</span> Piloto {pilotTier} • {pilotPoints} PTS
                </p>
              )}
            </div>
          </Link>

          <div className="pt-2 border-t border-slate-800/40 flex flex-col gap-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors py-1 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around px-2 z-40 shadow-2xl">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors",
                isActive ? "text-orange-500 font-black" : "text-slate-500 hover:text-slate-300 font-bold"
              )}
            >
              <item.icon size={18} className={cn(isActive ? "text-orange-500 scale-110" : "")} />
              <span className="text-[9px] uppercase tracking-tighter truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
