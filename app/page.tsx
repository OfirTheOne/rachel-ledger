"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getJSON, postJSON } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { CategoryChart, DayOfWeekChart } from "@/app/ui/Charts";
import { useT } from "@/app/ui/LanguageProvider";
import { categoryLabel } from "@/lib/category";

type Kpis = {
  range: string; start: string; end: string; total: number; count: number;
  byCategory: { id: string; nameEn: string | null; nameHe: string | null; total: number }[];
  byShop: { shop: string; total: number }[];
  byDayOfWeek: { day: number; total: number }[];
};

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 style={{ fontSize: 21, marginTop: 4 }}>{title}</h2>
    </div>
  );
}

export default function Dashboard() {
  const { t, locale } = useT();
  const [range, setRange] = useState<"week" | "month">("month");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [insights, setInsights] = useState<{ insights: string[]; suggestions: string[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    setKpis(null);
    getJSON<Kpis>(`/api/kpis?range=${range}`).then(setKpis);
  }, [range]);

  useEffect(() => {
    (async () => {
      await postJSON("/api/recurring/run", {}).catch(() => {});
      const occ = await getJSON<unknown[]>("/api/recurring/occurrences").catch(() => []);
      setDueCount(occ.length);
    })();
  }, []);

  async function analyze() {
    if (!kpis) return;
    setAnalyzing(true); setAiError(false);
    try {
      const r = await postJSON<{ insights: string[]; suggestions: string[] }>("/api/gemini/insights", {
        locale,
        periodSummary: { total: kpis.total, byCategory: kpis.byCategory, byShop: kpis.byShop, byDayOfWeek: kpis.byDayOfWeek },
      });
      setInsights(r);
    } catch { setAiError(true); }
    finally { setAnalyzing(false); }
  }

  const periodLabel = range === "week" ? t("dash.week") : t("dash.month");
  const maxShop = kpis?.byShop[0]?.total ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {dueCount > 0 && (
        <Link
          href="/recurring"
          className="rise"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            color: "var(--color-accent)",
            background: "var(--color-accent-soft)",
            border: "1px solid transparent",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>↻ {t("dash.due", { count: dueCount })}</span>
          <span style={{ opacity: 0.8 }}>{t("dash.dueReview")} ›</span>
        </Link>
      )}

      {/* Range segmented control */}
      <div
        className="rise"
        style={{
          display: "flex",
          gap: 4,
          padding: 5,
          borderRadius: 999,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "0.08s",
        }}
      >
        {(["week", "month"] as const).map((r) => {
          const active = range === r;
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                flex: 1,
                cursor: "pointer",
                padding: "9px",
                borderRadius: 999,
                border: 0,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--color-accent-contrast)" : "var(--color-text-muted)",
                background: active
                  ? "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))"
                  : "transparent",
                transition: "color 0.2s ease, background 0.2s ease",
              }}
            >
              {r === "week" ? t("dash.week") : t("dash.month")}
            </button>
          );
        })}
      </div>

      {!kpis ? (
        <>
          <div className="skeleton" style={{ height: 150 }} />
          <div className="skeleton" style={{ height: 300, animationDelay: "0.1s" }} />
        </>
      ) : (
        <>
          {/* Hero total */}
          <Card variant="accent" delay={0} style={{ padding: 24, overflow: "hidden" }}>
            <div
              className="eyebrow"
              style={{ color: "var(--color-accent-contrast)", opacity: 0.8 }}
            >
              {t("dash.totalSpent")} · {periodLabel}
            </div>
            <div
              className="mono"
              style={{
                fontSize: "clamp(40px, 12vw, 54px)",
                fontWeight: 600,
                lineHeight: 1.02,
                marginTop: 10,
                letterSpacing: "-0.03em",
              }}
            >
              {formatMoney(kpis.total)}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "var(--color-accent-contrast)",
                opacity: 0.85,
              }}
            >
              {t(
                kpis.count === 1 ? "dash.expensesRecorded.one" : "dash.expensesRecorded.other",
                { count: kpis.count },
              )}
            </div>
          </Card>

          {/* By category donut */}
          <Card delay={1}>
            <SectionTitle eyebrow={t("dash.eyebrow.where")} title={t("dash.byCategory")} />
            {kpis.byCategory.length ? (
              <CategoryChart
                data={kpis.byCategory.map((c) => ({
                  id: c.id,
                  name: categoryLabel(c, locale),
                  total: c.total,
                }))}
              />
            ) : (
              <Empty />
            )}
          </Card>

          {/* By day of week */}
          <Card delay={2}>
            <SectionTitle eyebrow={t("dash.eyebrow.rhythm")} title={t("dash.byDayOfWeek")} />
            <DayOfWeekChart data={kpis.byDayOfWeek} />
          </Card>

          {/* Top shops with mini bars */}
          <Card delay={3}>
            <SectionTitle eyebrow={t("dash.eyebrow.merchants")} title={t("dash.topShops")} />
            {kpis.byShop.length ? (
              <div style={{ display: "grid", gap: 14 }}>
                {kpis.byShop.slice(0, 5).map((s, i) => (
                  <div key={s.shop}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
                        <span
                          className="mono"
                          style={{ color: "var(--color-text-muted)", fontSize: 12, marginInlineEnd: 8 }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.shop}
                      </span>
                      <span className="mono" style={{ color: "var(--color-text)", fontWeight: 500 }}>
                        {formatMoney(s.total)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 999,
                        background: "var(--color-surface-2)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${maxShop ? (s.total / maxShop) * 100 : 0}%`,
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
                          transition: "width 0.6s cubic-bezier(0.22,0.61,0.36,1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Card>

          {/* AI insights */}
          <Card delay={4}>
            <SectionTitle eyebrow={t("dash.eyebrow.assistant")} title={t("dash.insights")} />
            <button
              onClick={analyze}
              disabled={analyzing}
              style={{
                width: "100%",
                cursor: analyzing ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px",
                border: 0,
                borderRadius: "var(--radius-sm)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-accent-contrast)",
                background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
                boxShadow: "var(--shadow-md)",
                opacity: analyzing ? 0.8 : 1,
              }}
            >
              <Sparkle spinning={analyzing} />
              {analyzing ? t("dash.analyzing") : t("dash.analyze")}
            </button>

            {aiError && (
              <p style={{ color: "var(--color-text-muted)", marginTop: 12, fontSize: 14 }}>
                {t("dash.aiError")}
              </p>
            )}

            {insights && (
              <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
                <InsightBlock title={t("dash.stoodOut")} items={insights.insights ?? []} accent="var(--color-accent)" />
                <InsightBlock title={t("dash.suggestions")} items={insights.suggestions ?? []} accent="var(--color-accent-2)" />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function InsightBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {items.map((t, i) => (
          <li key={i} style={{ display: "flex", gap: 12, fontSize: 14.5, lineHeight: 1.5 }}>
            <span
              aria-hidden
              style={{
                marginTop: 7,
                width: 7,
                height: 7,
                borderRadius: 999,
                flexShrink: 0,
                background: accent,
              }}
            />
            <span style={{ color: "var(--color-text)" }}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty() {
  const { t } = useT();
  return (
    <p style={{ color: "var(--color-text-muted)", fontSize: 14, padding: "8px 0" }}>
      {t("dash.empty")}
    </p>
  );
}

function Sparkle({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      style={spinning ? { animation: "spin 1.1s linear infinite" } : undefined}
      aria-hidden
    >
      <path
        d="M12 2l1.9 5.6a4 4 0 0 0 2.5 2.5L22 12l-5.6 1.9a4 4 0 0 0-2.5 2.5L12 22l-1.9-5.6a4 4 0 0 0-2.5-2.5L2 12l5.6-1.9a4 4 0 0 0 2.5-2.5L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}
