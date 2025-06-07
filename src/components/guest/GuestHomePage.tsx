
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext'; // Kept for dark mode check, though guest is light

// GuestButtonScheme interface removed as it's no longer used

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onSheetOpenChange,
  onSetFeedback,
  onRemoveItem,
  isLoadingAiForItem,
}: {
  onLogFoodClick: () => void;
  lastLoggedItem: LoggedFoodItem | null;
  isSheetOpen: boolean;
  onSheetOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}) {
  // activeLightModeColorScheme state removed
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    // Guest view should primarily use the light mode theme defined in globals.css
    // but we respect if the user somehow got into dark mode and switch it back.
    // The main button glow will use CSS variables from --primary, so it adapts.
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
        // Note: We are not calling toggleDarkMode() here to avoid potential infinite loops
        // if ThemeProvider also reacts to class changes. We just ensure light mode class.
    }
    // The documentElement style for --glow-color-rgb is removed as pulse-glow now uses --primary
  }, [isDarkMode]);

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} /> {/* guestButtonScheme prop removed */}

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative text-center">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleMainButtonClick}
            className={cn(
              "text-primary-foreground rounded-full h-36 w-36 sm:h-40 sm:w-40 flex items-center justify-center border-2 animate-pulse-glow focus:outline-none focus:ring-4 shadow-xl",
              "bg-primary border-primary hover:bg-primary/90 focus:ring-primary/50", // Uses theme's primary color
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
              priority
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
          <ChevronUp className="h-6 w-6 text-muted-foreground/70 animate-neon-chevron-pulse" /> {/* Added animation */}
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
        // activeColorScheme prop removed
      />
    </div>
  );
}
