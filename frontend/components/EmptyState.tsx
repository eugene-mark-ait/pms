"use client";

/** Shared empty state: icon, "No items available", centered and responsive. */
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center min-h-[200px] w-full">
      <svg
        className="w-12 h-12 text-surface-400 dark:text-surface-500 mb-3 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.25}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-surface-600 dark:text-surface-400 font-medium">No items available.</p>
    </div>
  );
}
