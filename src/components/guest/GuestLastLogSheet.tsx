
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Utensils } from 'lucide-react';
import type { LoggedFoodItem } from '@/types';
import Link from "next/link"; // Import Link
import { formatDistanceToNow } from 'date-fns';

interface GuestLastLogSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lastLoggedItem: LoggedFoodItem | null;
}

export default function GuestLastLogSheet({
  isOpen,
  onOpenChange,
  lastLoggedItem,
}: GuestLastLogSheetProps) {

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[60vh] flex flex-col p-0 bg-white text-gray-800 border-t-2 border-gray-200 rounded-t-2xl"
        onInteractOutside={(e) => {
            // Prevent closing on drag attempts on the content itself, allow on overlay
            if ((e.target as HTMLElement).closest('[data-radix-sheet-content]')) {
              // If interacting with sheet content (e.g. scroll), do nothing
            } else {
              onOpenChange(false);
            }
          }}
        >
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="text-xl font-semibold text-calo-green text-center font-headline">Your Last Noted Meal</SheetTitle>
          <SheetClose className="absolute right-3 top-3" />
        </SheetHeader>
        
        <div className="flex-grow p-4 overflow-y-auto">
          {lastLoggedItem ? (
            <Card className="mb-4 shadow-lg border-gray-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-lg font-semibold text-calo-green">
                  {lastLoggedItem.name}
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Noted: {formatDistanceToNow(new Date(lastLoggedItem.timestamp), { addSuffix: true })}
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <p className="text-sm text-gray-600">
                  Portion: {lastLoggedItem.portionSize} {lastLoggedItem.portionUnit}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  (Details like ingredients and FODMAP analysis are available for registered users.)
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-lg">You haven't noted any meals yet.</p>
              <p className="text-sm">Tap "Log My Food" to start!</p>
            </div>
          )}

          <div className="mt-8 text-center p-4 bg-green-50 rounded-lg border border-calo-green/30">
            <p className="text-md font-medium text-calo-green mb-2">
              Unlock your full potential with GutCheck!
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Register to save your complete food log, track symptoms, get personalized AI insights, and discover your food sensitivities over time.
            </p>
            <Button asChild className="bg-calo-green text-white hover:bg-green-700 rounded-lg">
              <Link href="/signup">Register for Free</Link>
            </Button>
          </div>
        </div>
         <SheetFooter className="p-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full border-calo-green text-calo-green hover:bg-green-50">
                Close
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

    