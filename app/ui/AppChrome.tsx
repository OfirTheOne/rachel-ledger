"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/app/ui/Nav";
import { useT } from "@/app/ui/LanguageProvider";

export function AppChrome() {
  const pathname = usePathname();
  const { t } = useT();

  // The login screen renders clean, without the app header/nav.
  if (pathname === "/login") return null;

  return (
    <>
      <header
        className="rise"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app_icon.png"
            alt={t("header.brand")}
            width={42}
            height={42}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              objectFit: "cover",
              display: "block",
              border: "2px solid #ffffff",
              boxSizing: "content-box",
              boxShadow: "var(--shadow-md)",
            }}
          />
          <div style={{ lineHeight: 1 }}>
            <div
              className="font-display"
              style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              {t("header.brand")}
            </div>
            <div
              className="eyebrow"
              style={{ marginTop: 4, letterSpacing: "0.22em", fontSize: 10 }}
            >
              {t("header.tagline")}
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          aria-label={t("header.settings")}
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 12,
            color: "var(--color-text-muted)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </Link>
      </header>

      <Nav />
    </>
  );
}
