import type { FodmapScore } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>FODMAP analysis pending or not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const indicatorMap = {
    Green: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, text: 'Low FODMAP', colorClass: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800 border-green-500' },
    Yellow: { icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, text: 'Moderate FODMAP', colorClass: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-800 border-yellow-500' },
    Red: { icon: <XCircle className="h-5 w-5 text-red-500" />, text: 'High FODMAP', colorClass: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-800 border-red-500' },
  };

  const currentIndicator = indicatorMap[score];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium border ${currentIndicator.colorClass}`}>
            {currentIndicator.icon}
            {currentIndicator.text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold">{currentIndicator.text}</p>
          {reason && <p className="text-sm text-muted-foreground mt-1">{reason}</p>}
          {!reason && score && <p className="text-sm text-muted-foreground mt-1">This item is rated as {score.toLowerCase()} FODMAP.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
