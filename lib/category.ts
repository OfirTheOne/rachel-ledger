import type { Locale } from "@/lib/i18n";

export type CategoryNames = { nameEn?: string | null; nameHe?: string | null };

/**
 * Resolve a category's display label for the current UI language.
 * Prefers the current locale's name; falls back to the other language when the
 * preferred one is missing (the second-language name is optional).
 */
export function categoryLabel(cat: CategoryNames, locale: Locale): string {
  const he = cat.nameHe?.trim() || "";
  const en = cat.nameEn?.trim() || "";
  return locale === "he" ? he || en : en || he;
}

// Category chart hues (mirrors --color-chart-1..6 in app/theme.css). Colouring
// by a stable id keeps a category's colour identical across languages.
export const CHART_COLOR_COUNT = 6;

export function categoryColorIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % CHART_COLOR_COUNT;
  return h;
}

export function categoryColorVar(id: string): string {
  return `var(--color-chart-${categoryColorIndex(id) + 1})`;
}
