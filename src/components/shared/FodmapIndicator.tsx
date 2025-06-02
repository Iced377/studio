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
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>FODMAP analysis pending or not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Updated hex codes as per user specification
  const indicatorMap = {
    Green: { icon: <CheckCircle2 className="h-5 w-5 text-[#34C759]" />, text: 'Low FODMAP', colorClass: 'text-[#34C759] bg-[#34C759]/10 border-[#34C759]/30' },
    Yellow: { icon: <AlertTriangle className="h-5 w-5 text-[#FFD600]" />, text: 'Moderate FODMAP', colorClass: 'text-[#FFD600] bg-[#FFD600]/10 border-[#FFD600]/30' },
    Red: { icon: <XCircle className="h-5 w-5 text-[#EB5757]" />, text: 'High FODMAP', colorClass: 'text-[#EB5757] bg-[#EB5757]/10 border-[#EB5757]/30' },
  };

  const currentIndicator = indicatorMap[score];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium border ${currentIndicator.colorClass}`}>
            {currentIndicator.icon}
            {currentIndicator.text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border p-3">
          <p className={`font-semibold ${
            score === 'Green' ? 'text-[#34C759]' : score === 'Yellow' ? 'text-[#FFD600]' : 'text-[#EB5757]'
          }`}>{currentIndicator.text}</p>
          {reason && <p className="text-sm text-muted-foreground mt-1">{reason}</p>}
          {!reason && score && <p className="text-sm text-muted-foreground mt-1">This item is rated as {score.toLowerCase()} FODMAP.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
