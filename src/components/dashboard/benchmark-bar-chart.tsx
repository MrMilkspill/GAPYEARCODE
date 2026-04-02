"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BarDatum = {
  label: string;
  current: number;
  target: number;
  status: "ahead" | "on_track" | "below";
};

const fillMap = {
  ahead: "#0f766e",
  on_track: "#0284c7",
  below: "#f59e0b",
} as const;

export function BenchmarkBarChart({ data }: { data: BarDatum[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#d9e1e7" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5d6d7c", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#5d6d7c", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(2, 132, 199, 0.06)" }}
            formatter={(value, name) => [
              Math.round(Number(value ?? 0)),
              name === "current" ? "Current" : "Benchmark",
            ]}
          />
          <Bar dataKey="current" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={fillMap[entry.status]} />
            ))}
          </Bar>
          <Bar dataKey="target" radius={[10, 10, 0, 0]} fill="#9bd2d0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
