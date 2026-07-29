"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import { agorotFromInput } from "@/lib/format";
import { Card } from "@/app/ui/Card";

type Category = { id: string; name: string };
const METHODS = ["Cash","Credit","Debit","BankTransfer","Other"];

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

  const field = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", marginTop: 6 } as const;
  const label = { fontSize: 13, color: "var(--color-text-muted)" } as const;

  return (
    <Card>
      <h1 style={{ marginBottom: 16, color: "var(--color-text)" }}>Add expense</h1>
      <label style={label}>Amount (₪)<input style={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <label style={label}>Date<input style={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label style={label}>Shop<input style={field} value={shop} onChange={(e) => setShop(e.target.value)} onBlur={suggest} /></label>
      <label style={label}>Note<input style={field} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <label style={label}>Category
        <select style={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <button onClick={suggest} disabled={suggesting || !shop} style={{ marginTop: 8, fontSize: 13, background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-accent)", borderRadius: 10, padding: "6px 10px" }}>
        {suggesting ? "Thinking…" : "✨ AI suggest category"}
      </button>
      <label style={label}>Payment
        <select style={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <button onClick={save} disabled={saving} style={{ marginTop: 20, width: "100%", background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "12px" }}>
        {saving ? "Saving…" : "Save expense"}
      </button>
    </Card>
  );
}
