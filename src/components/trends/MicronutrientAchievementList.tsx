'use client';

import type { MicronutrientAchievement } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Tally5, Atom, Sparkles, Bone, Nut, Citrus, Carrot, Beef, Leaf, Milk } from 'lucide-react'; // Added specific icons

// Mapping for icons, similar to PremiumDashboardSheet
const LucideIconsForTrends: { [key: string]: React.ElementType } = {
  Atom, Sparkles, Bone, Nut, Citrus, Carrot, Beef, Leaf, Milk,
  Iron: Atom, 
  Calcium: Bone,
  VitaminC: Citrus,
  // Add more common mappings as needed or rely on AI providing a good iconName
};

interface MicronutrientAchievementListProps {
  data: MicronutrientAchievement[];
}

export default function MicronutrientAchievementList({ data }: MicronutrientAchievementListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p>No micronutrient daily targets met in this period.</p>
        <p className="text-xs">Log more meals with detailed nutritional info to see your achievements!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-3"> {/* Adjust height as needed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((item) => {
          const IconComponent = item.iconName && LucideIconsForTrends[item.iconName] 
            ? LucideIconsForTrends[item.iconName] 
            : (LucideIconsForTrends[item.name] || Atom); // Fallback to name mapping or Atom

          return (
            <TooltipProvider key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-card-foreground/5 dark:bg-card-foreground/10 p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                           <Tally5 className="h-3.5 w-3.5 mr-1 text-green-500" /> Met on {item.achievedDays} day{item.achievedDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border-border">
                  <p>Achieved 100% Daily Value for {item.name} on {item.achievedDays} day{item.achievedDays !== 1 ? 's' : ''} in this period.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </ScrollArea>
  );
}