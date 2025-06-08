
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp } from 'lucide-react';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent'; // Import the main content
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onOpenChange,
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
    // On guest page, always ensure light mode is forced if dark mode was somehow set.
    // This keeps the Calo-like aesthetic.
    // Update: ThemeProvider now defaults to light unless system/localStorage prefers dark.
    // This effect might be redundant or could conflict if we want system preference for guests too.
    // For now, respecting the ThemeProvider's logic.
    // If a strict "guest is always light" rule is needed, ThemeProvider logic would need adjustment
    // or this component could directly manipulate document.documentElement.classList.
    if (isDarkMode) {
        document.documentElement.classList.remove('dark'); // Example: Force light for guest
    }
  }, [isDarkMode]);

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };

  const quickCheckButton = (
    <button
      onClick={handleMainButtonClick}
      className={cn(
        "rounded-full h-40 w-40 sm:h-48 sm:w-48 flex flex-col items-center justify-center text-center",
        "bg-gradient-to-br from-primary to-primary/70",
        "border-4 border-white/30",
        "drop-shadow-2xl",
        "hover:scale-105 hover:shadow-[0_0_35px_10px_hsla(var(--primary),0.6)]",
        "focus:outline-none focus:ring-4 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background",
        "transition-all duration-300 ease-in-out group" // Added group for text styling
      )}
      aria-label="Quick-Check Your Meal"
    >
      <Image
        src="/Gutcheck_logo.png"
        alt="GutCheck Logo"
        width={120}
        height={120}
        className="object-contain mb-1" // Added margin-bottom
        priority
      />
      <span className="text-sm font-semibold text-white mt-1 group-hover:scale-105 transition-transform">
        <span className="text-primary-foreground">Quick-Check</span>
        <br />
        <span className="text-primary-foreground opacity-90">Your Meal</span>
      </span>
    </button>
  );


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} />

      <LandingPageClientContent
        heroActionContent={quickCheckButton}
        showHeroCTAButton={true} // This will show the "Get Started Free" button from LandingPageClientContent
      />

      {lastLoggedItem && !isSheetOpen && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce z-10"
          onClick={() => onOpenChange(true)}
        >
          <ChevronUp className="h-6 w-6 text-muted-foreground/70 animate-neon-chevron-pulse" />
          <span className="text-xs text-muted-foreground/70">Swipe Up or Tap to View the Meal</span>
        </div>
      )}

      <GuestLastLogSheet
        isOpen={isSheetOpen}
        onOpenChange={onOpenChange}
        lastLoggedItem={lastLoggedItem}
        onSetFeedback={onSetFeedback}
        onRemoveItem={onRemoveItem}
        isLoadingAi={isLoadingAiForItem}
      />
    </div>
  );
}
