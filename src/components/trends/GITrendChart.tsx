
'use client';

import type { GIPoint } from '@/types'; 
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GITrendChartProps {
  data: GIPoint[]; 
  // theme: string; // Removed unused theme prop
  isDarkMode: boolean;
}

const getGIColors = (isDarkMode: boolean) => { // Removed theme parameter
  const baseColors = {
    gi: isDarkMode ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-3))', 
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
  return baseColors;
};

export default function GITrendChart({ data, isDarkMode }: GITrendChartProps) {
  const colors = getGIColors(isDarkMode);
  
  const chartConfig = {
    gi: { label: "Glycemic Index", color: colors.gi },
  } satisfies import("@/components/ui/chart").ChartConfig;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No GI data available for the selected period.</p>;
  }
  
  const maxGiInDatapoints = data.length > 0 ? Math.max(...data.map(d => d.gi)) : 0;
  const yAxisDomainMax = Math.max(maxGiInDatapoints, 100); 
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
          angle={0} 
          textAnchor={"middle"}
          height={30}
          interval={data.length > 12 ? Math.floor(data.length / 12) : 0} 
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
