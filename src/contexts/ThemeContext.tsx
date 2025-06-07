
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default to light mode

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('app-dark-mode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
    } else {
      // If no stored preference, use system preference.
      // Default to light if system preference cannot be determined.
      setIsDarkMode(prefersDark); 
      localStorage.setItem('app-dark-mode', String(prefersDark));
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('app-dark-mode', String(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove any explicit theme classes like 'theme-black', 'theme-orange', etc.
    // The FODMAPSafe theme is now defined by default :root and html.dark in globals.css.
    const themesToRemove = ['theme-black', 'theme-orange', 'theme-green', 'theme-red'];
    themesToRemove.forEach(t => root.classList.remove(t));

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

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
