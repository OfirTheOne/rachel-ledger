"use client";
import { useEffect, useState } from "react";
import { getJSON, postJSON } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { CategoryChart, DayOfWeekChart } from "@/app/ui/Charts";

type Kpis = {
  range: string; start: string; end: string; total: number; count: number;
  byCategory: { name: string; total: number }[];
  byShop: { shop: string; total: number }[];
  byDayOfWeek: { day: number; total: number }[];
};

export default function Dashboard() {
  const [range, setRange] = useState<"week" | "month">("month");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [insights, setInsights] = useState<{ insights: string[]; suggestions: string[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    getJSON<Kpis>(`/api/kpis?range=${range}`).then(setKpis);
  }, [range]);

  async function analyze() {
    if (!kpis) return;
    setAnalyzing(true); setAiError(false);
    try {
      const r = await postJSON<{ insights: string[]; suggestions: string[] }>("/api/gemini/insights", {
        periodSummary: { total: kpis.total, byCategory: kpis.byCategory, byShop: kpis.byShop, byDayOfWeek: kpis.byDayOfWeek },
      });
      setInsights(r);
    } catch { setAiError(true); }
    finally { setAnalyzing(false); }
  }

  const tabBtn = (active: boolean) => ({
    flex: 1, padding: "8px", borderRadius: 10, border: "1px solid var(--color-border)",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "var(--color-accent-contrast)" : "var(--color-text-muted)",
  }) as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabBtn(range === "week")} onClick={() => setRange("week")}>This week</button>
        <button style={tabBtn(range === "month")} onClick={() => setRange("month")}>This month</button>
      </div>

      {!kpis ? <Card>Loading…</Card> : (
        <>
          <Card>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Total spend</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>{formatMoney(kpis.total)}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{kpis.count} expenses</div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>By category</h2>
            {kpis.byCategory.length ? <CategoryChart data={kpis.byCategory} /> : <p style={{ color: "var(--color-text-muted)" }}>No data</p>}
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>By day of week</h2>
            <DayOfWeekChart data={kpis.byDayOfWeek} />
          </Card>

          <Card>
            <h2 style={{ fontSize: 15, color: "var(--color-text)", marginBottom: 8 }}>Top shops</h2>
            {kpis.byShop.slice(0, 5).map((s) => (
              <div key={s.shop} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--color-text)" }}>
                <span>{s.shop}</span><span>{formatMoney(s.total)}</span>
              </div>
            ))}
            {!kpis.byShop.length && <p style={{ color: "var(--color-text-muted)" }}>No data</p>}
          </Card>

          <Card>
            <button onClick={analyze} disabled={analyzing} style={{ width: "100%", background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "12px" }}>
              {analyzing ? "Analyzing…" : "✨ Analyze my spending"}
            </button>
            {aiError && <p style={{ color: "var(--color-text-muted)", marginTop: 10 }}>Couldn't analyze right now — try again.</p>}
            {insights && (
              <div style={{ marginTop: 14 }}>
                <h3 style={{ fontSize: 14, color: "var(--color-text)" }}>Insights</h3>
                <ul style={{ color: "var(--color-text-muted)", fontSize: 14, paddingLeft: 18 }}>
                  {insights.insights.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
                <h3 style={{ fontSize: 14, color: "var(--color-text)", marginTop: 10 }}>Suggestions</h3>
                <ul style={{ color: "var(--color-text-muted)", fontSize: 14, paddingLeft: 18 }}>
                  {insights.suggestions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
