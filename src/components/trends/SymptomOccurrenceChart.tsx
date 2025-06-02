
'use client';

import type { SymptomFrequency } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SymptomOccurrenceChartProps {
  data: SymptomFrequency[];
  theme: string;
  isDarkMode: boolean;
}

const PREDEFINED_CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 60%)', // Additional distinct colors
  'hsl(340, 70%, 60%)',
  'hsl(100, 70%, 60%)',
];

export default function SymptomOccurrenceChart({ data, theme, isDarkMode }: SymptomOccurrenceChartProps) {

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No symptom data available for the selected period.</p>;
  }

  // Create chartConfig dynamically for labels and colors
  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: PREDEFINED_CHART_COLORS[index % PREDEFINED_CHART_COLORS.length],
    };
    return acc;
  }, {} as import("@/components/ui/chart").ChartConfig);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[350px] w-full"
    >
      <PieChart accessibilityLayer>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={80} // For Donut shape
          fill="hsl(var(--foreground))" // Default fill, overridden by Cell
          labelLine={false}
          // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} // Optional: if you want labels on slices
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || PREDEFINED_CHART_COLORS[index % PREDEFINED_CHART_COLORS.length]} />
          ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center max-w-[300px]" />}
        />
      </PieChart>
    </ChartContainer>
  );
}
