import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/app/ui/Nav";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ledger — quiet money",
  description: "A calm, tactile way to track personal spending.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#efeae0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 560,
            margin: "0 auto",
            padding: "clamp(20px, 5vw, 40px) 18px 72px",
          }}
        >
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
                alt="Ledger app icon"
                width={42}
                height={42}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid var(--color-hairline)",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <div style={{ lineHeight: 1 }}>
                <div
                  className="font-display"
                  style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}
                >
                  Ledger
                </div>
                <div
                  className="eyebrow"
                  style={{ marginTop: 4, letterSpacing: "0.22em", fontSize: 10 }}
                >
                  Quiet Money
                </div>
              </div>
            </div>

            <Link
              href="/settings"
              aria-label="Settings"
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
          {children}
        </div>
      </body>
    </html>
  );
}
