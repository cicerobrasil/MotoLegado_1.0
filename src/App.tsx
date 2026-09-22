import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { Feed } from "./components/Feed";
import { Routes as RoutesList } from "./components/Routes";
import { ProfileDashboard } from "./components/ProfileDashboard";
import { ProfileSettings } from "./components/ProfileSettings";
import { Logbook } from "./components/Logbook";
import { MotoClubsList } from "./components/MotoClubsList";
import { MotoClubDetail } from "./components/MotoClubDetail";
import { MotoClubMural } from "./components/MotoClubMural";
import { MotoClubApplication } from "./components/MotoClubApplication";
import { Events } from "./components/Events";
import { Partners } from "./components/Partners";
import { CommandCenter } from "./components/CommandCenter";
import { Achievements } from "./components/Achievements";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { AccessibilityModal } from "./components/AccessibilityModal";
import { cn } from "./lib/utils";
import "./utils/systemReset";

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="flex min-h-screen bg-[#001b3d] text-[#e2e8f0] font-sans selection:bg-[#ff751f] selection:text-white">
      {!isLandingPage && <Sidebar />}
      
      <main className={cn(
        "flex-1 min-h-screen overflow-y-auto",
        isLandingPage ? "w-full" : "lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0"
      )}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/community" element={<Feed />} />
          <Route path="/routes" element={<RoutesList />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/motoclub" element={<MotoClubsList />} />
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
      </main>

      {/* Modal for Visual & Typography Settings */}
      <AccessibilityModal />

      {/* PWA In-App Mobile Install Banner & Offline Connectivity Indicator */}
      <PWAInstallBanner />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppLayout />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
