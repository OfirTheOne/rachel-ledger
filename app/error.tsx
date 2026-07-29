"use client";
import { useT } from "@/app/ui/LanguageProvider";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, textAlign: "center" }}>
      <h2 style={{ color: "var(--color-text)" }}>{t("error.title")}</h2>
      <p style={{ color: "var(--color-text-muted)" }}>{t("error.body")}</p>
      <button onClick={reset} style={{ marginTop: 12, background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "10px 16px" }}>
        {t("error.retry")}
      </button>
    </div>
  );
}
