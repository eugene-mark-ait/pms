import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-surface-300 dark:text-surface-600">404</h1>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mt-4">
          Page not found
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mt-2">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-700 transition min-h-[44px] inline-flex items-center justify-center"
          >
            Go Home
          </Link>
          <Link
            href="/find-units"
            className="rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 px-5 py-2.5 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800 transition min-h-[44px] inline-flex items-center justify-center"
          >
            Browse Units
          </Link>
        </div>
      </div>
    </div>
  );
}
