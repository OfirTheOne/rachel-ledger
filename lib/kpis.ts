export type ExpenseRow = {
  amountAgorot: number;
  date: string;
  categoryId: string;
  categoryNameEn: string | null;
  categoryNameHe: string | null;
  shop: string;
};

export function aggregateKpis(rows: ExpenseRow[]) {
  let total = 0;
  // Group categories by stable id, not by display name, so bilingual labels
  // never split or merge slices when the UI language changes.
  const cat = new Map<string, { nameEn: string | null; nameHe: string | null; total: number }>();
  const shop = new Map<string, number>();
  const dow = Array.from({ length: 7 }, (_, day) => ({ day, total: 0 }));

  for (const r of rows) {
    total += r.amountAgorot;
    const cur = cat.get(r.categoryId) ?? { nameEn: r.categoryNameEn, nameHe: r.categoryNameHe, total: 0 };
    cur.total += r.amountAgorot;
    cat.set(r.categoryId, cur);
    shop.set(r.shop, (shop.get(r.shop) ?? 0) + r.amountAgorot);
    const d = new Date(`${r.date}T00:00:00`).getDay(); // 0=Sun..6=Sat
    dow[d].total += r.amountAgorot;
  }
  const byCategory = [...cat]
    .map(([id, v]) => ({ id, nameEn: v.nameEn, nameHe: v.nameHe, total: v.total }))
    .sort((a, b) => b.total - a.total);
  const byShop = [...shop].map(([s, t]) => ({ shop: s, total: t })).sort((a, b) => b.total - a.total);
  return { total, count: rows.length, byCategory, byShop, byDayOfWeek: dow };
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function periodRange(range: "week" | "month", anchorISO: string) {
  const anchor = new Date(`${anchorISO}T00:00:00Z`);
  if (range === "week") {
    const start = new Date(anchor);
    start.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay()); // back to Sunday
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    return { start: iso(start), end: iso(end) };
  }
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1));
  return { start: iso(start), end: iso(end) };
}
