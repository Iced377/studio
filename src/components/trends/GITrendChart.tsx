'use client';

import type { GIPoint } from '@/types'; // We will define GIPoint in the next step
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GITrendChartProps {
  data: GIPoint[]; // Expects data like [{ hour: "00:00", gi: 30 }, { hour: "01:00", gi: 45 }, ...]
  theme: string;
  isDarkMode: boolean;
}

const getGIColors = (theme: string, isDarkMode: boolean) => {
  const baseColors = {
    gi: isDarkMode ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-3))', // Example: Blueish, assuming chart-3 is suitable
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
  return baseColors;
};

export default function GITrendChart({ data, theme, isDarkMode }: GITrendChartProps) {
  const colors = getGIColors(theme, isDarkMode);
  
  const chartConfig = {
    gi: { label: "Glycemic Index", color: colors.gi },
  } satisfies import("@/components/ui/chart").ChartConfig;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No GI data available for the selected period.</p>;
  }
  
  // Determine Y-axis domain dynamically, ensuring it covers typical GI range
  const maxGiInDatapoints = data.length > 0 ? Math.max(...data.map(d => d.gi)) : 0;
  const yAxisDomainMax = Math.max(maxGiInDatapoints, 100); // Ensure Y axis goes to at least 100 or max data point
  const yAxisDomain = [0, yAxisDomainMax];

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke={colors.text}
          angle={0} // Keep hours upright
          textAnchor={"middle"}
          height={30}
          interval={data.length > 12 ? Math.floor(data.length / 12) : 0} // Show a reasonable number of ticks
        />
        <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            stroke={colors.text}
            domain={yAxisDomain}
            label={{ value: 'GI Value', angle: -90, position: 'insideLeft', fill: colors.text, dy: 40, dx: -5}}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [value, chartConfig[props.dataKey as keyof typeof chartConfig]?.label || name]} />}
        />
        <Line
          dataKey="gi"
          type="monotone"
          stroke={colors.gi}
          strokeWidth={2.5}
          dot={true}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}
