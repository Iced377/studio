
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, MicronutrientDetail, SingleMicronutrientProgress, UserMicronutrientProgress } from '@/types';
import { Progress } from '@/components/ui/progress';
// ScrollArea import removed
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
  // Functional Icons based on nutrient name
  Iron: Wind, Calcium: Bone, Phosphorus: Bone, Magnesium: Activity, Sodium: Droplet, Potassium: Droplet,
  Chloride: Droplet, Zinc: PersonStanding, Copper: Network, Manganese: Bone, Selenium: ShieldCheck,
  Iodine: Brain, Chromium: Target, VitaminA: Eye, VitaminC: ShieldCheck, VitaminD: ShieldCheck,
  VitaminE: ShieldQuestion, VitaminK: Heart, VitaminB1: Brain, VitaminB2: Activity, VitaminB3: Activity,
  VitaminB5: Activity, VitaminB6: Brain, VitaminB12: Brain, Biotin: Activity, Folate: Baby,
  // AI-suggested functional icon names (ensure these are mapped if AI uses them)
  Bone: Bone, Activity: Activity, PersonStanding: PersonStanding, Eye: Eye, ShieldCheck: ShieldCheck,
  Droplet: Droplet, Wind: Wind, Brain: Brain, Baby: Baby, Heart: Heart, ShieldQuestion: ShieldQuestion,
  Network: Network, Target: Target,
  // Fallback / General Icons
  Atom, Sparkles, HelpCircle, Nut, 
};

const KEY_MICRONUTRIENTS_CONFIG: Array<{ name: string; targetDV?: number }> = [
  { name: 'Vitamin A', targetDV: 100 }, { name: 'Vitamin C', targetDV: 100 }, { name: 'Vitamin D', targetDV: 100 },
  { name: 'Vitamin E', targetDV: 100 }, { name: 'Vitamin K', targetDV: 100 }, { name: 'VitaminB1', targetDV: 100 }, 
  { name: 'VitaminB2', targetDV: 100 }, 
  { name: 'VitaminB3', targetDV: 100 }, 
  { name: 'VitaminB6', targetDV: 100 }, { name: 'Folate', targetDV: 100 }, { name: 'VitaminB12', targetDV: 100 },
  { name: 'Calcium', targetDV: 100 }, { name: 'Iron', targetDV: 100 }, { name: 'Magnesium', targetDV: 100 },
  { name: 'Zinc', targetDV: 100 }, { name: 'Potassium', targetDV: 100 }, { name: 'Selenium', targetDV: 100 },
  { name: 'Iodine', targetDV: 100 }, { name: 'Phosphorus', targetDV: 100}, { name: 'Sodium', targetDV: 2300 } 
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
            icon: RepresentativeLucideIcons[keyMicro.name] || Atom, 
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
                
                const iconFromAIName = microDetail.iconName ? RepresentativeLucideIcons[microDetail.iconName] : undefined;
                const iconFromNutrientName = RepresentativeLucideIcons[microDetail.name];
                
                if (iconFromAIName) {
                   dailyTotals[microDetail.name].icon = iconFromAIName;
                } else if (iconFromNutrientName) {
                   dailyTotals[microDetail.name].icon = iconFromNutrientName;
                }
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
    return a.name.localeCompare(b.name);
  });

  return (
    <div className=""> {/* Removed flex, flex-1, overflow-hidden */}
      <h3 className="text-lg font-semibold mb-3 text-foreground px-0 sm:px-1">Today's Micronutrient Goals</h3>
      {/* ScrollArea removed */}
      <div className="space-y-3"> {/* This div was previously inside ScrollArea */}
        {sortedMicronutrients.map((micro) => {
          const IconComponent = micro.icon || Atom;
          const target = micro.name === 'Sodium' ? (micro.targetDV || 2300) : (micro.targetDV || 100);
          const isSodium = micro.name === 'Sodium';
          const percentage = target ? Math.min(100, (micro.achievedDV / target) * 100) : Math.min(100, micro.achievedDV);
          
          const progressValue = isNaN(percentage) ? 0 : percentage;
          const displayDV = Math.round(micro.achievedDV);
          const displayTarget = Math.round(target);

          const isAchieved = isSodium ? micro.achievedDV <= target : micro.achievedDV >= target; 

          return (
            <div key={micro.name} className="break-words">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center text-sm text-foreground min-w-0 mr-2">
                  <IconComponent className={cn("h-4 w-4 mr-2 shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')} />
                  <span className="truncate">{micro.name}</span>
                </div>
                <span className={cn("text-xs font-medium text-right shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')}>
                  {displayDV}{isSodium ? 'mg' : '%'} 
                  <span className="text-xs text-muted-foreground/80"> of {displayTarget}{isSodium ? 'mg' : '% DV'}</span>
                </span>
              </div>
              <Progress 
                  value={isSodium ? (target > 0 ? Math.min(100, (micro.achievedDV / target) * 100) : 0) : progressValue} 
                  className={cn("h-2", 
                      isSodium ? (micro.achievedDV > target ? "[&>div]:bg-red-500" : (micro.achievedDV >= target*0.8 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")) 
                               : (progressValue >= 100 ? "[&>div]:bg-green-500" : "")
                  )} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
