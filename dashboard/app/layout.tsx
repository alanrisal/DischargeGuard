import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DischargeGuard",
  description: "AI-powered post-discharge patient support",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
