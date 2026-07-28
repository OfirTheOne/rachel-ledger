import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spending",
  description: "Calm personal expense tracking",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
