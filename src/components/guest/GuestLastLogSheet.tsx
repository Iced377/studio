
'use client';

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { Utensils, UserPlus } from 'lucide-react';
import type { LoggedFoodItem } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import { cn } from "@/lib/utils";

interface GuestButtonScheme {
  id: string;
  base: string;
  border: string;
  hover: string;
  focusRing: string;
  glowRgb: string;
}

interface GuestLastLogSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lastLoggedItem: LoggedFoodItem | null;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAi: boolean;
  activeColorScheme?: GuestButtonScheme; // Make optional for safety, though it should be passed
}

export default function GuestLastLogSheet({
  isOpen,
  onOpenChange,
  lastLoggedItem,
  onSetFeedback,
  onRemoveItem,
  isLoadingAi,
  activeColorScheme,
}: GuestLastLogSheetProps) {

  const buttonClasses = activeColorScheme
    ? cn(
        "h-10 px-4 py-2 text-white text-sm", // Base size and text
        activeColorScheme.base,
        activeColorScheme.border,
        activeColorScheme.hover
      )
    : cn(buttonVariants({ variant: "default" }), "w-full max-w-xs mx-auto"); // Fallback

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] sm:h-[75vh] flex flex-col p-0 bg-card text-card-foreground border-t-2 border-border rounded-t-2xl shadow-2xl"
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
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-lg">No meal checked yet.</p>
              <p className="text-sm">Tap "Check My Meal" to see your entry here.</p>
            </div>
          )}
          <div className="text-center pt-6 px-2 space-y-3">
             <Link
              href="/login"
              className={buttonClasses}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Sign In / Sign Up
            </Link>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ready to supercharge your gut journey? 🚀 Sign up to save your meals, spot patterns, and unlock personalized insights! Your future self (and tummy) will thank you! 😉
            </p>
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
