
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Utensils } from 'lucide-react';
import type { LoggedFoodItem } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';

interface GuestLastLogSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lastLoggedItem: LoggedFoodItem | null;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAi: boolean;
}

export default function GuestLastLogSheet({
  isOpen,
  onOpenChange,
  lastLoggedItem,
  onSetFeedback,
  onRemoveItem,
  isLoadingAi,
}: GuestLastLogSheetProps) {

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] flex flex-col p-0 bg-calo-green text-white border-t-2 border-white/20 rounded-t-2xl shadow-2xl"
        onInteractOutside={(e) => onOpenChange(false)}
      >
        <SheetHeader className="p-4 border-b border-white/20">
          <SheetTitle className="text-xl font-semibold text-white text-center font-headline">Last Checked Meal</SheetTitle>
          <SheetClose className="absolute right-3 top-3 text-white hover:text-gray-200" />
        </SheetHeader>
        
        <div className="flex-grow p-4 overflow-y-auto space-y-3">
          {lastLoggedItem ? (
            <TimelineFoodCard
              item={lastLoggedItem}
              isLoadingAi={isLoadingAi}
              isGuestView={true} // Key prop to trigger guest-specific rendering in TimelineFoodCard
              // Feedback and remove handlers are omitted for guest view as per new request
            />
          ) : (
            <div className="text-center py-12 text-white/80">
              <Utensils className="mx-auto h-12 w-12 text-white/60 mb-3" />
              <p className="text-lg">No meal checked yet.</p>
              <p className="text-sm">Tap "Check My Meal" to see your entry here.</p>
            </div>
          )}
          <p className="text-white/85 text-center text-sm pt-3 px-2">
            Sign in with Google to save your food history, track trends, and view all your entries.
          </p>
        </div>
         <SheetFooter className="p-3 border-t border-white/20 sticky bottom-0 bg-calo-green">
            <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="w-full text-white border-white/50 hover:bg-white/10 hover:text-white"
            >
                Close
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
