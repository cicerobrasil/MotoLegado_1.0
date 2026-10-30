import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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

import { Events } from "./components/Events";
import { Partners } from "./components/Partners";
import { CommandCenter } from "./components/CommandCenter";
import { Achievements } from "./components/Achievements";
import { GlobalRanking } from "./components/GlobalRanking";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { AccessibilityModal } from "./components/AccessibilityModal";
import { OnboardingTour } from "./components/OnboardingTour";
import { PilotGuideModal } from "./components/PilotGuideModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { FirstAccessSetupModal } from "./components/FirstAccessSetupModal";
import { ImageLightboxProvider } from "./context/ImageLightboxContext";
import { GlobalImageLightbox } from "./components/GlobalImageLightbox";
import { cn } from "./lib/utils";
import "./utils/systemReset";

import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff751f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !profile) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function RootRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001b3d] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff751f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Usuários autenticados na rota raiz são direcionados automaticamente para o /dashboard
  if (user || profile) {
    return <Navigate to="/dashboard" replace />;
  }

  // Usuários não autenticados visualizam exclusivamente a LandingPage
  return <LandingPage />;
}

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
          <Route path="/" element={<RootRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/events" element={<Events />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/community" element={<Feed />} />
          <Route path="/routes" element={<RoutesList />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/ranking" element={<GlobalRanking />} />
          <Route path="/leaderboard" element={<GlobalRanking />} />
          <Route path="/motoclub" element={<Navigate to="/" replace />} />
          <Route path="/motoclubes" element={<Navigate to="/" replace />} />
          <Route path="/motoclub/:id" element={<Navigate to="/" replace />} />
          <Route path="/motoclub/:id/mural" element={<Navigate to="/" replace />} />
          <Route path="/motoclub/:id/apply" element={<Navigate to="/" replace />} />
          <Route path="/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
          <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="/logbook" element={<ProtectedRoute><Logbook /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>

      {/* First Access / Profile Setup Popup for New Users */}
      <FirstAccessSetupModal />

      {/* Modal for Visual & Typography Settings */}
      <AccessibilityModal />

      {/* Comprehensive Pilot's Guide & Manual Modal */}
      <PilotGuideModal />

      {/* Interactive First Access Onboarding Tour & Tooltips */}
      <OnboardingTour />

      {/* Floating Scroll to Top Button & Route Scroll Reset */}
      <ScrollToTop />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Global Image Lightbox Modal for All Photos, Cards, Logs, Logos & Events */}
      <GlobalImageLightbox />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <TourProvider>
            <ImageLightboxProvider>
              <AppLayout />
            </ImageLightboxProvider>
          </TourProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
