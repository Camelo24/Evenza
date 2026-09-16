import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Evenza — Celebrate with confidence", template: "%s · Evenza" },
  description: "Cameroon’s trusted event vendor marketplace with verified professionals and escrow-protected payments.",
  keywords: ["Cameroon events", "event vendors", "wedding vendors", "escrow", "Douala", "Yaoundé"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
