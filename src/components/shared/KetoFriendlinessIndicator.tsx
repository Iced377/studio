
'use client';

import type { KetoFriendlinessInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, Flame, HelpCircle, AlertCircle } from 'lucide-react'; // Using Brain or Flame

interface KetoFriendlinessIndicatorProps {
  ketoInfo?: KetoFriendlinessInfo;
}

export default function KetoFriendlinessIndicator({ ketoInfo }: KetoFriendlinessIndicatorProps) {
  if (!ketoInfo || !ketoInfo.score) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Keto: N/A
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border">
            <p>Keto-friendliness data not available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const { score, reasoning, estimatedNetCarbs } = ketoInfo;
  let IconComponent = Flame; // Default icon
  let colorClass = 'border-gray-500/50 text-gray-700 dark:text-gray-400 bg-gray-500/10'; // Default for Unknown or others
  let iconColor = 'text-gray-500';
  let scoreText = score;

  switch (score) {
    case 'Strict Keto':
      IconComponent = Flame; // Or Brain
      colorClass = 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10';
      iconColor = 'text-green-500';
      break;
    case 'Moderate Keto':
      IconComponent = Flame; // Or Brain
      colorClass = 'border-teal-500/50 text-teal-700 dark:text-teal-400 bg-teal-500/10';
      iconColor = 'text-teal-500';
      break;
    case 'Low Carb':
      IconComponent = Brain;
      colorClass = 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-500/10';
      iconColor = 'text-blue-500';
      break;
    case 'Not Keto-Friendly':
      IconComponent = AlertCircle;
      colorClass = 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10';
      iconColor = 'text-red-500';
      break;
    case 'Unknown':
    default:
      IconComponent = HelpCircle;
      scoreText = "Keto: Unknown";
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${colorClass}`}>
            <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} /> {scoreText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-border p-3">
          <p className="font-semibold">Keto-Friendliness: {score}</p>
          {estimatedNetCarbs !== undefined && <p className="text-sm text-muted-foreground">Est. Net Carbs: {estimatedNetCarbs.toFixed(1)}g</p>}
          {reasoning && <p className="text-sm text-muted-foreground mt-1">{reasoning}</p>}
          {!reasoning && <p className="text-sm text-muted-foreground mt-1">General assessment of suitability for a ketogenic diet.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

