import { describe, it, expect } from "vitest";
import { budgetProgress } from "./budget";

describe("budgetProgress", () => {
  it("computes pct and remaining under budget", () => {
    const p = budgetProgress(20000, 80000); // ₪200 of ₪800
    expect(p.pct).toBe(25);
    expect(p.rawPct).toBe(25);
    expect(p.remainingAgorot).toBe(60000);
    expect(p.over).toBe(false);
  });

  it("caps the bar pct at 100 but keeps rawPct over 100 when over budget", () => {
    const p = budgetProgress(100000, 80000); // ₪1000 of ₪800
    expect(p.pct).toBe(100);
    expect(p.rawPct).toBeCloseTo(125);
    expect(p.remainingAgorot).toBe(-20000);
    expect(p.over).toBe(true);
  });

  it("exactly at cap is not over", () => {
    const p = budgetProgress(80000, 80000);
    expect(p.pct).toBe(100);
    expect(p.over).toBe(false);
    expect(p.remainingAgorot).toBe(0);
  });

  it("handles a zero/absent cap safely", () => {
    const p = budgetProgress(5000, 0);
    expect(p).toEqual({ pct: 0, rawPct: 0, remainingAgorot: 0, over: false });
  });
});
