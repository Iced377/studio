
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
    // Remove all potentially existing theme classes
    root.classList.remove('theme-black', 'theme-orange', 'theme-green', 'theme-red');
    
    // Add the currently selected theme class (e.g., theme-black, theme-orange)
    // This ensures that if 'black' is selected, 'theme-black' is applied,
    // leveraging the .theme-black CSS rules.
    root.classList.add(`theme-${theme}`);
    
    // Ensure .dark class is always present as it's the base for all themes defined in globals.css
    if (!root.classList.contains('dark')) {
        root.classList.add('dark');
    }
  }, [theme]);
  
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

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
