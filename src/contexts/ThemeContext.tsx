
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'black' | 'orange' | 'green' | 'red';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('black'); // Default theme

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme && ['black', 'orange', 'green', 'red'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('app-theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-black', 'theme-orange', 'theme-green', 'theme-red');
    if (theme !== 'black') { // 'black' theme uses the default :root/:dark styles
      root.classList.add(`theme-${theme}`);
    }
    // Ensure .dark class is always present as per globals.css structure
    if (!root.classList.contains('dark')) {
        root.classList.add('dark');
    }
  }, [theme]);
  
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

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
