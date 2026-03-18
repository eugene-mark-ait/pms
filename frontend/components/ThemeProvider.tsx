"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider: defaults to system preference (prefers-color-scheme).
 * User can override via the theme toggle in the app; preference is persisted.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="mahaliwise-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
