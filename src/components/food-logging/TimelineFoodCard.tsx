'use client';

import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Trash2, CheckCheck, ListChecks, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineFoodCardProps {
  item: LoggedFoodItem;
  onMarkAsSafe: (foodItem: LoggedFoodItem) => void;
  onRemoveItem: (itemId: string) => void;
  onLogSymptoms: (foodItemId?: string) => void;
  isSafeFood: boolean;
  isLoadingAi: boolean;
}

export default function TimelineFoodCard({ 
    item, 
    onMarkAsSafe, 
    onRemoveItem, 
    onLogSymptoms,
    isSafeFood,
    isLoadingAi
}: TimelineFoodCardProps) {

  const handleMarkAsSafeClick = () => {
    if (item.fodmapData) {
      onMarkAsSafe(item);
    } else {
      console.warn("FODMAP data not available to mark as safe for item:", item.name);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  return (
    <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden bg-card border-border">
      {isLoadingAi && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold font-headline text-foreground">{item.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Portion: {item.portionSize} {item.portionUnit}</p>
          </div>
          {item.fodmapData && <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />}
          {!item.fodmapData && !isLoadingAi && <FodmapIndicator score={undefined} reason="FODMAP analysis pending or failed." />}
        </div>
        <p className="text-xs text-muted-foreground break-words pt-1">Ingredients: {item.ingredients || 'Not specified'}</p>
        <p className="text-xs text-muted-foreground pt-1">Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1">
        {item.isSimilarToSafe && (
          <Badge variant="secondary" className="mb-2 text-sm bg-gray-700 text-gray-200 border-gray-600">
            <CheckCheck className="mr-1 h-4 w-4" /> Similar to your Safe Foods
          </Badge>
        )}
         {item.fodmapData && item.fodmapData.ingredientFodmapScores && item.fodmapData.ingredientFodmapScores.length > 0 && (
          <div className="mt-2 max-h-24 overflow-y-auto pr-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Ingredient Analysis:</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {item.fodmapData.ingredientFodmapScores.map((entry) => (
                <li key={entry.ingredient} className={`text-xs ${
                  entry.score === 'Green' ? 'text-[#4CAF50]' : entry.score === 'Yellow' ? 'text-[#FFEB3B]' : 'text-[#F44336]'
                }`}>
                  {entry.ingredient}: <span className="font-medium">{entry.score}</span>
                  {entry.reason && <span className="text-muted-foreground italic text-[10px]"> ({entry.reason})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center px-4 pb-4 pt-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLogSymptoms(item.id)}
          disabled={isLoadingAi}
          className="border-accent text-accent-foreground hover:bg-accent/20"
        >
          <ListChecks className="mr-2 h-4 w-4" /> Log Symptoms
        </Button>
        <div className="flex gap-2">
            <Button
            variant={isSafeFood ? "default" : "outline"}
            size="sm"
            onClick={handleMarkAsSafeClick}
            disabled={isSafeFood || !item.fodmapData || isLoadingAi}
            className={isSafeFood ? "bg-gray-600 hover:bg-gray-500 text-white cursor-not-allowed" : "border-accent text-accent-foreground hover:bg-accent/20"}
            >
            {isSafeFood ? <CheckCheck className="mr-2 h-4 w-4" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            {isSafeFood ? 'Marked Safe' : 'Mark as Safe'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:bg-destructive/20"  disabled={isLoadingAi}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
