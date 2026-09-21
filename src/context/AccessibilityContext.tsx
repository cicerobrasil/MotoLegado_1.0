import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast';
export type FontSizeScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  theme: ThemeMode;
  fontSize: FontSizeScale;
  highContrast: boolean;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: FontSizeScale) => void;
  toggleTheme: () => void;
  toggleHighContrast: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  resetDefaults: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'motolegado_theme';
const STORAGE_FONT_KEY = 'motolegado_font_size';
const STORAGE_CONTRAST_KEY = 'motolegado_high_contrast';

function safeGetItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore in restricted iframes
  }
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = safeGetItem(STORAGE_THEME_KEY);
    if (saved === 'light' || saved === 'high-contrast' || saved === 'dark') {
      return saved;
    }
    return 'dark';
  });

  const [fontSize, setFontSizeState] = useState<FontSizeScale>(() => {
    const saved = safeGetItem(STORAGE_FONT_KEY);
    if (saved === 'large' || saved === 'xlarge' || saved === 'normal') {
      return saved;
    }
    return 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return safeGetItem(STORAGE_CONTRAST_KEY) === 'true';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Apply DOM classes whenever settings change
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'high-contrast') {
      root.classList.add('theme-high-contrast');
      root.setAttribute('data-theme', 'high-contrast');
    } else {
      root.classList.add('theme-dark');
      root.setAttribute('data-theme', 'dark');
    }

    // Font size classes
    root.classList.remove('font-normal', 'font-large', 'font-xlarge');
    if (fontSize === 'large') {
      root.classList.add('font-large');
    } else if (fontSize === 'xlarge') {
      root.classList.add('font-xlarge');
    } else {
      root.classList.add('font-normal');
    }

    // High contrast class
    if (highContrast) {
      root.classList.add('contrast-boost');
    } else {
      root.classList.remove('contrast-boost');
    }

    safeSetItem(STORAGE_THEME_KEY, theme);
    safeSetItem(STORAGE_FONT_KEY, fontSize);
    safeSetItem(STORAGE_CONTRAST_KEY, String(highContrast));
  }, [theme, fontSize, highContrast]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setFontSize = (newSize: FontSizeScale) => {
    setFontSizeState(newSize);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleHighContrast = () => {
    setHighContrastState((prev) => !prev);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const resetDefaults = () => {
    setThemeState('dark');
    setFontSizeState('normal');
    setHighContrastState(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        fontSize,
        highContrast,
        setTheme,
        setFontSize,
        toggleTheme,
        toggleHighContrast,
        isModalOpen,
        openModal,
        closeModal,
        resetDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
