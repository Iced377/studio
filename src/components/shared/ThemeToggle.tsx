'use client';

// This component is no longer used as dark mode is default and the only theme.
// Keeping the file for now in case of future re-introduction of theme toggling.
// It can be safely deleted if a theme toggle is not planned.

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark

  useEffect(() => {
    // Forcibly set dark mode if it wasn't already
    if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    }
    localStorage.setItem('theme', 'dark');
    // This component no longer toggles theme, just ensures dark is set.
  }, []);


  // The toggle functionality is removed.
  // If you want to re-enable theme toggling, you'd need to:
  // 1. Update globals.css to have distinct light and dark theme variables.
  // 2. Restore the toggleTheme function logic.
  // 3. Update RootLayout to remove the hardcoded `className="dark"` and potentially add `suppressHydrationWarning`.

  return (
    <Button variant="ghost" size="icon" aria-label="Theme is dark" disabled>
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      <span className="sr-only">Theme is dark (default)</span>
    </Button>
  );
}
