"use client";
import { useState } from "react";
import { postJSON } from "@/lib/api";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";

export default function LoginPage() {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      await postJSON("/api/login", { password });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") ? next : "/";
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "78vh", display: "grid", placeItems: "center" }}>
      <Card delay={0} style={{ width: "100%", maxWidth: 380, padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app_icon.png"
            alt={t("header.brand")}
            width={56}
            height={56}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              objectFit: "cover",
              border: "2px solid #ffffff",
              boxSizing: "content-box",
              boxShadow: "var(--shadow-md)",
              margin: "0 auto 14px",
              display: "block",
            }}
          />
          <h1 className="font-display" style={{ fontSize: 25 }}>{t("login.title")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            {t("login.subtitle")}
          </p>
        </div>

        <form onSubmit={submit}>
          <label className="eyebrow" htmlFor="password" style={{ display: "block", marginBottom: 8 }}>
            {t("login.password")}
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder={t("login.passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 13,
              border: `1px solid ${error ? "#c05b4d" : "var(--color-border)"}`,
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              outline: "none",
              fontSize: 15,
            }}
          />

          {error && (
            <p style={{ color: "#c05b4d", fontSize: 13, marginTop: 10 }}>{t("login.error")}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            style={{
              width: "100%",
              marginTop: 18,
              cursor: submitting || !password ? "default" : "pointer",
              padding: "14px",
              border: 0,
              borderRadius: "var(--radius-sm)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-accent-contrast)",
              background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
              boxShadow: "var(--shadow-md)",
              opacity: submitting || !password ? 0.6 : 1,
            }}
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </Card>
    </div>
  );
}
