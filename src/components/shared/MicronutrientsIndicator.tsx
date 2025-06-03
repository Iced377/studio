
'use client';

import type { MicronutrientsInfo, MicronutrientDetail } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Atom, Sparkles, Stethoscope, Info, HelpCircle, CheckSquare, Zap, ShieldCheck, ShieldQuestion, Bone, Nut, Citrus, Carrot, BeefIcon, LeafIcon, MilkIcon } from 'lucide-react'; // Added more icons

interface MicronutrientsIndicatorProps {
  micronutrientsInfo?: MicronutrientsInfo;
}

const LucideIcons: { [key: string]: React.ElementType } = {
  Atom, Sparkles, Stethoscope, Info, HelpCircle, CheckSquare, Zap, ShieldCheck, ShieldQuestion, Bone, Nut, Citrus, Carrot, BeefIcon, LeafIcon, MilkIcon
  // Add more mappings as needed
};


const MicronutrientItemDisplay: React.FC<{ nutrient: MicronutrientDetail }> = ({ nutrient }) => {
  const IconComponent = nutrient.iconName && LucideIcons[nutrient.iconName] ? LucideIcons[nutrient.iconName] : Atom;
  return (
    <li className="text-xs flex items-center gap-1.5">
      <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
      <span>
        {nutrient.name}: {nutrient.amount || 'N/A'}
        {nutrient.dailyValuePercent !== undefined && ` (${nutrient.dailyValuePercent}% DV)`}
      </span>
    </li>
  );
};

export default function MicronutrientsIndicator({ micronutrientsInfo }: MicronutrientsIndicatorProps) {
  if (!micronutrientsInfo || (!micronutrientsInfo.notable?.length && !micronutrientsInfo.fullList?.length)) {
     return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground flex items-center gap-1">
                <Atom className="h-3 w-3" /> Micros: N/A
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border">
              <p>Micronutrient data not available.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
    );
  }
  
  const notableMicros = micronutrientsInfo.notable || [];
  const fullListMicros = micronutrientsInfo.fullList || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-auto py-0.5 px-2 border-purple-500/50 text-purple-700 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          {notableMicros.length > 0 ? `Key Micros (${notableMicros.length})` : 'Micronutrients'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover text-popover-foreground border-border p-3">
        <div className="space-y-2">
          <h4 className="font-medium leading-none text-sm">Micronutrients Overview</h4>
          {notableMicros.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notable:</p>
              <ul className="space-y-1">
                {notableMicros.map((nutrient, index) => (
                  <MicronutrientItemDisplay key={`notable-${index}-${nutrient.name}`} nutrient={nutrient} />
                ))}
              </ul>
            </div>
          )}
          {fullListMicros.length > 0 && notableMicros.length > 0 && (
             <hr className="my-2 border-border" />
          )}
          {fullListMicros.length > 0 && (
             <div>
              <p className="text-xs text-muted-foreground mb-1">{notableMicros.length > 0 ? 'More Details:' : 'Details:'}</p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {fullListMicros.map((nutrient, index) => (
                  <MicronutrientItemDisplay key={`full-${index}-${nutrient.name}`} nutrient={nutrient} />
                ))}
              </ul>
            </div>
          )}
          {(notableMicros.length === 0 && fullListMicros.length === 0) && (
            <p className="text-xs text-muted-foreground">No specific micronutrient data provided by AI for this item.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Dummy TooltipProvider and Tooltip for when no data is available, to avoid error if these are not globally provided
// This is a workaround. Ideally, TooltipProvider should wrap a larger part of your app.
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const TooltipTrigger: React.FC<{ children: React.ReactNode, asChild?: boolean }> = ({ children }) => <>{children}</>;
const TooltipContent: React.FC<{ children: React.ReactNode, className?:string }> = ({ children }) => <div style={{display: 'none'}}>{children}</div>;
