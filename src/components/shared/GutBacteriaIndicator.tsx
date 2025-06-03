
'use client';

import type { GutBacteriaImpactInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Smile, Frown, Meh, HelpCircle, Users } from 'lucide-react'; // Using Users as a generic gut icon

interface GutBacteriaIndicatorProps {
  gutImpact?: GutBacteriaImpactInfo;
}

export default function GutBacteriaIndicator({ gutImpact }: GutBacteriaIndicatorProps) {
  if (!gutImpact || !gutImpact.sentiment) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
               <Users className="h-3 w-3" /> Gut Impact: N/A
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>Gut Bacteria Impact data not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { sentiment, reasoning } = gutImpact;
  let IconComponent;
  let colorClass = 'border-muted-foreground/30 text-muted-foreground bg-muted/20';
  let iconColor = 'text-gray-500';
  let sentimentText = sentiment;

  switch (sentiment) {
    case 'Positive':
      IconComponent = Smile;
      colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
      iconColor = 'text-green-500';
      sentimentText = "+ Gut Health";
      break;
    case 'Negative':
      IconComponent = Frown;
      colorClass = 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10';
      iconColor = 'text-red-500';
      sentimentText = "– Gut Health";
      break;
    case 'Neutral':
      IconComponent = Meh;
      colorClass = 'border-gray-500/50 text-gray-700 dark:text-gray-400 bg-gray-500/10';
      iconColor = 'text-gray-500';
      sentimentText = "Neutral Impact";
      break;
    case 'Unknown':
    default:
      IconComponent = HelpCircle;
      colorClass = 'border-muted-foreground/30 text-muted-foreground bg-muted/20';
      iconColor = 'text-muted-foreground';
      sentimentText = "Impact Unknown";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${colorClass}`}>
            <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} /> {sentimentText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border p-3">
          <p className="font-semibold">Gut Bacteria Impact: {sentiment}</p>
          {reasoning && <p className="text-sm text-muted-foreground mt-1">{reasoning}</p>}
          {!reasoning && <p className="text-sm text-muted-foreground mt-1">General estimated impact on gut microbiota.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
