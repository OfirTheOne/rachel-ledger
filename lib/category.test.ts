import { describe, it, expect } from "vitest";
import { categoryLabel, categoryColorIndex, CHART_COLOR_COUNT } from "./category";

describe("categoryLabel", () => {
  const both = { nameEn: "Groceries", nameHe: "מכולת" };

  it("shows the locale's name when present", () => {
    expect(categoryLabel(both, "en")).toBe("Groceries");
    expect(categoryLabel(both, "he")).toBe("מכולת");
  });

  it("falls back to the other language when the preferred one is missing", () => {
    expect(categoryLabel({ nameEn: "Rent", nameHe: null }, "he")).toBe("Rent");
    expect(categoryLabel({ nameEn: null, nameHe: "שכר דירה" }, "en")).toBe("שכר דירה");
  });

  it("treats blank/whitespace names as missing", () => {
    expect(categoryLabel({ nameEn: "  ", nameHe: "מכולת" }, "en")).toBe("מכולת");
  });
});

describe("categoryColorIndex", () => {
  it("is deterministic and within range", () => {
    const id = "clx123abc";
    expect(categoryColorIndex(id)).toBe(categoryColorIndex(id));
    expect(categoryColorIndex(id)).toBeGreaterThanOrEqual(0);
    expect(categoryColorIndex(id)).toBeLessThan(CHART_COLOR_COUNT);
  });
});
