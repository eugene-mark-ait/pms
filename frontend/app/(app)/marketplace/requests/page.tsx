"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useCursorInfiniteScroll } from "@/hooks/useCursorInfiniteScroll";
import { SERVICE_CATEGORIES } from "@/components/forms/ServiceForm";
import { format } from "date-fns";

export interface ServiceRequestItem {
  id: string;
  service: string;
  service_title: string;
  service_category?: string;
  message: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
}

interface SummaryByService {
  service_id: string;
  service__title: string;
  service__category: string;
  count: number;
}

export default function MyRequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const [summary, setSummary] = useState<{ total: number; by_service: SummaryByService[] } | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === "" || v == null) p.delete(k);
        else p.set(k, v);
      });
      router.replace(`${pathname}?${p.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (category) params.category = category;

  const {
    items: requests,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    sentinelRef,
  } = useCursorInfiniteScroll<ServiceRequestItem>({
    endpoint: "/marketplace/my-sent-requests/",
    params,
    pageSize: 20,
    enabled: true,
    parseResponse: (data) => {
      const d = data as { results?: ServiceRequestItem[]; next?: string | null };
      return { results: d?.results ?? [], next: d?.next ?? null };
    },
  });

  useEffect(() => {
    api
      .get<{ total: number; by_service: SummaryByService[] }>("/marketplace/my-sent-requests/summary/")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, [requests.length]);

  async function handleCancel(req: ServiceRequestItem) {
    if (req.status !== "pending") return;
    try {
      await api.delete(`/marketplace/requests/${req.id}/`);
      refresh();
      if (summary) setSummary((s) => (s ? { ...s, total: Math.max(0, s.total - 1) } : null));
    } catch {
      alert("Failed to cancel request.");
    }
  }

  const total = summary?.total ?? requests.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My requests</h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">
          Service requests you’ve sent. Cancel pending ones or view status.
        </p>
      </div>

      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total requests</p>
        <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{total}</p>
      </div>

      {summary && summary.by_service.length > 0 && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">By service</h2>
          <ul className="space-y-2">
            {summary.by_service.map((s) => (
              <li key={s.service_id} className="flex justify-between text-sm">
                <span className="text-surface-700 dark:text-surface-300">{s.service__title}</span>
                <span className="font-medium text-surface-900 dark:text-surface-100">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-end p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700 mb-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-w-[120px]"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="actioned">Actioned</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Service type</label>
          <select
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-w-[140px]"
          >
            <option value="">All</option>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
          {error} <button type="button" onClick={() => refresh()} className="underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-8">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
          <span>Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400">No requests match. Create one from a service listing.</p>
          <Link href="/marketplace" className="mt-2 inline-block text-primary-600 dark:text-primary-400 hover:underline">Browse Marketplace</Link>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  req.status === "actioned"
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : req.status === "cancelled"
                    ? "border-surface-200 dark:border-surface-700 opacity-75"
                    : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-100">{req.service_title}</p>
                    {req.service_category && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {SERVICE_CATEGORIES.find((c) => c.value === req.service_category)?.label ?? req.service_category}
                      </p>
                    )}
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">{req.message}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                      {format(new Date(req.created_at), "MMM d, yyyy")}
                      {req.preferred_date && ` · Preferred: ${format(new Date(req.preferred_date), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        req.status === "actioned"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                          : req.status === "cancelled"
                          ? "bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {req.status === "pending" ? "Pending" : req.status === "actioned" ? "Actioned" : "Cancelled"}
                    </span>
                    <Link
                      href={`/marketplace/requests/${req.id}`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View details
                    </Link>
                    {req.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(req)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div ref={sentinelRef} className="min-h-[24px]" aria-hidden />
          {loadingMore && (
            <div className="flex justify-center py-6" role="status" aria-live="polite">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
              <span className="sr-only">Loading more…</span>
            </div>
          )}
          {!loadingMore && !hasMore && requests.length > 0 && (
            <p className="text-center text-sm text-surface-500 dark:text-surface-400 py-2">No more results</p>
          )}
        </>
      )}

      <p className="text-sm text-surface-500 dark:text-surface-400">
        <Link href="/marketplace" className="text-primary-600 dark:text-primary-400 hover:underline">← Marketplace</Link>
      </p>
    </div>
  );
}
