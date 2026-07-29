"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import { agorotFromInput } from "@/lib/format";
import { Card } from "@/app/ui/Card";

type Category = { id: string; name: string };
const METHODS: { value: string; label: string }[] = [
  { value: "Cash", label: "Cash" },
  { value: "Credit", label: "Credit" },
  { value: "Debit", label: "Debit" },
  { value: "BankTransfer", label: "Transfer" },
  { value: "Other", label: "Other" },
];

export default function AddPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shop, setShop] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit");
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJSON<Category[]>("/api/categories").then((c) => { setCategories(c); if (c[0]) setCategoryId(c[0].id); });
  }, []);

  async function suggest() {
    if (!shop) return;
    setSuggesting(true);
    try {
      const r = await postJSON<{ suggestedCategory: string }>("/api/gemini/categorize", {
        shop, note, amount, categories: categories.map((c) => c.name),
      });
      const match = categories.find((c) => c.name === r.suggestedCategory);
      if (match) setCategoryId(match.id);
    } catch { /* graceful: keep manual choice */ }
    finally { setSuggesting(false); }
  }

  async function save() {
    const amountAgorot = agorotFromInput(amount);
    if (!Number.isInteger(amountAgorot) || amountAgorot <= 0 || !shop || !categoryId) return;
    setSaving(true);
    try {
      await postJSON("/api/expenses", { amountAgorot, date, categoryId, shop, note: note || undefined, paymentMethod });
      router.push("/expenses");
    } finally { setSaving(false); }
  }

  const canSave = amount !== "" && shop !== "" && categoryId !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Amount hero */}
      <Card variant="accent" delay={0} style={{ padding: "22px 24px" }}>
        <label
          className="eyebrow"
          htmlFor="amount"
          style={{ color: "var(--color-accent-contrast)", opacity: 0.8, display: "block" }}
        >
          Amount
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span
            className="mono"
            style={{ fontSize: 40, fontWeight: 500, color: "var(--color-accent-contrast)", opacity: 0.85 }}
          >
            ₪
          </span>
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mono"
            style={{
              flex: 1,
              width: "100%",
              minWidth: 0,
              border: 0,
              outline: "none",
              background: "transparent",
              color: "var(--color-accent-contrast)",
              fontSize: "clamp(40px, 13vw, 52px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              padding: 0,
            }}
          />
        </div>
      </Card>

      <Card delay={1} style={{ display: "grid", gap: 18 }}>
        <Field label="Shop">
          <input
            style={inputStyle}
            placeholder="e.g. Rami Levy"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            onBlur={suggest}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date">
            <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note">
            <input
              style={inputStyle}
              placeholder="optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>

        {/* Category chips */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="eyebrow">Category</span>
            <button
              type="button"
              onClick={suggest}
              disabled={suggesting || !shop}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: shop ? "pointer" : "default",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--color-accent)",
                background: "var(--color-accent-soft)",
                border: "1px solid transparent",
                borderRadius: 999,
                padding: "5px 11px",
                opacity: !shop ? 0.5 : 1,
              }}
            >
              <Sparkle spinning={suggesting} />
              {suggesting ? "Thinking…" : "AI suggest"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 14px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--color-accent-contrast)" : "var(--color-text)",
                    background: active
                      ? "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))"
                      : "var(--color-surface-2)",
                    border: `1px solid ${active ? "transparent" : "var(--color-border)"}`,
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    transition: "all 0.18s ease",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment segmented */}
        <div>
          <span className="eyebrow" style={{ display: "block", marginBottom: 10 }}>Paid with</span>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: 14,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            {METHODS.map((m) => {
              const active = m.value === paymentMethod;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    padding: "9px 4px",
                    borderRadius: 10,
                    border: 0,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--color-text)" : "var(--color-text-muted)",
                    background: active ? "var(--color-surface)" : "transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    transition: "all 0.18s ease",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <button
        onClick={save}
        disabled={saving || !canSave}
        className="rise"
        style={{
          width: "100%",
          cursor: canSave && !saving ? "pointer" : "default",
          padding: "16px",
          border: 0,
          borderRadius: "var(--radius)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-accent-contrast)",
          background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
          boxShadow: "var(--shadow-lg)",
          opacity: canSave && !saving ? 1 : 0.55,
          animationDelay: "0.18s",
          transition: "opacity 0.2s ease",
        }}
      >
        {saving ? "Saving…" : "Save expense"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 13,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  outline: "none",
  fontSize: 15,
};

function Sparkle({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
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
