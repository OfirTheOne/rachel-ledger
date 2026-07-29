"use client";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CHART_COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)","var(--color-chart-6)"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function CategoryChart({ data }: { data: { name: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => `₪${(Number(v) / 100).toFixed(2)}`} />
        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DayOfWeekChart({ data }: { data: { day: number; total: number }[] }) {
  const shaped = data.map((d) => ({ label: DOW[d.day], total: d.total }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={shaped}>
        <XAxis dataKey="label" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(v) => `₪${(Number(v) / 100).toFixed(2)}`} />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="var(--color-chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
