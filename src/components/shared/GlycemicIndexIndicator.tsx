'use client';

import type { GlycemicIndexInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react'; // Using Flame as a generic "energy" or "sugar" related icon

interface GlycemicIndexIndicatorProps {
  giInfo?: GlycemicIndexInfo;
}

export default function GlycemicIndexIndicator({ giInfo }: GlycemicIndexIndicatorProps) {
  if (!giInfo || !giInfo.level) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" /> GI: N/A
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>Glycemic Index data not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { value, level } = giInfo;

  let colorClass = 'border-muted-foreground/30 text-muted-foreground bg-muted/20'; // Default for Medium or if somehow level is undefined
  let iconColor = 'text-gray-500';

  if (level === 'Low') {
    colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
    iconColor = 'text-green-500';
  } else if (level === 'Medium') {
    colorClass = 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10';
    iconColor = 'text-orange-500';
  } else if (level === 'High') {
    colorClass = 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10';
    iconColor = 'text-red-500';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${colorClass}`}>
            <Flame className={`h-3.5 w-3.5 ${iconColor}`} /> GI: {level} {value && `(${value})`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground border-border">
          <p className="font-semibold">Glycemic Index: {level}</p>
          {value && <p>Value: {value}</p>}
          <p className="text-xs mt-1">Low: &lt;=55, Medium: 56-69, High: &gt;=70</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
