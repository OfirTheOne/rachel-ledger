"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { useT } from "@/app/ui/LanguageProvider";
import { dowShort, dowFull } from "@/lib/i18n";

const CHART_VARS = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
  "--color-chart-6",
];

/* ---- Shared themed tooltip ---- */
function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string; name?: string; payload?: { _label?: string } }[];
  label?: string | number;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const title = p.payload?._label ?? p.name ?? (typeof label === "string" ? label : "");
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "9px 12px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {title && (
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2 }}>
          {title}
        </div>
      )}
      <div
        className="mono"
        style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}
      >
        {formatMoney(Number(p.value))}
      </div>
    </div>
  );
}

/* ---- Category donut with center total + legend ---- */
export function CategoryChart({ data }: { data: { name: string; total: number }[] }) {
  const { t } = useT();
  const total = data.reduce((s, d) => s + d.total, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ position: "relative", height: 216 }}>
        <ResponsiveContainer width="100%" height={216}>
          <PieChart>
            <defs>
              {CHART_VARS.map((v, i) => (
                <linearGradient key={i} id={`slice-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={`var(${v})`} stopOpacity={1} />
                  <stop offset="100%" stopColor={`var(${v})`} stopOpacity={0.62} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 2.5 : 0}
              cornerRadius={7}
              stroke="var(--color-surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#slice-${i % CHART_VARS.length})`} />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div>
            <div className="eyebrow" style={{ fontSize: 10 }}>{t("chart.total")}</div>
            <div
              className="mono"
              style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}
            >
              {formatMoney(total)}
            </div>
          </div>
        </div>
      </div>

      <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 8 }}>
        {data.map((d, i) => {
          const pct = total ? Math.round((d.total / total) * 100) : 0;
          return (
            <li
              key={d.name}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}
            >
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  flexShrink: 0,
                  background: `var(${CHART_VARS[i % CHART_VARS.length]})`,
                }}
              />
              <span style={{ color: "var(--color-text)", flex: 1 }}>{d.name}</span>
              <span style={{ color: "var(--color-text-muted)", fontSize: 12, width: 34, textAlign: "end" }}>
                {pct}%
              </span>
              <span
                className="mono"
                style={{ color: "var(--color-text)", fontWeight: 500, minWidth: 74, textAlign: "end" }}
              >
                {formatMoney(d.total)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---- Day-of-week gradient bars, peak day highlighted ---- */
export function DayOfWeekChart({ data }: { data: { day: number; total: number }[] }) {
  const { locale } = useT();
  const short = dowShort(locale);
  const full = dowFull(locale);
  const shaped = data.map((d) => ({ label: short[d.day], _label: full[d.day], total: d.total }));
  const max = Math.max(...shaped.map((s) => s.total), 0);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={shaped} margin={{ top: 8, left: 0, right: 0, bottom: 0 }} barCategoryGap="24%">
        <defs>
          <linearGradient id="dow-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
          </linearGradient>
          <linearGradient id="dow-bar-peak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-accent-2)" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={2}
        />
        <YAxis hide />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--color-accent-soft)", radius: 8 }} />
        <Bar dataKey="total" radius={[8, 8, 3, 3]} maxBarSize={38} isAnimationActive={false}>
          {shaped.map((s, i) => (
            <Cell key={i} fill={s.total === max && max > 0 ? "url(#dow-bar-peak)" : "url(#dow-bar)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
