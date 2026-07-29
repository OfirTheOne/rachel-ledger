"use client";
import { useEffect, useState } from "react";
import { getJSON, del } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";

type Expense = { id: string; amountAgorot: number; date: string; shop: string; note: string | null; category: { name: string } };

export default function ExpensesPage() {
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

  if (loading) return <Card>Loading…</Card>;
  if (items.length === 0) return <Card>No expenses yet. Add your first one.</Card>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((e) => (
        <Card key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--color-text)", fontWeight: 600 }}>{e.shop}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              {e.category.name} · {e.date.slice(0, 10)}{e.note ? ` · ${e.note}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{formatMoney(e.amountAgorot)}</span>
            <button onClick={() => remove(e.id)} style={{ background: "transparent", border: 0, color: "var(--color-text-muted)", cursor: "pointer" }}>✕</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
