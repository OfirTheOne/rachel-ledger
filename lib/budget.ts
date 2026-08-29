// Budget progress math, isolated and unit-tested (mirrors lib/kpis, lib/category).

export type BudgetProgress = {
  pct: number; // 0..100, clamped for the bar width
  rawPct: number; // uncapped, so callers can show ">100%"
  remainingAgorot: number; // cap - spent; negative when over
  over: boolean;
};

export function budgetProgress(spentAgorot: number, capAgorot: number): BudgetProgress {
  if (capAgorot <= 0) {
    return { pct: 0, rawPct: 0, remainingAgorot: 0, over: false };
  }
  const rawPct = (spentAgorot / capAgorot) * 100;
  return {
    pct: Math.max(0, Math.min(100, rawPct)),
    rawPct,
    remainingAgorot: capAgorot - spentAgorot,
    over: spentAgorot > capAgorot,
  };
}
