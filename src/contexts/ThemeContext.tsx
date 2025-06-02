
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Removed Theme type and related logic for multi-theme switching

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode

  useEffect(() => {
    // Removed localStorage logic for 'app-theme'
    const storedDarkMode = localStorage.getItem('app-dark-mode');
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
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
    
    // Ensure 'theme-black' is the only color theme class and remove others
    const themesToRemove = ['theme-orange', 'theme-green', 'theme-red'];
    themesToRemove.forEach(t => root.classList.remove(t));
    if (!root.classList.contains('theme-black')) {
        root.classList.add('theme-black');
    }

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]); // Dependency array now only includes isDarkMode
  
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
