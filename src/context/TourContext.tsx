import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  iconName: string;
  category: string;
  path?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'telemetry',
    title: 'Central de Telemetria & KM',
    category: 'Comando',
    description: 'Aqui você acompanha seus quilômetros acumulados, seu nível estradeiro e o resumo da sua última viagem em tempo real.',
    targetSelector: '[data-tour="dashboard-telemetry"]',
    iconName: 'Compass',
    path: '/dashboard'
  },
  {
    id: 'logbook',
    title: 'Diário de Bordo & Pontuação',
    category: 'Registros',
    description: 'Registre suas viagens de moto! Cada trajeto soma pontos no ranking, guarda fotos da estrada e documenta seu legado sobre duas rodas.',
    targetSelector: '[data-tour="dashboard-logbook"]',
    iconName: 'BookOpen',
    path: '/dashboard'
  },
  {
    id: 'routes',
    title: 'Rotas Estradeiras & GPS',
    category: 'Estrada',
    description: 'Descubra roteiros curados por motociclistas de todo o Brasil, com curvas sinuosas, alertas de pavimento e pontos de parada.',
    targetSelector: '[data-tour="nav-routes"]',
    iconName: 'Route',
    path: '/routes'
  },
  {
    id: 'ranking',
    title: 'Ranking Global & Conquistas',
    category: 'Gamificação',
    description: 'Conquiste patentes de respeito (Asfalto, Cruzador, Lenda), desbloqueie medalhas e encontre outros pilotos buscando pelo nome ou @apelido.',
    targetSelector: '[data-tour="dashboard-ranking"]',
    iconName: 'Trophy',
    path: '/dashboard'
  },
  {
    id: 'motoclubes',
    title: 'Moto Clubes & Irmandades',
    category: 'Comunidade',
    description: 'Conheça clubes oficiais, acompanhe o mural de avisos da irmandade e solicite seu ingresso no colete da sua escolha.',
    targetSelector: '[data-tour="nav-motoclubes"]',
    iconName: 'Shield',
    path: '/motoclub'
  },
  {
    id: 'partners',
    title: 'Rede de Parceiros Estradeiros',
    category: 'Benefícios',
    description: 'Acesse oficinas especializadas, paradas de combustível e pousadas com condições e descontos exclusivos para pilotos cadastrados.',
    targetSelector: '[data-tour="nav-partners"]',
    iconName: 'Store',
    path: '/partners'
  },
  {
    id: 'accessibility',
    title: 'Legibilidade & Modo de Visão',
    category: 'Visual',
    description: 'Ajuste rapidamente o contraste e o tamanho da fonte no topo da tela para uma leitura confortável em qualquer ambiente ou iluminação.',
    targetSelector: '[data-tour="top-theme"]',
    iconName: 'Eye',
    path: '/dashboard'
  }
];

interface TourContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  startTour: (fromBeginning?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep: (index: number) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Check if first-time user on dashboard
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('motolegado_tour_completed');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        // Auto-start for new visitors
        setIsActive(true);
        setCurrentStepIndex(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = (fromBeginning = true) => {
    if (fromBeginning) {
      setCurrentStepIndex(0);
    }
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const finishTour = () => {
    setIsActive(false);
    localStorage.setItem('motolegado_tour_completed', 'true');
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem('motolegado_tour_completed', 'true');
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setCurrentStepIndex(index);
    }
  };

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep: TOUR_STEPS[currentStepIndex],
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        goToStep
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
