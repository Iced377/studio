'use client';

import type { DietaryFiberInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Leaf } from 'lucide-react';

interface DietaryFiberIndicatorProps {
  fiberInfo?: DietaryFiberInfo;
}

export default function DietaryFiberIndicator({ fiberInfo }: DietaryFiberIndicatorProps) {
  if (!fiberInfo || typeof fiberInfo.amountGrams !== 'number') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
             <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" /> Fiber: N/A
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>Dietary Fiber data not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { amountGrams, quality } = fiberInfo;

  let qualityText = '';
  if (quality) {
    qualityText = ` (${quality})`;
  }
  
  // Determine color based on quality, or a default if no quality
  let colorClass = 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-500/10'; // Default/Adequate
  let iconColor = 'text-blue-500';

  if (quality === 'Low') {
    colorClass = 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10';
    iconColor = 'text-orange-500';
  } else if (quality === 'High') {
    colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
    iconColor = 'text-green-500';
  }


  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${colorClass}`}>
            <Leaf className={`h-3.5 w-3.5 ${iconColor}`} /> {amountGrams.toFixed(1)}g Fiber
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground border-border">
          <p className="font-semibold">Dietary Fiber</p>
          <p>Amount: {amountGrams.toFixed(1)}g</p>
          {quality && <p>Quality: {quality}</p>}
           <p className="text-xs mt-1">General guide: &lt;2g Low, 2-4g Adequate, &gt;5g High per item.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
