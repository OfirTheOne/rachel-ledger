"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/app/ui/LanguageProvider";

const LINKS = [
  { href: "/", key: "nav.overview" },
  { href: "/add", key: "nav.add" },
  { href: "/expenses", key: "nav.ledger" },
];

export function Nav() {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <nav
      className="rise"
      style={{
        display: "flex",
        gap: 4,
        padding: 5,
        marginBottom: 22,
        borderRadius: 999,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        animationDelay: "0.05s",
      }}
    >
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              padding: "9px 10px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              letterSpacing: "-0.01em",
              color: active ? "var(--color-accent-contrast)" : "var(--color-text-muted)",
              background: active
                ? "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))"
                : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              transition: "color 0.2s ease, background 0.2s ease",
            }}
          >
            {t(l.key)}
          </Link>
        );
      })}
    </nav>
  );
}
