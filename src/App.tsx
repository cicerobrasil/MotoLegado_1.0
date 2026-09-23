import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { TourProvider } from "./context/TourContext";
import { Sidebar } from "./components/Sidebar";
import { TopNavbar } from "./components/TopNavbar";
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
import { GlobalRanking } from "./components/GlobalRanking";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { AccessibilityModal } from "./components/AccessibilityModal";
import { OnboardingTour } from "./components/OnboardingTour";
import { cn } from "./lib/utils";
import "./utils/systemReset";

function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#001b3d] text-[#e2e8f0] font-sans selection:bg-[#ff751f] selection:text-white">
      {!isLandingPage && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}
      
      <div className={cn(
        "flex-1 min-h-screen flex flex-col min-w-0",
        isLandingPage ? "w-full" : "lg:ml-64"
      )}>
        {!isLandingPage && (
          <TopNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />
        )}

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-8">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/community" element={<Feed />} />
          <Route path="/routes" element={<RoutesList />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/ranking" element={<GlobalRanking />} />
          <Route path="/leaderboard" element={<GlobalRanking />} />
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
    </div>

      {/* Modal for Visual & Typography Settings */}
      <AccessibilityModal />

      {/* Interactive First Access Onboarding Tour & Tooltips */}
      <OnboardingTour />

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
          <TourProvider>
            <AppLayout />
          </TourProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
