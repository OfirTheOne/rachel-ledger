"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { paletteAttr, type Palette } from "@/lib/palette";

type Ctx = {
  palette: Palette;
  setPalette: (next: Palette) => void;
};

const PaletteContext = createContext<Ctx | null>(null);

export function PaletteProvider({
  palette,
  children,
}: {
  palette: Palette;
  children: React.ReactNode;
}) {
  const setPalette = useCallback((next: Palette) => {
    document.cookie = `palette=${next}; path=/; max-age=31536000; samesite=lax`;
    // Apply immediately for a snappy swap; the server layout also sets the
    // attribute on next load so there is no flash.
    const attr = paletteAttr(next);
    if (attr) document.documentElement.setAttribute("data-palette", attr);
    else document.documentElement.removeAttribute("data-palette");
  }, []);

  const value = useMemo<Ctx>(() => ({ palette, setPalette }), [palette, setPalette]);
  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePalette(): Ctx {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used within PaletteProvider");
  return ctx;
}
