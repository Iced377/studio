'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button, buttonVariants } from "@/components/ui/button" // Import buttonVariants
import { Utensils } from 'lucide-react';
import type { LoggedFoodItem } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import { cn } from "@/lib/utils";
import Link from "next/link"; // Import Link

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
        className="h-[75vh] flex flex-col p-0 bg-card text-card-foreground border-t-2 border-border rounded-t-2xl shadow-2xl"
        onInteractOutside={(e) => onOpenChange(false)}
      >
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-xl font-semibold text-foreground text-center font-headline">Last Checked Meal</SheetTitle>
          <SheetClose className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" />
        </SheetHeader>

        <div className="flex-grow p-4 overflow-y-auto space-y-3">
          {lastLoggedItem ? (
            <TimelineFoodCard
              item={lastLoggedItem}
              isLoadingAi={isLoadingAi}
              isGuestView={true}
              // Feedback and remove handlers are not used by guest view for direct interaction on sheet
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-lg">No meal checked yet.</p>
              <p className="text-sm">Tap "Check My Meal" to see your entry here.</p>
            </div>
          )}
          <div className="text-center pt-3 px-2">
             <Link 
              href="/login" 
              className={cn(buttonVariants({ variant: "default" }), "w-full max-w-xs mx-auto")} // Styled as a default button
            >
              Sign In or Sign Up to save history & track trends!
            </Link>
          </div>
        </div>
         <SheetFooter className="p-3 border-t border-border sticky bottom-0 bg-card">
            <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
            >
                Close
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
