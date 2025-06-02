
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetTitle, SheetDescription, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Navbar from "@/components/shared/Navbar"
import type { TimelineEntry, UserProfile, DailyNutritionSummary, DailyFodmapCount } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import DailyTotalsCard from '@/components/insights/DailyTotalsCard'; // Re-used for nutrition
import { Flame, Beef, Wheat, Droplet, Utensils, CircleAlert, CircleCheck, CircleHelp, BarChart3 } from 'lucide-react';

interface PremiumDashboardSheetProps {
  children: React.ReactNode; // For the trigger button
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  timelineEntries: TimelineEntry[];
  dailyNutritionSummary: DailyNutritionSummary;
  dailyFodmapCount: DailyFodmapCount;
  isLoadingAi: Record<string, boolean>;
  onMarkAsSafe: (foodItem: any) => void;
  onRemoveTimelineEntry: (entryId: string) => void;
  onLogSymptomsForFood: (foodItemId?: string) => void;
  onUpgradeClick: () => void;
  onEditIngredients?: (item: any) => void;
}

export default function PremiumDashboardSheet({
  children,
  isOpen,
  onOpenChange,
  userProfile,
  timelineEntries,
  dailyNutritionSummary,
  dailyFodmapCount,
  isLoadingAi,
  onMarkAsSafe,
  onRemoveTimelineEntry,
  onLogSymptomsForFood,
  onUpgradeClick,
  onEditIngredients
}: PremiumDashboardSheetProps) {

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 bg-background text-foreground border-t-2 border-border">
        <SheetHeader className="p-0">
          {/* Navbar integration for Profile, Settings, Upgrade status */}
          <SheetTitle className="sr-only">Main Dashboard and Timeline</SheetTitle> {/* Visually hidden title for accessibility */}
          <Navbar onUpgradeClick={onUpgradeClick} isPremium={userProfile.premium} />
        </SheetHeader>

        <div className="border-b border-border/50 py-3 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="flex flex-col items-center">
                  <Flame className="h-5 w-5 text-orange-400 mb-0.5" />
                  <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.calories)}</p>
                  <p className="text-xs text-muted-foreground">KCAL</p>
                </div>
                <div className="flex flex-col items-center">
                  <Beef className="h-5 w-5 text-red-400 mb-0.5" />
                  <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.protein)}g</p>
                  <p className="text-xs text-muted-foreground">PROTEIN</p>
                </div>
                <div className="flex flex-col items-center">
                  <Wheat className="h-5 w-5 text-yellow-400 mb-0.5" />
                  <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.carbs)}g</p>
                  <p className="text-xs text-muted-foreground">CARBS</p>
                </div>
                <div className="flex flex-col items-center">
                  <Droplet className="h-5 w-5 text-blue-400 mb-0.5" />
                  <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.fat)}g</p>
                  <p className="text-xs text-muted-foreground">FAT</p>
                </div>
            </div>
            <div className="mt-2 flex justify-center items-center gap-4">
                <div className="flex items-center text-xs text-muted-foreground">
                    <CircleCheck className="h-4 w-4 text-green-500 mr-1" /> Low: {dailyFodmapCount.green}
                </div>
                 <div className="flex items-center text-xs text-muted-foreground">
                    <CircleAlert className="h-4 w-4 text-yellow-500 mr-1" /> Mod: {dailyFodmapCount.yellow}
                </div>
                 <div className="flex items-center text-xs text-muted-foreground">
                    <CircleHelp className="h-4 w-4 text-red-500 mr-1" /> High: {dailyFodmapCount.red}
                </div>
            </div>
        </div>
        
        <ScrollArea className="flex-grow p-4">
          {timelineEntries.length === 0 && !Object.values(isLoadingAi).some(Boolean) && (
            <div className="text-center py-12">
              <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold font-headline mb-2 text-foreground">Timeline is Empty</h2>
              <p className="text-muted-foreground">Log food or symptoms using the central button.</p>
            </div>
          )}
          <div className="space-y-4">
            {timelineEntries.map(entry => {
              if (entry.entryType === 'food') {
                return (
                  <TimelineFoodCard
                    key={entry.id}
                    item={entry}
                    onMarkAsSafe={onMarkAsSafe}
                    onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                    onLogSymptoms={() => onLogSymptomsForFood(entry.id)}
                    isSafeFood={userProfile.safeFoods.some(sf => sf.name === entry.name && sf.ingredients === entry.ingredients && sf.portionSize === entry.portionSize && sf.portionUnit === entry.portionUnit)}
                    isLoadingAi={!!isLoadingAi[entry.id]}
                    onEditIngredients={onEditIngredients} // Pass down the edit handler
                  />
                );
              }
              if (entry.entryType === 'symptom') {
                return (
                  <TimelineSymptomCard
                    key={entry.id}
                    item={entry}
                    onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                  />
                );
              }
              return null;
            })}
          </div>
        </ScrollArea>
         <SheetFooter className="p-2 border-t border-border">
            <SheetClose asChild>
                <Button variant="outline" className="w-full">Close Dashboard</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
