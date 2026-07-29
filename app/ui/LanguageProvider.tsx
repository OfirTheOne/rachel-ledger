"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { translate, type Locale } from "@/lib/i18n";

type T = (key: string, params?: Record<string, string | number>) => string;

type Ctx = {
  locale: Locale;
  t: T;
  setLocale: (next: Locale) => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = useCallback<T>((key, params) => translate(locale, key, params), [locale]);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    // Reload so the server layout re-renders <html lang dir> for the new locale.
    window.location.reload();
  }, []);

  const value = useMemo<Ctx>(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}
