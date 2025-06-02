
'use client';

import type { CaloriePoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyCaloriesTrendChartProps {
  data: CaloriePoint[];
  theme: string;
  isDarkMode: boolean;
}

const getColors = (theme: string, isDarkMode: boolean) => {
  return {
    calories: isDarkMode ? 'hsl(var(--chart-5))' : 'hsl(var(--chart-5))', // Example: Bluish/Purple
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
};

export default function DailyCaloriesTrendChart({ data, theme, isDarkMode }: DailyCaloriesTrendChartProps) {
  const colors = getColors(theme, isDarkMode);
  
  const chartConfig = {
    calories: { label: "Calories (kcal)", color: colors.calories },
  } satisfies import("@/components/ui/chart").ChartConfig;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected period.</p>;
  }
  
  const yAxisDomain = [
    0,
    Math.max(...data.map(d => d.calories), 1000) // Ensure Y axis goes to at least 1000
  ];

  return (
     <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
      >
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3"/>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(5)}
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
        <defs>
            <linearGradient id="fillCalories" x1="0" y1="0" x2="0" y2="1">
                <stop
                offset="5%"
                stopColor="var(--color-calories)"
                stopOpacity={0.8}
                />
                <stop
                offset="95%"
                stopColor="var(--color-calories)"
                stopOpacity={0.1}
                />
            </linearGradient>
        </defs>
        <Area
          dataKey="calories"
          type="monotone"
          fill="url(#fillCalories)"
          stroke="var(--color-calories)"
          strokeWidth={2.5}
          stackId="a"
        />
         <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
