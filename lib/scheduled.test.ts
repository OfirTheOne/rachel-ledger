import { describe, it, expect } from "vitest";
import { splitInstallments, installmentDates, duePeriods } from "./scheduled";

describe("splitInstallments", () => {
  it("splits evenly and sums exactly", () => {
    const parts = splitInstallments(400000, 10); // ₪4000 / 10
    expect(parts).toHaveLength(10);
    expect(parts.every((p) => p === 40000)).toBe(true);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(400000);
  });
  it("puts the rounding remainder on the last payment", () => {
    const parts = splitInstallments(400005, 10);
    expect(parts.slice(0, 9).every((p) => p === 40000)).toBe(true);
    expect(parts[9]).toBe(40005);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(400005);
  });
  it("handles count of 1 and invalid count", () => {
    expect(splitInstallments(1234, 1)).toEqual([1234]);
    expect(splitInstallments(1234, 0)).toEqual([]);
  });
});

describe("installmentDates", () => {
  it("advances one month at a time keeping the day", () => {
    expect(installmentDates("2026-08-15", 3)).toEqual(["2026-08-15", "2026-09-15", "2026-10-15"]);
  });
  it("clamps the day to the month length and rolls over the year", () => {
    expect(installmentDates("2026-11-30", 4)).toEqual([
      "2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28",
    ]);
  });
});

describe("duePeriods", () => {
  it("returns 1st-of-month periods through the target, minus existing", () => {
    expect(duePeriods("2026-06-01", "2026-08-15", ["2026-06-01"])).toEqual([
      "2026-07-01", "2026-08-01",
    ]);
  });
  it("is empty when everything is already generated", () => {
    expect(duePeriods("2026-08-01", "2026-08-20", ["2026-08-01"])).toEqual([]);
  });
});
