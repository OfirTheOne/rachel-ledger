"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getJSON, del } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";
import type { Locale } from "@/lib/i18n";
import { categoryLabel, categoryColorVar } from "@/lib/category";

type Expense = {
  id: string;
  amountAgorot: number;
  date: string;
  shop: string;
  note: string | null;
  category: { id: string; nameEn: string | null; nameHe: string | null };
  installmentSeq: number | null;
  installmentCount: number | null;
  recurringPaymentId: string | null;
};

function prettyDate(iso: string, locale: Locale) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 10.5,
  fontWeight: 600,
  lineHeight: 1,
  padding: "3px 6px",
  borderRadius: 6,
  color: "var(--color-accent)",
  background: "var(--color-accent-soft)",
};

export default function ExpensesPage() {
  const { t, locale } = useT();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setItems(await getJSON<Expense[]>("/api/expenses"));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await del(`/api/expenses/${id}`);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 66, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: "44px 24px" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }} aria-hidden>🪶</div>
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>{t("list.emptyTitle")}</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14.5, marginBottom: 20 }}>
          {t("list.emptyBody")}
        </p>
        <Link
          href="/add"
          style={{
            display: "inline-block",
            textDecoration: "none",
            padding: "12px 22px",
            borderRadius: "var(--radius-sm)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-accent-contrast)",
            background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {t("list.addCta")}
        </Link>
      </Card>
    );
  }

  const total = items.reduce((s, e) => s + e.amountAgorot, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        className="rise"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px 2px" }}
      >
        <div className="eyebrow">
          {t(items.length === 1 ? "list.entries.one" : "list.entries.other", { count: items.length })}
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {t("list.total", { amount: formatMoney(total) })}
        </div>
      </div>

      {items.map((e, i) => (
        <Card
          key={e.id}
          delay={Math.min(i, 6)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}
        >
          <span
            aria-hidden
            title={categoryLabel(e.category, locale)}
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "var(--color-surface-2)",
              position: "relative",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: categoryColorVar(e.category.id),
              }}
            />
          </span>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  color: "var(--color-text)",
                  fontWeight: 600,
                  fontSize: 15.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {e.shop}
              </span>
              {e.installmentSeq && e.installmentCount ? (
                <span className="mono" style={badgeStyle}>{e.installmentSeq}/{e.installmentCount}</span>
              ) : e.recurringPaymentId ? (
                <span style={badgeStyle} title="recurring">↻</span>
              ) : null}
            </div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 12.5, marginTop: 2 }}>
              {categoryLabel(e.category, locale)} · {prettyDate(e.date, locale)}
              {e.note ? ` · ${e.note}` : ""}
            </div>
          </div>

          <span
            className="mono"
            style={{ color: "var(--color-text)", fontWeight: 600, fontSize: 15.5, whiteSpace: "nowrap" }}
          >
            {formatMoney(e.amountAgorot)}
          </span>

          <button
            onClick={() => remove(e.id)}
            aria-label={`Delete ${e.shop}`}
            style={{
              flexShrink: 0,
              width: 30,
              height: 30,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              borderRadius: 9,
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-muted)",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </Card>
      ))}
    </div>
  );
}
