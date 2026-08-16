// Colour palettes. Each id maps to a token block in app/theme.css
// (":root" for the default, ":root[data-palette=...]" for the rest).
// The active palette is stored in the "palette" cookie and applied on <html>.

export const PALETTES = ["sage", "blue", "earth", "lavender", "pink"] as const;
export type Palette = (typeof PALETTES)[number];

export const DEFAULT_PALETTE: Palette = "sage";

// The default "sage" palette lives on bare :root — it has no data-palette value.
export function paletteAttr(p: Palette): string | undefined {
  return p === DEFAULT_PALETTE ? undefined : p;
}

export function normalizePalette(value: string | undefined | null): Palette {
  return PALETTES.includes(value as Palette) ? (value as Palette) : DEFAULT_PALETTE;
}
