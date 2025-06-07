
'use client';

import type { MacroPoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyMacrosTrendChartProps {
  data: MacroPoint[];
  // theme: string; // Removed unused theme prop
  isDarkMode: boolean;
}

const getColors = (isDarkMode: boolean) => { // Removed theme parameter
  const baseColors = {
    protein: isDarkMode ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-1))', 
    carbs: isDarkMode ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-2))',   
    fat: isDarkMode ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-4))',      
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
  return baseColors;
};

export default function DailyMacrosTrendChart({ data, isDarkMode }: DailyMacrosTrendChartProps) {
  const colors = getColors(isDarkMode);
  
  const chartConfig = {
    protein: { label: "Protein (g)", color: colors.protein },
    carbs: { label: "Carbs (g)", color: colors.carbs },
    fat: { label: "Fat (g)", color: colors.fat },
  } satisfies import("@/components/ui/chart").ChartConfig;


  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected period.</p>;
  }
  
  const yAxisDomain = [
    0,
    Math.max(...data.flatMap(d => [d.protein, d.carbs, d.fat, 50])) // Ensure Y axis goes to at least 50
  ];


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
      >
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(5)} // Show MM-DD
          stroke={colors.text}
          angle={data.length > 10 ? -35 : 0}
          textAnchor={data.length > 10 ? "end" : "middle"}
          height={data.length > 10 ? 50 : 30}
        />
        <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            stroke={colors.text}
            domain={yAxisDomain}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Line
          dataKey="protein"
          type="monotone"
          stroke="var(--color-protein)"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          dataKey="carbs"
          type="monotone"
          stroke="var(--color-carbs)"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          dataKey="fat"
          type="monotone"
          stroke="var(--color-fat)"
          strokeWidth={2.5}
          dot={false}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}
