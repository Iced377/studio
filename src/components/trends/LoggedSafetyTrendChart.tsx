
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

const getColors = (theme: string, isDarkMode: boolean) => {
  // Use app's theme colors for safety chart
  return {
    safe: 'hsl(var(--success-indicator-bg))', // Green
    unsafe: 'hsl(var(--destructive))',       // Red
    notMarked: isDarkMode ? 'hsl(var(--muted))' : 'hsl(var(--muted))', // Grey
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
};

export default function LoggedSafetyTrendChart({ data, theme, isDarkMode }: LoggedSafetyTrendChartProps) {
  const colors = getColors(theme, isDarkMode);
  
  const chartConfig = {
    safe: { label: "Safe", color: colors.safe },
    unsafe: { label: "Unsafe", color: colors.unsafe },
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
        <Bar dataKey="safe" stackId="a" fill="var(--color-safe)" radius={[0, 4, 4, 0]} barSize={20}/>
        <Bar dataKey="unsafe" stackId="a" fill="var(--color-unsafe)" barSize={20} />
        <Bar dataKey="notMarked" stackId="a" fill="var(--color-notMarked)" radius={[4, 0, 0, 4]} barSize={20} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}
