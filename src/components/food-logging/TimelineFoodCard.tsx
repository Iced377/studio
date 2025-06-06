
'use client';

import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import GlycemicIndexIndicator from '@/components/shared/GlycemicIndexIndicator';
import DietaryFiberIndicator from '@/components/shared/DietaryFiberIndicator';
import MicronutrientsIndicator from '@/components/shared/MicronutrientsIndicator';
import GutBacteriaIndicator from '@/components/shared/GutBacteriaIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Trash2, ListChecks, Loader2, Flame, Beef, Wheat, Droplet, Edit3, CheckCheck, PencilLine, Sparkles, Leaf, Users, Activity, Repeat, MessageSquareText, Info, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 

interface TimelineFoodCardProps {
  item: LoggedFoodItem;
  onSetFeedback?: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem?: (itemId: string) => void;
  onLogSymptoms?: (foodItemId?: string) => void;
  isLoadingAi: boolean;
  onEditIngredients?: (item: LoggedFoodItem) => void;
  onRepeatMeal?: (item: LoggedFoodItem) => void;
  isGuestView?: boolean;
}

export default function TimelineFoodCard({
    item,
    onSetFeedback,
    onRemoveItem,
    onLogSymptoms,
    isLoadingAi,
    onEditIngredients,
    onRepeatMeal,
    isGuestView = false,
}: TimelineFoodCardProps) {

  const handleFeedback = (newFeedback: 'safe' | 'unsafe') => {
    if (isGuestView || !onSetFeedback) return; 
    if (item.userFeedback === newFeedback) {
      onSetFeedback(item.id, null);
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
    "bg-card text-card-foreground border-border"
  );

  const mutedTextClass = "text-muted-foreground";
  const primaryTextClass = "text-foreground";
  const buttonTextClass = "text-foreground"; 

  const aiSummaries = item.fodmapData?.aiSummaries;
  const detectedAllergens = item.fodmapData?.detectedAllergens;

  return (
    <Card className={cardClasses}>
      {isLoadingAi && !isManualMacroEntry && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="ml-2 text-white">AI Analyzing...</p>
        </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={cn("text-md sm:text-lg font-semibold font-headline break-words", primaryTextClass)}>{item.name}</CardTitle>
            {item.originalName && item.originalName !== item.name && !isManualMacroEntry && (
              <p className={cn("text-sm italic", mutedTextClass)}>(Analyzed as: {item.originalName})</p>
            )}
            {!isManualMacroEntry && <p className={cn("text-sm", mutedTextClass)}>Portion: {item.portionSize} {item.portionUnit}</p>}
          </div>
           {item.fodmapData && !isManualMacroEntry && <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />}
        </div>
         {item.sourceDescription && !isManualMacroEntry ? (
           <p className={cn("text-sm italic pt-1 break-words", mutedTextClass, "text-muted-foreground/70")}>{item.sourceDescription}</p>
         ) : !isManualMacroEntry && (
           <p className={cn("text-sm break-words pt-1", mutedTextClass)}>Ingredients: {item.ingredients || 'Not specified'}</p>
         )}
        <p className={cn("text-xs pt-1", mutedTextClass)}>Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1 space-y-2">
        {item.isSimilarToSafe && !isManualMacroEntry && (
          <Badge
            variant="default"
            className="text-sm"
            style={{ 
              backgroundColor: 'var(--success-indicator-bg, #34C759)',
              color: 'var(--success-indicator-text, white)',
              borderColor: 'var(--primary, #27AE60)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" /> Similar to your Safe Foods
          </Badge>
        )}

        {macroParts.length > 0 && (
            <div className={cn("text-sm border-t pt-2", mutedTextClass, "border-border/50")}>
                <p className="flex items-center gap-x-2 sm:gap-x-3 flex-wrap">
                    {item.calories !== undefined && <span className="flex items-center"><Flame className="w-3.5 h-3.5 mr-1 text-orange-400"/>{Math.round(item.calories)} kcal</span>}
                    {item.protein !== undefined && <span className="flex items-center"><Beef className="w-3.5 h-3.5 mr-1 text-red-400"/>{Math.round(item.protein)}g P</span>}
                    {item.carbs !== undefined && <span className="flex items-center"><Wheat className="w-3.5 h-3.5 mr-1 text-yellow-400"/>{Math.round(item.carbs)}g C</span>}
                    {item.fat !== undefined && <span className="flex items-center"><Droplet className="w-3.5 h-3.5 mr-1 text-blue-400"/>{Math.round(item.fat)}g F</span>}
                    {item.macrosOverridden && <span className="flex items-center text-orange-500"><PencilLine className="w-3.5 h-3.5 mr-1"/>Edited</span>}
                </p>
            </div>
        )}
        {!isManualMacroEntry && item.fodmapData && (
            <div className={cn("text-xs border-t pt-2 mt-2 flex flex-wrap items-center gap-2", "border-border/50")}>
                <GlycemicIndexIndicator giInfo={item.fodmapData.glycemicIndexInfo} />
                <DietaryFiberIndicator fiberInfo={item.fodmapData.dietaryFiberInfo} />
                <MicronutrientsIndicator micronutrientsInfo={item.fodmapData.micronutrientsInfo} />
                <GutBacteriaIndicator gutImpact={item.fodmapData.gutBacteriaImpact} />
                {detectedAllergens && detectedAllergens.length > 0 &&
                    detectedAllergens.map(allergen => (
                        <TooltipProvider key={allergen}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-1 cursor-default">
                                  <AlertCircle className="h-3 w-3" /> {allergen}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border-border">
                              <p>Contains Allergen: {allergen}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    ))
                }
            </div>
        )}
        
        {!isManualMacroEntry && aiSummaries && (
          Object.values(aiSummaries).some(summary => summary && summary.length > 0) || item.fodmapData?.gutBacteriaImpact?.reasoning
        ) && (
          <div className={cn("text-xs border-t pt-2 mt-2 space-y-1.5", "border-border/50", mutedTextClass)}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="text-xs font-semibold text-foreground/80 flex items-center cursor-default">
                    <MessageSquareText className="h-3.5 w-3.5 mr-1.5 text-primary/70"/>AI Notes:
                  </h4>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border-border max-w-xs">
                  <p>AI-generated summaries for this item.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {aiSummaries.fodmapSummary && (
              <p><strong className="text-foreground/70">FODMAP:</strong> {aiSummaries.fodmapSummary}</p>
            )}
            {aiSummaries.micronutrientSummary && (
              <p><strong className="text-foreground/70">Micronutrients:</strong> {aiSummaries.micronutrientSummary}</p>
            )}
            {aiSummaries.glycemicIndexSummary && (
              <p><strong className="text-foreground/70">Glycemic Index:</strong> {aiSummaries.glycemicIndexSummary}</p>
            )}
            {aiSummaries.gutImpactSummary ? (
              <p><strong className="text-foreground/70">Gut Impact:</strong> {aiSummaries.gutImpactSummary}</p>
            ) : item.fodmapData?.gutBacteriaImpact?.reasoning && ( 
              <p><strong className="text-foreground/70">Gut Impact:</strong> {item.fodmapData.gutBacteriaImpact.reasoning}</p>
            )}
          </div>
        )}

         {item.fodmapData?.ingredientFodmapScores && item.fodmapData.ingredientFodmapScores.length > 0 && !isManualMacroEntry && (
          <div className="mt-2 max-h-24 overflow-y-auto pr-2 border-t pt-2 border-border/50">
            <p className={cn("text-sm font-medium mb-1", mutedTextClass)}>Ingredient FODMAPs:</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {item.fodmapData.ingredientFodmapScores.map((entry) => (
                <li key={entry.ingredient} className={`text-sm ${
                  entry.score === 'Green' ? 'text-green-500' : entry.score === 'Yellow' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {entry.ingredient}: <span className="font-medium">{entry.score}</span>
                  {entry.reason && <span className={cn("italic text-xs break-words", mutedTextClass)}> ({entry.reason})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {!isGuestView && ( 
        <CardFooter className="flex flex-wrap justify-between items-center px-4 pb-4 pt-2 gap-2 border-t border-border/50">
          <div className="flex gap-2 flex-wrap">
              {!isManualMacroEntry && onLogSymptoms && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLogSymptoms(item.id)}
                    disabled={isLoadingAi}
                    className={cn("border-accent hover:bg-accent hover:text-accent-foreground text-sm px-2.5 py-1.5 h-auto", buttonTextClass)}
                    aria-label="Log Symptoms for this item"
                >
                    <ListChecks className="mr-1.5 h-4 w-4" /> Log Symptoms
                </Button>
              )}
              {onEditIngredients && (
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditIngredients(item)}
                      disabled={isLoadingAi}
                      className={cn("border-accent hover:bg-accent hover:text-accent-foreground text-sm px-2.5 py-1.5 h-auto", buttonTextClass)}
                      aria-label="Edit this item"
                  >
                      <Edit3 className="mr-1.5 h-4 w-4" /> Edit
                  </Button>
              )}
              {onRepeatMeal && item.entryType === 'food' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRepeatMeal(item)}
                  disabled={isLoadingAi}
                  className={cn("border-accent hover:bg-accent hover:text-accent-foreground text-sm px-2.5 py-1.5 h-auto", buttonTextClass)}
                  aria-label="Repeat this meal"
                >
                  <Repeat className="mr-1.5 h-4 w-4" /> Repeat
                </Button>
              )}
          </div>
          <div className="flex gap-1 items-center">
              {!isManualMacroEntry && onSetFeedback && (
                <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('safe')}
                  disabled={isLoadingAi}
                  className={cn(
                    "h-8 w-8",
                    item.userFeedback === 'safe' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                  )}
                  aria-label="Mark as Safe"
                >
                  <ThumbsUp className={`h-4.5 w-4.5 ${item.userFeedback === 'safe' ? 'fill-green-500/70' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback('unsafe')}
                  disabled={isLoadingAi}
                   className={cn(
                    "h-8 w-8",
                    item.userFeedback === 'unsafe' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                  )}
                  aria-label="Mark as Unsafe"
                >
                  <ThumbsDown className={`h-4.5 w-4.5 ${item.userFeedback === 'unsafe' ? 'fill-red-500/70' : ''}`} />
                </Button>
                </>
              )}
              {onRemoveItem && (
                <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:bg-destructive/20 text-sm px-2.5 py-1.5 h-auto"  disabled={isLoadingAi} aria-label="Remove this item">
                <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                </Button>
              )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
    