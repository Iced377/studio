
'use client';

import type { SafetyPoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LoggedSafetyTrendChartProps {
  data: SafetyPoint[];
  theme: string;
  isDarkMode: boolean;
}

// Using chart-X variables consistent with SymptomOccurrenceChart
// Unsafe: chart-1, Safe: chart-2, Not Marked: chart-3
const getColors = (theme: string, isDarkMode: boolean) => {
  return {
    unsafe: 'hsl(var(--chart-1))',   
    safe: 'hsl(var(--chart-2))', 
    notMarked: 'hsl(var(--chart-3))', 
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
};

export default function LoggedSafetyTrendChart({ data, theme, isDarkMode }: LoggedSafetyTrendChartProps) {
  const colors = getColors(theme, isDarkMode);
  
  const chartConfig = {
    unsafe: { label: "Unsafe", color: colors.unsafe },
    safe: { label: "Safe", color: colors.safe },
    notMarked: { label: "Not Marked", color: colors.notMarked },
  } satisfies import("@/components/ui/chart").ChartConfig;


  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected period.</p>;
  }
  
  const yAxisDomain = [
    0,
    Math.max(...data.map(d => d.safe + d.unsafe + d.notMarked), 5) // Ensure Y axis goes to at least 5
  ];


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid horizontal={false} stroke={colors.grid} />
        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} stroke={colors.text} domain={yAxisDomain} />
        <YAxis
          dataKey="date"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke={colors.text}
          tickFormatter={(value) => value.slice(5)}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="dot" />}
        />
        {/* Order: Unsafe, Safe, Not Marked */}
        <Bar dataKey="unsafe" stackId="a" fill="var(--color-unsafe)" radius={[0, 4, 4, 0]} barSize={20} />
        <Bar dataKey="safe" stackId="a" fill="var(--color-safe)" barSize={20}/>
        <Bar dataKey="notMarked" stackId="a" fill="var(--color-notMarked)" radius={[4, 0, 0, 4]} barSize={20} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}

