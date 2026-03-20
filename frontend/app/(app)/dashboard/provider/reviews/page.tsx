"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useCursorInfiniteScroll } from "@/hooks/useCursorInfiniteScroll";

export interface ProviderReviewItem {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  reviewer_display?: string;
  service_title?: string | null;
  service?: string;
}

interface MyServiceOption {
  id: string;
  title: string;
}

export default function ProviderReviewsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ratingFilter, setRatingFilter] = useState("");
  const [serviceIdFilter, setServiceIdFilter] = useState("");
  const [services, setServices] = useState<MyServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const isProvider = user?.role_names?.includes("service_provider");

  const reviewParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (ratingFilter) p.rating = ratingFilter;
    if (serviceIdFilter) p.service_id = serviceIdFilter;
    return p;
  }, [ratingFilter, serviceIdFilter]);

  const {
    items: reviews,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    sentinelRef,
  } = useCursorInfiniteScroll<ProviderReviewItem>({
    endpoint: "/marketplace/my-reviews/",
    params: reviewParams,
    pageSize: 15,
    enabled: isProvider === true,
    parseResponse: (data) => {
      const d = data as { results?: ProviderReviewItem[]; next?: string | null; count?: number | null };
      return {
        results: Array.isArray(d?.results) ? d.results : [],
        next: d?.next ?? null,
        count: d?.count ?? undefined,
      };
    },
  });

  const onRatingFilterChange = useCallback((value: string) => {
    setRatingFilter(value);
  }, []);

  const onServiceFilterChange = useCallback((value: string) => {
    setServiceIdFilter(value);
  }, []);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isProvider) return;
    setServicesLoading(true);
    api
      .get<{ results?: { id: string; title: string }[] }>("/marketplace/my-services/")
      .then((res) => {
        const raw = res.data?.results ?? [];
        const opts = raw
          .map((s) => ({ id: s.id, title: s.title || "Untitled" }))
          .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
        setServices(opts);
      })
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [isProvider]);

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-8">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Reviews</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  const hasActiveFilter = Boolean(ratingFilter || serviceIdFilter);
  const headingCount = hasActiveFilter && totalCount != null ? totalCount : null;

  const emptyMessage = (() => {
    if (!hasActiveFilter) return "No reviews yet.";
    if (serviceIdFilter && ratingFilter) return "No reviews match these filters.";
    if (serviceIdFilter) return "No reviews for this service yet.";
    return "No reviews match this filter.";
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Customer reviews</h1>
          <p className="mt-1 text-surface-600 dark:text-surface-400">
            Ratings and feedback across your services
            {headingCount != null ? ` · ${headingCount} match${headingCount !== 1 ? "es" : ""}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="provider-review-service-filter" className="text-sm text-surface-600 dark:text-surface-400">
              Service
            </label>
            <select
              id="provider-review-service-filter"
              value={serviceIdFilter}
              onChange={(e) => onServiceFilterChange(e.target.value)}
              disabled={servicesLoading}
              className="min-w-[12rem] rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="provider-review-rating-filter" className="text-sm text-surface-600 dark:text-surface-400">
              Stars
            </label>
            <select
              id="provider-review-rating-filter"
              value={ratingFilter}
              onChange={(e) => onRatingFilterChange(e.target.value)}
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>{n} stars</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading && !reviews.length ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading reviews…</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                    {"★".repeat(Math.min(5, Math.round(r.rating)))}
                    {"☆".repeat(5 - Math.min(5, Math.round(r.rating)))}
                  </span>
                  {r.service_title && (
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{r.service_title}</span>
                  )}
                  {r.reviewer_display && (
                    <span className="text-sm text-surface-600 dark:text-surface-400">· {r.reviewer_display}</span>
                  )}
                  <span className="text-xs text-surface-500 dark:text-surface-400 ml-auto">
                    {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </div>
                {r.review ? (
                  <p className="mt-2 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{r.review}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {hasMore && (
            <div ref={sentinelRef} className="min-h-[48px] flex justify-center items-center py-4">
              {loadingMore && (
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
