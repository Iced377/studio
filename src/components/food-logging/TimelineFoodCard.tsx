'use client';

import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Trash2, ListChecks, Loader2, Flame, Beef, Wheat, Droplet, Edit3, CheckCheck, PencilLine } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineFoodCardProps {
  item: LoggedFoodItem;
  onSetFeedback?: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem?: (itemId: string) => void;
  onLogSymptoms?: (foodItemId?: string) => void;
  isLoadingAi: boolean;
  onEditIngredients?: (item: LoggedFoodItem) => void;
  isGuestView?: boolean;
}

export default function TimelineFoodCard({
    item,
    onSetFeedback,
    onRemoveItem,
    onLogSymptoms,
    isLoadingAi,
    onEditIngredients,
    isGuestView = false,
}: TimelineFoodCardProps) {

  const handleFeedback = (newFeedback: 'safe' | 'unsafe') => {
    if (isGuestView || !onSetFeedback) return;
    if (item.userFeedback === newFeedback) {
      onSetFeedback(item.id, null); // Toggle off if same button clicked
    } else {
      onSetFeedback(item.id, newFeedback);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const macroParts: string[] = [];
  if (item.calories !== undefined) macroParts.push(`Cal: ${Math.round(item.calories)}`);
  if (item.protein !== undefined) macroParts.push(`P: ${Math.round(item.protein)}g`);
  if (item.carbs !== undefined) macroParts.push(`C: ${Math.round(item.carbs)}g`);
  if (item.fat !== undefined) macroParts.push(`F: ${Math.round(item.fat)}g`);

  const isManualMacroEntry = item.entryType === 'manual_macro';

  const cardClasses = cn(
    "mb-4 shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden",
    isGuestView ? "bg-green-50 text-green-900 border-green-200" : "bg-card text-card-foreground border-border"
  );

  const mutedTextClass = isGuestView ? "text-green-700" : "text-muted-foreground";
  const primaryTextClass = isGuestView ? "text-green-900" : "text-foreground";
  const buttonTextClass = "text-foreground"; // Ensure dark text in light mode for these buttons

  return (
    <Card className={cardClasses}>
      {isLoadingAi && !isManualMacroEntry && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={cn("text-lg font-semibold font-headline", primaryTextClass)}>{item.name}</CardTitle>
            {item.originalName && item.originalName !== item.name && !isManualMacroEntry && (
              <p className={cn("text-xs italic", mutedTextClass)}>(Analyzed as: {item.originalName})</p>
            )}
            {!isManualMacroEntry && <p className={cn("text-sm", mutedTextClass)}>Portion: {item.portionSize} {item.portionUnit}</p>}
          </div>
          {item.fodmapData && !isManualMacroEntry && <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />}
          {!item.fodmapData && !isLoadingAi && !isManualMacroEntry && <FodmapIndicator score={undefined} reason="FODMAP analysis pending or failed." />}
        </div>
         {item.sourceDescription && !isManualMacroEntry ? (
           <p className={cn("text-xs italic pt-1 truncate", mutedTextClass, isGuestView ? "text-green-700/80" : "text-muted-foreground/70")}>Original: "{item.sourceDescription}"</p>
         ) : !isManualMacroEntry && (
           <p className={cn("text-xs break-words pt-1", mutedTextClass)}>Ingredients: {item.ingredients || 'Not specified'}</p>
         )}
        <p className={cn("text-xs pt-1", mutedTextClass)}>Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1">
        {item.isSimilarToSafe && !isManualMacroEntry && (
          <Badge
            variant="default"
            className="mb-2 text-sm"
            style={{
              backgroundColor: isGuestView ? '#A7F3D0' : 'var(--success-indicator-bg, #34C759)',
              color: isGuestView ? '#065F46' : 'var(--success-indicator-text, white)',
              borderColor: isGuestView ? '#065F46' : 'var(--primary, #27AE60)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <CheckCheck className="mr-1 h-4 w-4" /> Similar to your Safe Foods
          </Badge>
        )}
        {macroParts.length > 0 && (
            <div className={cn("mt-2 text-xs border-t pt-2", mutedTextClass, isGuestView ? "border-green-200" : "border-border/50")}>
                <p className="flex items-center gap-x-3 flex-wrap">
                    {item.calories !== undefined && <span className="flex items-center"><Flame className="w-3 h-3 mr-1 text-orange-400"/>{Math.round(item.calories)} kcal</span>}
                    {item.protein !== undefined && <span className="flex items-center"><Beef className="w-3 h-3 mr-1 text-red-400"/>{Math.round(item.protein)}g P</span>}
                    {item.carbs !== undefined && <span className="flex items-center"><Wheat className="w-3 h-3 mr-1 text-yellow-400"/>{Math.round(item.carbs)}g C</span>}
                    {item.fat !== undefined && <span className="flex items-center"><Droplet className="w-3 h-3 mr-1 text-blue-400"/>{Math.round(item.fat)}g F</span>}
                    {item.macrosOverridden && <span className="flex items-center text-orange-500"><PencilLine className="w-3 h-3 mr-1"/> (Macros Edited)</span>}
                </p>
            </div>
        )}
         {item.fodmapData?.ingredientFodmapScores && item.fodmapData.ingredientFodmapScores.length > 0 && !isManualMacroEntry && (
          <div className="mt-2 max-h-24 overflow-y-auto pr-2">
            <p className={cn("text-xs font-medium mb-1", mutedTextClass)}>Ingredient Analysis:</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {item.fodmapData.ingredientFodmapScores.map((entry) => (
                <li key={entry.ingredient} className={`text-xs ${
                  entry.score === 'Green' ? 'text-green-500' : entry.score === 'Yellow' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {entry.ingredient}: <span className="font-medium">{entry.score}</span>
                  {entry.reason && <span className={cn("italic text-[10px]", mutedTextClass)}> ({entry.reason})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {!isGuestView && (
        <CardFooter className="flex flex-wrap justify-between items-center px-4 pb-4 pt-2 gap-2">
          <div className="flex gap-2">
              {!isManualMacroEntry && onLogSymptoms && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLogSymptoms(item.id)}
                    disabled={isLoadingAi}
                    className={cn("border-accent hover:bg-accent hover:text-accent-foreground", buttonTextClass)}
                    aria-label="Log Symptoms for this item"
                >
                    <ListChecks className="mr-2 h-4 w-4" /> Log Symptoms
                </Button>
              )}
              {onEditIngredients && (  // Show edit button for both food and manual_macro types
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditIngredients(item)}
                      disabled={isLoadingAi}
                      className={cn("border-accent hover:bg-accent hover:text-accent-foreground", buttonTextClass)}
                      aria-label="Edit this item"
                  >
                      <Edit3 className="mr-2 h-4 w-4" /> Edit
                  </Button>
              )}
          </div>
          <div className="flex gap-2 items-center">
              {!isManualMacroEntry && onSetFeedback && (
                <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('safe')}
                  disabled={isLoadingAi}
                  className={`${item.userFeedback === 'safe' ? 'bg-green-500/20 text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
                  aria-label="Mark as Safe"
                >
                  <ThumbsUp className={`h-5 w-5 ${item.userFeedback === 'safe' ? 'fill-green-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('unsafe')}
                  disabled={isLoadingAi}
                  className={`${item.userFeedback === 'unsafe' ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                  aria-label="Mark as Unsafe"
                >
                  <ThumbsDown className={`h-5 w-5 ${item.userFeedback === 'unsafe' ? 'fill-red-500' : ''}`} />
                </Button>
                </>
              )}
              {onRemoveItem && (
                <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:bg-destructive/20"  disabled={isLoadingAi} aria-label="Remove this item">
                <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}