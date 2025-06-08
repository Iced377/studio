
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp, UserPlus, Heart } from 'lucide-react'; // Added UserPlus, Heart
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link'; // Added Link
import { Button } from '@/components/ui/button'; // Added Button

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
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };

  const guestHeroButtons = (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-8 mb-10">
      <button
        onClick={handleMainButtonClick}
        className={cn(
          "rounded-full h-40 w-40 sm:h-44 sm:w-44 flex flex-col items-center justify-center text-center",
          "bg-gradient-to-br from-primary to-primary/70",
          "border-4 border-white/30",
          "drop-shadow-xl",
          "hover:scale-105 hover:shadow-[0_0_30px_8px_hsla(var(--primary),0.5)]",
          "focus:outline-none focus:ring-4 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background",
          "transition-all duration-300 ease-in-out group"
        )}
        aria-label="Quick-Check Your Meal"
      >
        <Image
          src="/Gutcheck_logo.png"
          alt="GutCheck Logo"
          width={100}
          height={100}
          className="object-contain mb-1"
          priority
        />
        <span className="text-xs font-semibold text-white mt-0.5 group-hover:scale-105 transition-transform">
          <span className="text-primary-foreground">Quick-Check</span>
          <br />
          <span className="text-primary-foreground opacity-90">Your Meal</span>
        </span>
      </button>

      <Link href="/signup" legacyBehavior>
        <a
          className={cn(
            "rounded-full h-40 w-40 sm:h-44 sm:w-44 flex flex-col items-center justify-center text-center",
            "bg-gradient-to-br from-green-500 to-green-600", // Using a distinct green for join button
            "border-4 border-white/30",
            "drop-shadow-xl",
            "hover:scale-105 hover:shadow-[0_0_30px_8px_rgba(34,197,94,0.5)]", // Adjusted shadow color for green
            "focus:outline-none focus:ring-4 focus:ring-green-500/40 focus:ring-offset-2 focus:ring-offset-background",
            "transition-all duration-300 ease-in-out group"
          )}
          aria-label="Join the Beta"
        >
          <UserPlus className="h-12 w-12 text-white mb-1" />
          <span className="text-xs font-semibold text-white mt-0.5 group-hover:scale-105 transition-transform">
            <span className="text-white">Join the Beta</span>
            <br />
            <span className="text-white opacity-90">Sign Up Free</span>
          </span>
        </a>
      </Link>
    </div>
  );

  const guestJoinBetaMessage = (
    <div className="container mx-auto px-4"> {/* Removed bg-primary/10 and text-center for section */}
      <Heart className="h-16 w-16 text-primary mx-auto mb-6" />
      <h2 className="text-3xl sm:text-4xl font-bold mb-6 font-headline text-center">Become a GutCheck Pioneer!</h2>
      <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8 text-center">
        You're invited to be part of something special! By joining our beta, you get early access and a unique chance to shape an app designed to truly help. Your feedback will directly influence features and make GutCheck the best it can be. Let's build a healthier future, together!
      </p>
      <div className="text-center"> {/* Centering the button */}
        <Button size="lg" variant="default" className="text-lg px-8 py-6 bg-primary hover:bg-primary/80 text-primary-foreground" asChild>
          <Link href="/signup">Sign In / Sign Up to Join</Link>
        </Button>
      </div>
    </div>
  );


  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} />

      <LandingPageClientContent
        heroActionContent={guestHeroButtons}
        showHeroCTAButton={false} // Hide default "Get Started Free" as we have custom buttons
        finalCTAMessage={guestJoinBetaMessage}
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
