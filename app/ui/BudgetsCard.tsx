"use client";
import { useEffect, useState } from "react";
import { getJSON } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";
import { categoryLabel, categoryColorVar } from "@/lib/category";
import { budgetProgress } from "@/lib/budget";

type Budget = { id: string; categoryId: string | null; amountAgorot: number };
type Category = { id: string; nameEn: string | null; nameHe: string | null };
type MonthKpis = { total: number; byCategory: { id: string; total: number }[] };

const OVER_COLOR = "#c05b4d";

export function BudgetsCard({ delay }: { delay?: number }) {
  const { t, locale } = useT();
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpis, setKpis] = useState<MonthKpis | null>(null);

  useEffect(() => {
    getJSON<Budget[]>("/api/budgets").then(setBudgets).catch(() => setBudgets([]));
    getJSON<Category[]>("/api/categories").then(setCategories).catch(() => {});
    getJSON<MonthKpis>("/api/kpis?range=month").then(setKpis).catch(() => {});
  }, []);

  if (!budgets || budgets.length === 0) return null; // nothing to show until budgets exist

  const overall = budgets.find((b) => b.categoryId === null);
  const perCategory = budgets.filter((b) => b.categoryId !== null);
  const spentFor = (categoryId: string) => kpis?.byCategory.find((c) => c.id === categoryId)?.total ?? 0;

  return (
    <Card delay={delay} style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="eyebrow">{t("budget.eyebrow")}</div>
        <h2 style={{ fontSize: 21, marginTop: 4 }}>{t("budget.title")}</h2>
      </div>

      {overall && (
        <BudgetRow
          label={t("budget.overall")}
          color="var(--color-accent)"
          spent={kpis?.total ?? 0}
          cap={overall.amountAgorot}
          t={t}
          emphasize
        />
      )}

      {perCategory.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {perCategory.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            return (
              <BudgetRow
                key={b.id}
                label={cat ? categoryLabel(cat, locale) : "—"}
                color={categoryColorVar(b.categoryId as string)}
                spent={spentFor(b.categoryId as string)}
                cap={b.amountAgorot}
                t={t}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

function BudgetRow({
  label, color, spent, cap, t, emphasize,
}: {
  label: string;
  color: string;
  spent: number;
  cap: number;
  t: (k: string, p?: Record<string, string | number>) => string;
  emphasize?: boolean;
}) {
  const p = budgetProgress(spent, cap);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8 }}>
        <span style={{ color: "var(--color-text)", fontWeight: emphasize ? 600 : 500, fontSize: emphasize ? 15 : 14 }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
          {formatMoney(spent)} / {formatMoney(cap)}
        </span>
      </div>
      <div style={{ height: emphasize ? 9 : 7, borderRadius: 999, background: "var(--color-surface-2)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${p.pct}%`,
            borderRadius: 999,
            background: p.over ? OVER_COLOR : color,
            transition: "width 0.6s cubic-bezier(0.22,0.61,0.36,1)",
          }}
        />
      </div>
      <div style={{ marginTop: 5, fontSize: 12, color: p.over ? OVER_COLOR : "var(--color-text-muted)" }}>
        {p.over
          ? t("budget.over", { amount: formatMoney(-p.remainingAgorot) })
          : t("budget.remaining", { amount: formatMoney(p.remainingAgorot) })}
      </div>
    </div>
  );
}
