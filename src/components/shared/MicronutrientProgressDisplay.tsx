
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, MicronutrientDetail, SingleMicronutrientProgress, UserMicronutrientProgress } from '@/types';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import {
  Atom, Sparkles, Bone, Activity, PersonStanding, Eye, ShieldCheck, Droplet, Wind, Brain, Baby, Heart, ShieldQuestion, Network, Target, HelpCircle, Nut
} from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface MicronutrientProgressDisplayProps {
  userId?: string | null;
}

const RepresentativeLucideIcons: { [key: string]: React.ElementType } = {
  Atom, Sparkles, HelpCircle, Nut,
  Iron: Wind, Calcium: Bone, Phosphorus: Bone, Magnesium: Activity, Sodium: Droplet, Potassium: Droplet,
  Chloride: Droplet, Zinc: PersonStanding, Copper: Network, Manganese: Bone, Selenium: ShieldCheck,
  Iodine: Brain, Chromium: Target, VitaminA: Eye, VitaminC: ShieldCheck, VitaminD: ShieldCheck,
  VitaminE: ShieldQuestion, VitaminK: Heart, VitaminB1: Brain, VitaminB2: Activity, VitaminB3: Activity,
  VitaminB5: Activity, VitaminB6: Brain, VitaminB12: Brain, Biotin: Activity, Folate: Baby,
  // AI functional names
  Bone: Bone, Activity: Activity, PersonStanding: PersonStanding, Eye: Eye, ShieldCheck: ShieldCheck,
  Droplet: Droplet, Wind: Wind, Brain: Brain, Baby: Baby, Heart: Heart, ShieldQuestion: ShieldQuestion,
  Network: Network, Target: Target,
};

const KEY_MICRONUTRIENTS_CONFIG: Array<{ name: string; targetDV?: number }> = [
  { name: 'Vitamin A', targetDV: 100 }, { name: 'Vitamin C', targetDV: 100 }, { name: 'Vitamin D', targetDV: 100 },
  { name: 'Vitamin E', targetDV: 100 }, { name: 'Vitamin K', targetDV: 100 }, { name: 'Vitamin B1', targetDV: 100 }, // Thiamin
  { name: 'Vitamin B2', targetDV: 100 }, // Riboflavin
  { name: 'Vitamin B3', targetDV: 100 }, // Niacin
  { name: 'Vitamin B6', targetDV: 100 }, { name: 'Folate', targetDV: 100 }, { name: 'Vitamin B12', targetDV: 100 },
  { name: 'Calcium', targetDV: 100 }, { name: 'Iron', targetDV: 100 }, { name: 'Magnesium', targetDV: 100 },
  { name: 'Zinc', targetDV: 100 }, { name: 'Potassium', targetDV: 100 }, { name: 'Selenium', targetDV: 100 },
  { name: 'Iodine', targetDV: 100 }, { name: 'Phosphorus', targetDV: 100}, { name: 'Sodium', targetDV: 2300 } // Note: Sodium target is often in mg, not %DV easily. For simplicity, using 100 for display.
];


export default function MicronutrientProgressDisplay({ userId }: MicronutrientProgressDisplayProps) {
  const [progressData, setProgressData] = useState<UserMicronutrientProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgressData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const entriesColRef = collection(db, 'users', userId, 'timelineEntries');
        const q = query(
          entriesColRef,
          where('timestamp', '>=', Timestamp.fromDate(todayStart)),
          where('timestamp', '<=', Timestamp.fromDate(todayEnd))
        );

        const querySnapshot = await getDocs(q);
        const fetchedEntries: TimelineEntry[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            timestamp: (data.timestamp as Timestamp).toDate(),
          } as TimelineEntry;
        });

        const foodItemsToday = fetchedEntries.filter(
          (entry): entry is LoggedFoodItem => entry.entryType === 'food' || entry.entryType === 'manual_macro'
        );

        const dailyTotals: UserMicronutrientProgress = {};

        KEY_MICRONUTRIENTS_CONFIG.forEach(keyMicro => {
          dailyTotals[keyMicro.name] = {
            name: keyMicro.name,
            achievedDV: 0,
            icon: RepresentativeLucideIcons[keyMicro.name] || Atom, // Default icon
            targetDV: keyMicro.targetDV || 100,
          };
        });
        
        foodItemsToday.forEach(item => {
          const microsInfo = item.fodmapData?.micronutrientsInfo;
          if (microsInfo) {
            const allMicrosFromItem: MicronutrientDetail[] = [
              ...(microsInfo.notable || []),
              ...(microsInfo.fullList || []),
            ];
            
            allMicrosFromItem.forEach(microDetail => {
              if (dailyTotals[microDetail.name] && microDetail.dailyValuePercent !== undefined) {
                dailyTotals[microDetail.name].achievedDV += microDetail.dailyValuePercent;
                
                const foundIconName = microDetail.iconName && RepresentativeLucideIcons[microDetail.iconName];
                const foundIconByName = RepresentativeLucideIcons[microDetail.name];

                if (foundIconName) {
                   dailyTotals[microDetail.name].icon = foundIconName;
                } else if (foundIconByName) {
                   dailyTotals[microDetail.name].icon = foundIconByName;
                }
                // else it keeps the default from KEY_MICRONUTRIENTS_CONFIG
              }
            });
          }
        });
        setProgressData(dailyTotals);
      } catch (err) {
        console.error("Error fetching micronutrient data:", err);
        setError("Could not load micronutrient progress.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading progress...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive p-4 text-center">{error}</p>;
  }

  if (!progressData || Object.keys(progressData).length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No micronutrient data logged for today yet.</p>;
  }

  const sortedMicronutrients = Object.values(progressData).sort((a, b) => {
    // Sort by name for consistent order
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-1">
      <h3 className="text-lg font-semibold mb-3 px-3 text-foreground">Today's Micronutrient Goals</h3>
      <ScrollArea className="h-[350px] pr-3">
        <div className="space-y-3">
          {sortedMicronutrients.map((micro) => {
            const IconComponent = micro.icon || Atom;
            const percentage = micro.targetDV ? Math.min(100, (micro.achievedDV / micro.targetDV) * 100) : Math.min(100, micro.achievedDV);
            const progressValue = isNaN(percentage) ? 0 : percentage;
            const displayDV = Math.round(micro.achievedDV);

            return (
              <div key={micro.name} className="px-1">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center text-sm text-foreground">
                    <IconComponent className={cn("h-4 w-4 mr-2", micro.achievedDV >= (micro.targetDV || 100) ? 'text-green-500' : 'text-muted-foreground')} />
                    <span>{micro.name}</span>
                  </div>
                  <span className={cn("text-xs font-medium", micro.achievedDV >= (micro.targetDV || 100) ? 'text-green-500' : 'text-muted-foreground')}>
                    {displayDV}% <span className="text-xs text-muted-foreground/80">of {micro.targetDV || 100}% DV</span>
                  </span>
                </div>
                <Progress value={progressValue} className={cn("h-2", progressValue >= 100 ? "[&>div]:bg-green-500" : "")} />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
