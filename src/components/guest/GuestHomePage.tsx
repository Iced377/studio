
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext'; 

interface GuestHomePageProps {
  onLogFoodClick: () => void;
  lastLoggedItem: LoggedFoodItem | null;
  isSheetOpen: boolean;
  onSheetOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}

const lightModeButtonColors = [
  { id: 'sky', base: 'bg-sky-500', border: 'border-sky-700', hover: 'hover:bg-sky-600', focusRing: 'focus:ring-sky-500', glowRgb: '56, 189, 248' },
  { id: 'amber', base: 'bg-amber-500', border: 'border-amber-700', hover: 'hover:bg-amber-600', focusRing: 'focus:ring-amber-500', glowRgb: '245, 158, 11' },
  { id: 'emerald', base: 'bg-emerald-500', border: 'border-emerald-700', hover: 'hover:bg-emerald-600', focusRing: 'focus:ring-emerald-500', glowRgb: '16, 185, 129' },
  { id: 'rose', base: 'bg-rose-500', border: 'border-rose-700', hover: 'hover:bg-rose-600', focusRing: 'focus:ring-rose-500', glowRgb: '244, 63, 94' },
  { id: 'violet', base: 'bg-violet-500', border: 'border-violet-700', hover: 'hover:bg-violet-600', focusRing: 'focus:ring-violet-500', glowRgb: '139, 92, 246' },
];

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onSheetOpenChange,
  onSetFeedback,
  onRemoveItem,
  isLoadingAiForItem,
}: GuestHomePageProps) {
  const [activeLightModeColorScheme, setActiveLightModeColorScheme] = useState(lightModeButtonColors[0]);
  const { isDarkMode, toggleDarkMode } = useTheme(); 

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    if (!document.documentElement.classList.contains('theme-black')) {
      document.documentElement.classList.add('theme-black');
    }
    if (isDarkMode) { // if hook says dark, but we want light for guest, toggle it
        toggleDarkMode();
    }

    const randomIndex = Math.floor(Math.random() * lightModeButtonColors.length);
    const selectedScheme = lightModeButtonColors[randomIndex];
    setActiveLightModeColorScheme(selectedScheme);
    document.documentElement.style.setProperty('--glow-color-rgb', selectedScheme.glowRgb);
    
  }, []); 

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} guestButtonScheme={activeLightModeColorScheme} />

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative text-center">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleMainButtonClick}
            className={cn(
              "text-white rounded-full h-36 w-36 sm:h-40 sm:w-40 flex items-center justify-center border-2 animate-pulse-glow focus:outline-none focus:ring-4 shadow-xl",
              activeLightModeColorScheme.base,
              activeLightModeColorScheme.border,
              activeLightModeColorScheme.hover,
              activeLightModeColorScheme.focusRing,
              "focus:ring-offset-background focus:ring-offset-2"
            )}
            aria-label="Check My Meal"
          >
            <Image
              src="/Gutcheck_logo.png"
              alt="GutCheck Logo"
              width={144} 
              height={144}
              className="object-contain"
            />
          </button>
          <span className="text-2xl sm:text-3xl font-semibold text-foreground font-headline">
            GutCheck
          </span>
        </div>
      </main>

      {lastLoggedItem && !isSheetOpen && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce z-10"
          onClick={() => onSheetOpenChange(true)}
        >
          <ChevronUp className="h-6 w-6 text-muted-foreground/70" />
          <span className="text-xs text-muted-foreground/70">Swipe Up or Tap to View the Meal</span>
        </div>
      )}
      
      <GuestLastLogSheet
        isOpen={isSheetOpen}
        onOpenChange={onSheetOpenChange}
        lastLoggedItem={lastLoggedItem}
        onSetFeedback={onSetFeedback}
        onRemoveItem={onRemoveItem}
        isLoadingAi={isLoadingAiForItem}
      />
    </div>
  );
}
