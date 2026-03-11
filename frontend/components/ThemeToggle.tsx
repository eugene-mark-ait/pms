"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className="inline-flex h-9 w-14 rounded-full border border-surface-200 bg-surface-100" aria-hidden />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-14 shrink-0 items-center rounded-full border border-surface-200 bg-surface-100 p-1 transition dark:border-surface-600 dark:bg-surface-800"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={`inline-block h-7 w-7 rounded-full bg-white shadow ring-0 transition dark:bg-surface-700 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
