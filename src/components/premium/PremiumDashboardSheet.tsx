
'use client';

import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Navbar from "@/components/shared/Navbar"
import type { TimelineEntry, UserProfile, DailyNutritionSummary, LoggedFoodItem, MicronutrientDetail } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import { Flame, Beef, Wheat, Droplet, Utensils, Check, Atom, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

// Consistent with MicronutrientsIndicator
const LucideIconsForSummary: { [key: string]: React.ElementType } = {
  Atom, Sparkles, 
  Bone: require('lucide-react').Bone,
  Nut: require('lucide-react').Nut,
  Citrus: require('lucide-react').Citrus,
  Carrot: require('lucide-react').Carrot,
  BeefIcon: require('lucide-react').BeefIcon, // Note: BeefIcon is often just Beef
  LeafIcon: require('lucide-react').LeafIcon, // Note: LeafIcon is often just Leaf
  MilkIcon: require('lucide-react').MilkIcon, // Note: MilkIcon is often just Milk
  // Add more specific mappings if AI provides these keys
  Iron: Atom, // Fallback example
  Calcium: require('lucide-react').Bone, // Fallback example
  VitaminC: require('lucide-react').Citrus, // Fallback example
};


interface PremiumDashboardSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  timelineEntries: TimelineEntry[];
  dailyNutritionSummary: DailyNutritionSummary;
  // dailyFodmapCount: DailyFodmapCount; // Removed
  isLoadingAi: Record<string, boolean>;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveTimelineEntry: (entryId: string) => void;
  onLogSymptomsForFood: (foodItemId?: string) => void;
  onUpgradeClick: () => void;
  onEditIngredients?: (item: LoggedFoodItem) => void;
}

interface AchievedMicronutrient {
  name: string;
  iconName?: string;
  totalDV: number;
}

export default function PremiumDashboardSheet({
  children,
  isOpen,
  onOpenChange,
  userProfile,
  timelineEntries,
  dailyNutritionSummary,
  // dailyFodmapCount, // Removed
  isLoadingAi,
  onSetFeedback,
  onRemoveTimelineEntry,
  onLogSymptomsForFood,
  onUpgradeClick,
  onEditIngredients
}: PremiumDashboardSheetProps) {

  const achievedMicronutrients = useMemo<AchievedMicronutrient[]>(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const dailyTotals: Record<string, { totalDV: number, iconName?: string }> = {};

    timelineEntries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= todayStart && entryDate <= todayEnd) {
          const foodItem = entry as LoggedFoodItem;
          const microsInfo = foodItem.fodmapData?.micronutrientsInfo;
          if (microsInfo) {
            const allMicros: MicronutrientDetail[] = [];
            if (microsInfo.notable) allMicros.push(...microsInfo.notable);
            if (microsInfo.fullList) allMicros.push(...microsInfo.fullList);

            allMicros.forEach(micro => {
              if (micro.dailyValuePercent !== undefined) {
                if (!dailyTotals[micro.name]) {
                  dailyTotals[micro.name] = { totalDV: 0, iconName: micro.iconName };
                }
                dailyTotals[micro.name].totalDV += micro.dailyValuePercent;
                if (micro.iconName && !dailyTotals[micro.name].iconName) {
                   dailyTotals[micro.name].iconName = micro.iconName;
                }
              }
            });
          }
        }
      }
    });
    
    return Object.entries(dailyTotals)
      .filter(([, data]) => data.totalDV >= 100)
      .map(([name, data]) => ({ name, iconName: data.iconName, totalDV: data.totalDV }))
      .slice(0, 5); // Display up to 5 achieved micronutrients
  }, [timelineEntries]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 bg-background text-foreground border-t-2 border-border">
        <SheetHeader className="p-0">
          <Navbar onUpgradeClick={onUpgradeClick} isPremium={userProfile.premium} />
          <SheetTitle className="sr-only">Main Dashboard and Timeline</SheetTitle>
        </SheetHeader>

        <div className="border-b border-border/50 py-3 px-4">
            <div className="flex flex-row flex-wrap justify-around items-center gap-x-3 gap-y-2 text-center">
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
                {achievedMicronutrients.length > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                     <span className="font-medium">Targets Met:</span>
                    <TooltipProvider>
                      {achievedMicronutrients.map(micro => {
                        const IconComponent = micro.iconName && LucideIconsForSummary[micro.iconName] ? LucideIconsForSummary[micro.iconName] : Atom;
                        return (
                          <Tooltip key={micro.name}>
                            <TooltipTrigger asChild>
                              <div className="relative p-0.5">
                                <IconComponent className="h-4 w-4 text-green-500" />
                                <Check className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-green-600 bg-background rounded-full p-0.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border-border">
                              <p>{micro.name} ({Math.round(micro.totalDV)}% DV)</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                )}
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
              if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                return (
                  <TimelineFoodCard
                    key={entry.id}
                    item={entry}
                    onSetFeedback={onSetFeedback}
                    onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                    onLogSymptoms={() => onLogSymptomsForFood(entry.id)}
                    isLoadingAi={!!isLoadingAi[entry.id]}
                    onEditIngredients={onEditIngredients}
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
