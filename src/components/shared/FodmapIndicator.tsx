
import type { FodmapScore } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge'; // Added Badge import

interface FodmapIndicatorProps {
  score?: FodmapScore;
  reason?: string;
}

export default function FodmapIndicator({ score, reason }: FodmapIndicatorProps) {
  if (!score) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> FODMAP: N/A
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>FODMAP analysis pending or not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const indicatorMap = {
    Green: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Low FODMAP', colorClass: 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10' },
    Yellow: { icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, text: 'Mod. FODMAP', colorClass: 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-500/10' }, // Shortened "Moderate"
    Red: { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'High FODMAP', colorClass: 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10' },
  };

  const currentIndicator = indicatorMap[score];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${currentIndicator.colorClass}`}>
            {currentIndicator.icon}
            {currentIndicator.text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border p-3">
          <p className={`font-semibold ${
            score === 'Green' ? 'text-green-600 dark:text-green-400' : score === 'Yellow' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
          }`}>{indicatorMap[score].text}</p> {/* Use full text from map for tooltip title */}
          {reason && <p className="text-sm text-muted-foreground mt-1">{reason}</p>}
          {!reason && score && <p className="text-sm text-muted-foreground mt-1">This item is rated as {score.toLowerCase()} FODMAP.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
