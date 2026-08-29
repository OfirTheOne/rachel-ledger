import { describe, it, expect } from "vitest";
import { aggregateKpis, periodRange } from "./kpis";

const rows = [
  { amountAgorot: 1000, date: "2026-07-27", categoryId: "c-groc", categoryNameEn: "Groceries", categoryNameHe: "מכולת", shop: "Shufersal" }, // Monday
  { amountAgorot: 500,  date: "2026-07-27", categoryId: "c-dine", categoryNameEn: "Dining",    categoryNameHe: "מסעדות", shop: "Cafe" },      // Monday
  { amountAgorot: 2000, date: "2026-07-31", categoryId: "c-groc", categoryNameEn: "Groceries", categoryNameHe: "מכולת", shop: "Rami Levy" }, // Friday
];

describe("aggregateKpis", () => {
  it("totals amount and count", () => {
    const k = aggregateKpis(rows);
    expect(k.total).toBe(3500);
    expect(k.count).toBe(3);
  });
  it("groups by category id (carrying both names) sorted desc", () => {
    const k = aggregateKpis(rows);
    expect(k.byCategory[0]).toEqual({ id: "c-groc", nameEn: "Groceries", nameHe: "מכולת", total: 3000 });
    expect(k.byCategory[1]).toEqual({ id: "c-dine", nameEn: "Dining", nameHe: "מסעדות", total: 500 });
  });
  it("groups by shop sorted desc", () => {
    const k = aggregateKpis(rows);
    expect(k.byShop[0].total).toBe(2000);
  });
  it("returns 7 day-of-week buckets, zero-filled, Sunday-first", () => {
    const k = aggregateKpis(rows);
    expect(k.byDayOfWeek).toHaveLength(7);
    expect(k.byDayOfWeek[0]).toEqual({ day: 0, total: 0 }); // Sunday
    expect(k.byDayOfWeek[1].total).toBe(1500); // Monday
    expect(k.byDayOfWeek[5].total).toBe(2000); // Friday
  });
  it("handles empty input", () => {
    const k = aggregateKpis([]);
    expect(k.total).toBe(0);
    expect(k.byDayOfWeek).toHaveLength(7);
  });
});

describe("periodRange", () => {
  it("computes a Sunday-start week", () => {
    const r = periodRange("week", "2026-07-29"); // Wednesday
    expect(r.start).toBe("2026-07-26"); // Sunday
    expect(r.end).toBe("2026-08-02");   // next Sunday (exclusive)
  });
  it("computes a calendar month", () => {
    const r = periodRange("month", "2026-07-15");
    expect(r.start).toBe("2026-07-01");
    expect(r.end).toBe("2026-08-01");
  });
});
