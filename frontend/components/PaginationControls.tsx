"use client";

interface PaginationControlsProps {
  count: number;
  page: number;
  next: string | null;
  previous: string | null;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  loading?: boolean;
}

export function PaginationControls({
  count,
  page,
  next,
  previous,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  onNext,
  onPrevious,
  loading = false,
}: PaginationControlsProps) {
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const hasPages = count > pageSize;

  if (count === 0) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 py-3 border-t border-surface-200 dark:border-surface-700"
      aria-label="Pagination"
    >
      <div className="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
        <span>
          Showing {from}–{to} of {count}
        </span>
        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <label className="flex items-center gap-2">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-surface-300 dark:border-surface-600 px-2 py-1 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-h-[44px] sm:min-h-0"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {hasPages && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!previous || loading}
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!next || loading}
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] inline-flex items-center justify-center rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </nav>
  );
}
