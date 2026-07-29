import type { Metadata, Viewport } from "next";
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
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}
          >
            <span
              aria-hidden
              style={{
                display: "grid",
                placeItems: "center",
                width: 40,
                height: 40,
                borderRadius: 13,
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "var(--color-accent-contrast)",
                background:
                  "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
                boxShadow: "var(--shadow-md)",
              }}
            >
              ₪
            </span>
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
          </header>

          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
