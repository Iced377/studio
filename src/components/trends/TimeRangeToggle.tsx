
'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimeRange } from "@/types";

interface TimeRangeToggleProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1 Day' },
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: '90D', label: '90 Days' },
  { value: '1Y', label: '1 Year' },
  { value: 'ALL', label: 'All Time' },
];

export default function TimeRangeToggle({ selectedRange, onRangeChange }: TimeRangeToggleProps) {
  return (
    <Tabs value={selectedRange} onValueChange={(value) => onRangeChange(value as TimeRange)} className="w-full sm:w-auto">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto sm:h-10">
        {ranges.map(range => (
          <TabsTrigger key={range.value} value={range.value} className="px-2 py-1.5 sm:px-3 text-xs sm:text-sm">
            {range.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
