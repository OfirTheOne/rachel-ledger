export type ExpenseRow = { amountAgorot: number; date: string; categoryName: string; shop: string };

export function aggregateKpis(rows: ExpenseRow[]) {
  let total = 0;
  const cat = new Map<string, number>();
  const shop = new Map<string, number>();
  const dow = Array.from({ length: 7 }, (_, day) => ({ day, total: 0 }));

  for (const r of rows) {
    total += r.amountAgorot;
    cat.set(r.categoryName, (cat.get(r.categoryName) ?? 0) + r.amountAgorot);
    shop.set(r.shop, (shop.get(r.shop) ?? 0) + r.amountAgorot);
    const d = new Date(`${r.date}T00:00:00`).getDay(); // 0=Sun..6=Sat
    dow[d].total += r.amountAgorot;
  }
  const byCategory = [...cat].map(([name, t]) => ({ name, total: t })).sort((a, b) => b.total - a.total);
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
