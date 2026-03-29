import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareCall",
  description: "AI-powered post-discharge patient support",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
