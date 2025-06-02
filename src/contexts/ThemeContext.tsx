
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'black' | 'orange' | 'green' | 'red';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('black');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && ['black', 'orange', 'green', 'red'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }

    const storedDarkMode = localStorage.getItem('app-dark-mode');
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('app-theme', newTheme);
    setThemeState(newTheme);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('app-dark-mode', String(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-black', 'theme-orange', 'theme-green', 'theme-red');
    root.classList.add(`theme-${theme}`);

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDarkMode]);
  
  const value = useMemo(() => ({ theme, setTheme, isDarkMode, toggleDarkMode }), [theme, isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
