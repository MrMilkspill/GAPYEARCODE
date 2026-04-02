"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type RadarDatum = {
  label: string;
  current: number;
  target: number;
};

export function BenchmarkRadarChart({ data }: { data: RadarDatum[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="oklch(var(--border))" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "oklch(var(--muted-foreground))", fontSize: 12 }}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="oklch(var(--primary))"
            fill="oklch(var(--primary))"
            fillOpacity={0.22}
            strokeWidth={2}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="oklch(var(--chart-2))"
            fill="oklch(var(--chart-2))"
            fillOpacity={0.14}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
