import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { Feed } from "./components/Feed";
import { Routes as RoutesList } from "./components/Routes";
import { ProfileDashboard } from "./components/ProfileDashboard";
import { ProfileSettings } from "./components/ProfileSettings";
import { Logbook } from "./components/Logbook";
import { MotoClub } from "./components/MotoClub";
import { MotoClubsList } from "./components/MotoClubsList";
import { MotoClubDetail } from "./components/MotoClubDetail";
import { MotoClubMural } from "./components/MotoClubMural";
import { MotoClubApplication } from "./components/MotoClubApplication";
import { Events } from "./components/Events";
import { Partners } from "./components/Partners";
import { CommandCenter } from "./components/CommandCenter";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

// Mock Achievements Page
function Achievements() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 sm:mb-12 border-b border-slate-800 pb-6 sm:pb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">CONQUISTAS <span className="text-orange-500">MOTOLEGADO</span></h1>
        <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 sm:mt-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          SISTEMA DE PRESTÍGIO E RECOMPENSAS AO VIVO
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { icon: "🌎", title: "Viagem Internacional", desc: "Expedição cruzando fronteiras internacionais", points: 500 },
          { icon: "🛣️", title: "Viagem Interestadual", desc: "Pilotagem cruzando divisas estaduais", points: 250 },
          { icon: "🏔️", title: "Alfa da Montanha", desc: "1.000km em altitude", points: 250 },
          { icon: "🏎️", title: "Velocidade Constante", desc: "Viagem sem paradas extras", points: 100 },
          { icon: "🤝", title: "Irmão de Estrada", desc: "Ajudou 5 motociclistas", points: 500 },
          { icon: "🌧️", title: "Chuva é Só Água", desc: "Viagem de 200km sob chuva", points: 300 },
          { icon: "🌃", title: "Coruja Noturna", desc: "500km rodados à noite", points: 200 },
          { icon: "⛽", title: "Econômico", desc: "Rodou 30km/L em viagem", points: 150 },
        ].map((badge, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={badge.title} 
            className="bento-card p-6 sm:p-8 text-center group cursor-pointer"
          >
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {badge.icon}
            </div>
            <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-tighter mb-1 text-white">{badge.title}</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mb-4 sm:mb-6 tracking-widest leading-relaxed">{badge.desc}</p>
            <div className="inline-block px-3 sm:px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-[9px] sm:text-[10px] font-black italic uppercase text-slate-400 tracking-[0.2em] group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500 transition-all duration-300">
              +{badge.points} PTS
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white">
      {!isLandingPage && <Sidebar />}
      
      <main className={cn(
        "flex-1 min-h-screen overflow-y-auto",
        isLandingPage ? "w-full" : "lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0"
      )}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/community" element={<Feed />} />
            <Route path="/routes" element={<RoutesList />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/motoclub" element={<MotoClub />} />
            <Route path="/motoclubes" element={<MotoClubsList />} />
            <Route path="/motoclub/:id" element={<MotoClubDetail />} />
            <Route path="/motoclub/:id/mural" element={<MotoClubMural />} />
            <Route path="/motoclub/:id/apply" element={<MotoClubApplication />} />
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/admin" element={<CommandCenter />} />
            <Route path="/profile" element={<ProfileDashboard />} />
            <Route path="/profile/settings" element={<ProfileSettings />} />
            <Route path="/logbook" element={<Logbook />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
