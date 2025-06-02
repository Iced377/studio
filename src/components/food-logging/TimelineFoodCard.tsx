
'use client';

import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Trash2, CheckCheck, ListChecks, Loader2, Flame, Beef, Wheat, Droplet, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineFoodCardProps {
  item: LoggedFoodItem;
  onMarkAsSafe: (foodItem: LoggedFoodItem) => void;
  onRemoveItem: (itemId: string) => void;
  onLogSymptoms: (foodItemId?: string) => void;
  isSafeFood: boolean;
  isLoadingAi: boolean;
  onEditIngredients?: (item: LoggedFoodItem) => void;
}

export default function TimelineFoodCard({ 
    item, 
    onMarkAsSafe, 
    onRemoveItem, 
    onLogSymptoms,
    isSafeFood,
    isLoadingAi,
    onEditIngredients
}: TimelineFoodCardProps) {

  const handleMarkAsSafeClick = () => {
    if (item.fodmapData) {
      onMarkAsSafe(item);
    } else {
      console.warn("FODMAP data not available to mark as safe for item:", item.name);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const macroParts: string[] = [];
  if (item.calories !== undefined) macroParts.push(`Cal: ${Math.round(item.calories)}`);
  if (item.protein !== undefined) macroParts.push(`P: ${Math.round(item.protein)}g`);
  if (item.carbs !== undefined) macroParts.push(`C: ${Math.round(item.carbs)}g`);
  if (item.fat !== undefined) macroParts.push(`F: ${Math.round(item.fat)}g`);

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
            {item.originalName && item.originalName !== item.name && (
              <p className="text-xs text-muted-foreground italic">(Analyzed as: {item.originalName})</p>
            )}
            <p className="text-sm text-muted-foreground">Portion: {item.portionSize} {item.portionUnit}</p>
          </div>
          {item.fodmapData && <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />}
          {!item.fodmapData && !isLoadingAi && <FodmapIndicator score={undefined} reason="FODMAP analysis pending or failed." />}
        </div>
         {item.sourceDescription ? (
           <p className="text-xs text-muted-foreground/70 italic pt-1 truncate">Original: "{item.sourceDescription}"</p>
         ) : (
           <p className="text-xs text-muted-foreground break-words pt-1">Ingredients: {item.ingredients || 'Not specified'}</p>
         )}
        <p className="text-xs text-muted-foreground pt-1">Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1">
        {item.isSimilarToSafe && (
          <Badge
            variant="default" // Use default variant and override styles
            className="mb-2 text-sm"
            style={{
              backgroundColor: '#34C759', // Calo success green
              color: 'white',
              borderColor: '#27AE60', // Calo brand green for border
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <CheckCheck className="mr-1 h-4 w-4" /> Similar to your Safe Foods
          </Badge>
        )}
        {macroParts.length > 0 && !isLoadingAi && (
            <div className="mt-2 text-xs text-muted-foreground border-t border-border/50 pt-2">
                <p className="flex items-center gap-x-3 flex-wrap">
                    {item.calories !== undefined && <span className="flex items-center"><Flame className="w-3 h-3 mr-1 text-orange-400"/>{Math.round(item.calories)} kcal</span>}
                    {item.protein !== undefined && <span className="flex items-center"><Beef className="w-3 h-3 mr-1 text-red-400"/>{Math.round(item.protein)}g P</span>}
                    {item.carbs !== undefined && <span className="flex items-center"><Wheat className="w-3 h-3 mr-1 text-yellow-400"/>{Math.round(item.carbs)}g C</span>}
                    {item.fat !== undefined && <span className="flex items-center"><Droplet className="w-3 h-3 mr-1 text-blue-400"/>{Math.round(item.fat)}g F</span>}
                </p>
            </div>
        )}
         {item.fodmapData?.ingredientFodmapScores && item.fodmapData.ingredientFodmapScores.length > 0 && (
          <div className="mt-2 max-h-24 overflow-y-auto pr-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Ingredient Analysis:</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {item.fodmapData.ingredientFodmapScores.map((entry) => (
                <li key={entry.ingredient} className={`text-xs ${
                  entry.score === 'Green' ? 'text-[#34C759]' : entry.score === 'Yellow' ? 'text-[#FFD600]' : 'text-[#EB5757]'
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
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onLogSymptoms(item.id)}
                disabled={isLoadingAi}
                className="border-accent text-accent-foreground hover:bg-accent/20"
                aria-label="Log Symptoms for this item"
            >
                <ListChecks className="mr-2 h-4 w-4" /> Log Symptoms
            </Button>
            {onEditIngredients && ( 
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditIngredients(item)}
                    disabled={isLoadingAi}
                    className="border-accent text-accent-foreground hover:bg-accent/20"
                    aria-label="Edit ingredients for this item"
                >
                    <Edit3 className="mr-2 h-4 w-4" /> Edit
                </Button>
            )}
        </div>
        <div className="flex gap-2">
            <Button
            variant={isSafeFood ? "default" : "outline"}
            size="sm"
            onClick={handleMarkAsSafeClick}
            disabled={isSafeFood || !item.fodmapData || isLoadingAi}
            className={isSafeFood ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-not-allowed" : "border-accent text-accent-foreground hover:bg-accent/20"}
            aria-label={isSafeFood ? 'Marked as Safe' : 'Mark as Safe'}
            >
            {isSafeFood ? <CheckCheck className="mr-2 h-4 w-4" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            {isSafeFood ? 'Safe' : 'Safe?'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:bg-destructive/20"  disabled={isLoadingAi} aria-label="Remove this item">
            <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
