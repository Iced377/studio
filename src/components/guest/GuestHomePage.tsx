
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

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
  onOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}) {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} />

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative text-center">
        <div className="flex flex-col items-center space-y-6"> {/* Increased space-y for title */}
          <button
            onClick={handleMainButtonClick}
            className={cn(
              "text-primary-foreground rounded-full h-40 w-40 sm:h-48 sm:w-48 flex flex-col items-center justify-center",
              "bg-gradient-to-br from-primary to-primary/70", // Gradient background
              "border-4 border-white/30", // Light border for pop
              "shadow-2xl", // More prominent shadow
              "hover:scale-105 hover:shadow-[0_0_35px_10px_hsla(var(--primary),0.6)]", // Scale and enhanced glow on hover
              "focus:outline-none focus:ring-4 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background",
              "transition-all duration-300 ease-in-out" // Smooth transitions
            )}
            aria-label="Quick-Check Your Meal"
          >
            <span className="text-xl font-semibold leading-tight mt-1">Quick-Check</span>
            <Image
              src="/Gutcheck_logo.png"
              alt="GutCheck Logo"
              width={80} 
              height={80}
              className="object-contain my-1" // Adjusted margin
              priority
            />
            <span className="text-lg font-medium leading-tight mb-1">Your Meal</span>
          </button>
          {/* Removed the h1 that was previously under the button */}
        </div>
      </main>

      {lastLoggedItem && !isSheetOpen && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce z-10"
          onClick={() => onSheetOpenChange(true)}
        >
          <ChevronUp className="h-6 w-6 text-muted-foreground/70 animate-neon-chevron-pulse" />
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
