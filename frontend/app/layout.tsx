import type { Metadata } from "next";
import "./globals.css";
import ProductNameSuggestions from "@/components/ProductNameSuggestions";
import ThemeProvider from "@/components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100">
        <ThemeProvider>
          <ProductNameSuggestions />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
