
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GuestLogFoodDialog from './GuestLogFoodDialog';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import { APP_VERSION } from '@/components/shared/Navbar'; // Import APP_VERSION

interface GuestHomePageProps {
  onLogFoodClick: () => void;
  isLogFoodDialogOpen: boolean;
  onLogFoodDialogChange: (isOpen: boolean) => void;
  onGuestLogFoodSubmit: (description: string) => void;
  lastLoggedItem: LoggedFoodItem | null;
}

const APP_NAME = "GutCheck"; // As per Navbar

export default function GuestHomePage({
  onLogFoodClick,
  isLogFoodDialogOpen,
  onLogFoodDialogChange,
  onGuestLogFoodSubmit,
  lastLoggedItem,
}: GuestHomePageProps) {
  const [mainButtonText, setMainButtonText] = useState('Log My Food');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleMainButtonClick = () => {
    setMainButtonText('What did you eat?');
    onLogFoodClick();
  };

  const handleDialogChange = (isOpen: boolean) => {
    onLogFoodDialogChange(isOpen);
    if (!isOpen) {
      setMainButtonText('Log My Food'); // Reset button text when dialog closes
    }
  };

  return (
    <div className="bg-calo-green text-white min-h-screen flex flex-col items-center justify-between p-4 relative font-body antialiased">
      {/* Header - Logo and App Name */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <LifeBuoy className="h-12 w-12 text-white mb-1" />
        <span className="text-3xl font-bold font-headline">{APP_NAME}</span>
      </div>

      {/* Main Content - Centered Button */}
      <div className="flex-grow flex items-center justify-center w-full">
        <Button
          onClick={handleMainButtonClick}
          className="bg-white text-calo-green text-xl font-semibold rounded-full h-16 w-4/5 max-w-xs shadow-lg animate-pulse-glow hover:bg-gray-50 focus:ring-4 focus:ring-green-300"
          style={{
            boxShadow: '0 4px 14px 0 rgba(39, 174, 96, 0.3)', // Softer green shadow
          }}
        >
          {mainButtonText}
        </Button>
      </div>

      {/* Swipe-up Area Teaser */}
      {!isSheetOpen && lastLoggedItem && (
         <div 
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce"
            onClick={() => setIsSheetOpen(true)}
          >
            <ChevronUp className="h-6 w-6 text-white/70" />
            <span className="text-xs text-white/70">View Last Entry</span>
        </div>
      )}


      {/* CTA Box */}
      <div className="w-full max-w-md p-5 mb-3 bg-white rounded-xl shadow-2xl">
        <p className="text-calo-green text-center text-lg font-medium mb-3">
          Want to save your food history and get trend insights?
        </p>
        <Button asChild className="w-full bg-calo-green text-white hover:bg-green-700 rounded-lg text-md h-12">
          <Link href="/signup">Register Now</Link>
        </Button>
      </div>
      
      {/* Version Number */}
      <p className="text-xs text-white/70 absolute bottom-2 left-1/2 -translate-x-1/2">
        {APP_VERSION}
      </p>

      <GuestLogFoodDialog
        isOpen={isLogFoodDialogOpen}
        onOpenChange={handleDialogChange}
        onSubmit={onGuestLogFoodSubmit}
      />

      <GuestLastLogSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        lastLoggedItem={lastLoggedItem}
      />
    </div>
  );
}

    