
'use client';

import { useState } from 'react';
import Image from 'next/image'; // Added Image import
import { ChevronUp } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import { APP_VERSION } from '@/components/shared/Navbar'; 
import Navbar from '@/components/shared/Navbar';

interface GuestHomePageProps {
  onLogFoodClick: () => void;
  lastLoggedItem: LoggedFoodItem | null;
  isSheetOpen: boolean;
  onSheetOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onSheetOpenChange,
  onSetFeedback,
  onRemoveItem,
  isLoadingAiForItem,
}: GuestHomePageProps) {

  const handleMainButtonClick = () => {
    onLogFoodClick();
  };
  
  return (
    <div className="bg-calo-green text-white min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} />

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative text-center">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleMainButtonClick}
            className="bg-calo-green text-white rounded-full h-36 w-36 sm:h-40 sm:w-40 flex items-center justify-center border-2 border-black dark:border-white animate-pulse-glow focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 shadow-xl"
            aria-label="Check My Meal"
          >
            <Image
              src="/Gutcheck_logo.png" 
              alt="GutCheck Logo"
              width={80} 
              height={80} 
              className="object-contain" // Ensures the logo fits well
            />
          </button>
          <span className="text-2xl sm:text-3xl font-semibold text-white font-headline">
            GutCheck
          </span>
        </div>
      </main>

      {lastLoggedItem && !isSheetOpen && (
         <div 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce z-10"
            onClick={() => onSheetOpenChange(true)}
          >
            <ChevronUp className="h-6 w-6 text-white/70" />
            <span className="text-xs text-white/70">View Last Entry</span>
        </div>
      )}
      
      <p className="text-xs text-white/70 text-center pb-2 fixed bottom-0 left-1/2 -translate-x-1/2">
        {APP_VERSION}
      </p>

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
