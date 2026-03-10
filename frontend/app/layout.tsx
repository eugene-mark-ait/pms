import type { Metadata } from "next";
import "./globals.css";
import ProductNameSuggestions from "@/components/ProductNameSuggestions";

export const metadata: Metadata = {
  title: "PMS - Property Management",
  description: "SaaS Property Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface-50 text-surface-900">
        <ProductNameSuggestions />
        {children}
      </body>
    </html>
  );
}
