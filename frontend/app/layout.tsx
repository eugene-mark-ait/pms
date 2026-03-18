import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ProductNameSuggestions from "@/components/ProductNameSuggestions";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mahaliwise - Property Management",
  description: "The financial operating system for rental housing. Property owners, tenants, and embedded financial services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100`}>
        <ThemeProvider>
          <ProductNameSuggestions />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
