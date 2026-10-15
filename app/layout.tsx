import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SK Traders DMS",
  description: "Distribution Management System for SK Traders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
