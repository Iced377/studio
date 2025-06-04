
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, MicronutrientDetail, UserMicronutrientProgress } from '@/types';
import { Progress } from '@/components/ui/progress';
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
  VitaminA: Eye,
  VitaminC: ShieldCheck,
  VitaminD: ShieldCheck, // Often associated with immunity/bone health with Calcium
  VitaminE: ShieldCheck, // Antioxidant function
  VitaminK: Heart,
  Thiamin: Brain, // B1
  Riboflavin: Activity, // B2
  Niacin: Activity, // B3
  PantothenicAcid: Activity, // B5
  VitaminB6: Brain,
  Biotin: Activity, // B7
  Folate: Baby, // B9
  VitaminB12: Brain,
  Choline: Brain,

  Calcium: Bone,
  Phosphorus: Bone,
  Magnesium: Activity,
  Iron: Wind,
  Zinc: PersonStanding,
  Copper: Network,
  Manganese: Bone,
  Selenium: ShieldCheck,
  Iodine: Brain,
  Chromium: Target,
  Molybdenum: Atom, // Generic as specific function icon is less common
  Potassium: Droplet,
  Sodium: Droplet,
  Chloride: Droplet,

  // AI-suggested functional icon names (ensure these are mapped if AI uses them)
  Bone: Bone, Activity: Activity, PersonStanding: PersonStanding, Eye: Eye, ShieldCheck: ShieldCheck,
  Droplet: Droplet, Wind: Wind, Brain: Brain, Baby: Baby, Heart: Heart, ShieldQuestion: ShieldQuestion,
  Network: Network, Target: Target, Nut: Nut, // Added Nut for completeness if AI suggests it
  // Fallback / General Icons
  Atom, Sparkles, HelpCircle,
};

const KEY_MICRONUTRIENTS_CONFIG: Array<{ name: string; displayName?: string; targetDV?: number; unit?: 'mg' | '%' }> = [
  // Vitamins
  { name: 'VitaminA', displayName: 'Vitamin A', targetDV: 100, unit: '%' },
  { name: 'VitaminC', displayName: 'Vitamin C', targetDV: 100, unit: '%' },
  { name: 'VitaminD', displayName: 'Vitamin D', targetDV: 100, unit: '%' },
  { name: 'VitaminE', displayName: 'Vitamin E', targetDV: 100, unit: '%' },
  { name: 'VitaminK', displayName: 'Vitamin K', targetDV: 100, unit: '%' },
  { name: 'Thiamin', displayName: 'Thiamin (B1)', targetDV: 100, unit: '%' },
  { name: 'Riboflavin', displayName: 'Riboflavin (B2)', targetDV: 100, unit: '%' },
  { name: 'Niacin', displayName: 'Niacin (B3)', targetDV: 100, unit: '%' },
  { name: 'PantothenicAcid', displayName: 'Pantothenic Acid (B5)', targetDV: 100, unit: '%' },
  { name: 'VitaminB6', displayName: 'Vitamin B6', targetDV: 100, unit: '%' },
  { name: 'Biotin', displayName: 'Biotin (B7)', targetDV: 100, unit: '%' },
  { name: 'Folate', displayName: 'Folate (B9)', targetDV: 100, unit: '%' },
  { name: 'VitaminB12', displayName: 'Vitamin B12', targetDV: 100, unit: '%' },
  { name: 'Choline', displayName: 'Choline', targetDV: 550, unit: 'mg' }, // Choline has an AI in mg usually
  // Minerals
  { name: 'Calcium', displayName: 'Calcium', targetDV: 100, unit: '%' },
  { name: 'Phosphorus', displayName: 'Phosphorus', targetDV: 100, unit: '%' },
  { name: 'Magnesium', displayName: 'Magnesium', targetDV: 100, unit: '%' },
  { name: 'Iron', displayName: 'Iron', targetDV: 100, unit: '%' },
  { name: 'Zinc', displayName: 'Zinc', targetDV: 100, unit: '%' },
  { name: 'Copper', displayName: 'Copper', targetDV: 100, unit: '%' },
  { name: 'Manganese', displayName: 'Manganese', targetDV: 100, unit: '%' },
  { name: 'Selenium', displayName: 'Selenium', targetDV: 100, unit: '%' },
  { name: 'Iodine', displayName: 'Iodine', targetDV: 100, unit: '%' },
  { name: 'Chromium', displayName: 'Chromium', targetDV: 100, unit: '%' },
  { name: 'Molybdenum', displayName: 'Molybdenum', targetDV: 100, unit: '%' },
  { name: 'Potassium', displayName: 'Potassium', targetDV: 100, unit: '%' }, // Often underconsumed, DV usually in mg, but AI gives %
  { name: 'Sodium', displayName: 'Sodium', targetDV: 2300, unit: 'mg' }, // Target is upper limit
  { name: 'Chloride', displayName: 'Chloride', targetDV: 100, unit: '%' },
];


export default function MicronutrientProgressDisplay({ userId }: MicronutrientProgressDisplayProps) {
  const [progressData, setProgressData] = useState<UserMicronutrientProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgressData(null);
      setIsLoading(false);
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
            name: keyMicro.displayName || keyMicro.name,
            achievedValue: 0, // Use achievedValue to store raw amount if unit is 'mg'
            achievedDV: 0,    // Use achievedDV for percentage if unit is '%'
            icon: RepresentativeLucideIcons[keyMicro.name] || Atom,
            targetDV: keyMicro.targetDV || (keyMicro.unit === 'mg' ? 0 : 100), // Target for % or mg
            unit: keyMicro.unit || '%',
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
              // Find the config entry that matches the AI's nutrient name
              const configEntry = KEY_MICRONUTRIENTS_CONFIG.find(km => 
                km.name.toLowerCase() === microDetail.name.toLowerCase() || 
                (km.displayName && km.displayName.toLowerCase() === microDetail.name.toLowerCase())
              );

              if (configEntry && dailyTotals[configEntry.name]) {
                const targetEntry = dailyTotals[configEntry.name];
                if (targetEntry.unit === 'mg' && microDetail.amount) {
                  const amountValue = parseFloat(microDetail.amount); // Assumes AI returns amount like "10 mg"
                  if (!isNaN(amountValue)) {
                    targetEntry.achievedValue = (targetEntry.achievedValue || 0) + amountValue;
                  }
                } else if (targetEntry.unit === '%' && microDetail.dailyValuePercent !== undefined) {
                  targetEntry.achievedDV += microDetail.dailyValuePercent;
                }
                
                const iconFromAIName = microDetail.iconName ? RepresentativeLucideIcons[microDetail.iconName] : undefined;
                const iconFromNutrientNameKey = RepresentativeLucideIcons[configEntry.name]; // Use config key
                
                if (iconFromAIName) {
                   targetEntry.icon = iconFromAIName;
                } else if (iconFromNutrientNameKey) {
                   targetEntry.icon = iconFromNutrientNameKey;
                }
              }
            });
          }
        });
        setProgressData(dailyTotals);
      } catch (err) {
        console.error("Error fetching micronutrient data:", err);
        setError("Could not load micronutrient progress. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground mt-4">Loading micronutrient progress...</p>
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
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {sortedMicronutrients.map((micro) => {
          const IconComponent = micro.icon || Atom;
          const target = micro.targetDV;
          const isSodium = micro.name.toLowerCase() === 'sodium';
          
          let percentage: number;
          let displayAchieved: string;
          let displayTarget: string;

          if (micro.unit === 'mg') {
            percentage = target > 0 ? Math.min(100, ((micro.achievedValue || 0) / target) * 100) : 0;
            displayAchieved = `${Math.round(micro.achievedValue || 0)}mg`;
            displayTarget = `${Math.round(target)}mg`;
          } else { // unit is '%'
            percentage = Math.min(100, micro.achievedDV);
            displayAchieved = `${Math.round(micro.achievedDV)}%`;
            displayTarget = `${Math.round(target)}% DV`;
          }
          
          const progressValue = isNaN(percentage) ? 0 : percentage;
          const isAchieved = isSodium ? (micro.achievedValue || 0) <= target : progressValue >= 100;

          return (
            <div key={micro.name} className="break-words">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center text-sm text-foreground min-w-0 mr-2">
                  <IconComponent className={cn("h-4 w-4 mr-2 shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')} />
                  <span className="truncate font-medium">{micro.name}</span>
                </div>
                <span className={cn("text-xs font-medium text-right shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')}>
                  {displayAchieved}
                  <span className="text-xs text-muted-foreground/80"> / {displayTarget}</span>
                </span>
              </div>
              <Progress
                  value={isSodium ? (target > 0 ? Math.min(100, ((micro.achievedValue || 0) / target) * 100) : 0) : progressValue}
                  className={cn("h-2.5",
                      isSodium 
                        ? ((micro.achievedValue || 0) > target ? "[&>div]:bg-red-500" : ((micro.achievedValue || 0) >= target * 0.8 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"))
                        : (progressValue >= 100 ? "[&>div]:bg-green-500" : (progressValue >=75 ? "[&>div]:bg-yellow-500" : ""))
                  )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
