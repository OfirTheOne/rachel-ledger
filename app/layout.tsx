import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/app/ui/LanguageProvider";
import { AppChrome } from "@/app/ui/AppChrome";
import { dir, normalizeLocale } from "@/lib/i18n";

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
  title: "Rachel's Ledger",
  description: "A calm, tactile way to track personal spending.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#efeae0",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = normalizeLocale(store.get("lang")?.value);

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <LanguageProvider locale={locale}>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 560,
              margin: "0 auto",
              padding: "clamp(20px, 5vw, 40px) 18px 72px",
            }}
          >
            <AppChrome />
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
