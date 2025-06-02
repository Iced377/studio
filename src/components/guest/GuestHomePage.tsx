
'use client';

import { useState } from 'react';
import { LifeBuoy, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import { APP_VERSION } from '@/components/shared/Navbar'; 
import Navbar from '@/components/shared/Navbar'; // Import Navbar

interface GuestHomePageProps {
  onLogFoodClick: () => void;
  lastLoggedItem: LoggedFoodItem | null;
  isSheetOpen: boolean;
  onSheetOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}

const APP_NAME = "GutCheck";

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onSheetOpenChange,
  onSetFeedback,
  onRemoveItem,
  isLoadingAiForItem,
}: GuestHomePageProps) {
  const [mainButtonText, setMainButtonText] = useState('Log My Food');

  const handleMainButtonClick = () => {
    setMainButtonText('What did you eat?'); // This text change might be too quick if dialog opens fast
    onLogFoodClick();
  };
  
  // Reset button text if dialog is closed without submission (handled by onLogFoodDialogChange in page.tsx)
  // For internal consistency, if onLogFoodClick directly opens dialog, that dialog's onOpenChange should reset.

  return (
    <div className="bg-calo-green text-white min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} /> {/* Guest-styled Navbar */}

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative text-center">
        <Button
          onClick={handleMainButtonClick}
          className="bg-white text-calo-green text-xl font-semibold rounded-full h-16 w-4/5 max-w-xs shadow-lg animate-pulse-glow hover:bg-gray-50 focus:ring-4 focus:ring-green-300"
          style={{
            boxShadow: '0 4px 14px 0 rgba(39, 174, 96, 0.3)', 
          }}
        >
          {mainButtonText}
        </Button>
      </main>

      {/* Teaser for the swipe-up panel, only if there's an item and panel is closed */}
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
