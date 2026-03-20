"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { api, User } from "@/lib/api";
import { useCursorInfiniteScroll } from "@/hooks/useCursorInfiniteScroll";

export interface ProviderServiceRequestItem {
  id: string;
  user: string;
  requester_email: string;
  requester_phone?: string;
  provider: string;
  service: string;
  service_title: string;
  message: string;
  preferred_date: string | null;
  status: "pending" | "actioned" | "cancelled";
  created_at: string;
}

type StatusFilter = "pending" | "actioned" | "all";

export default function ProviderRequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const isProvider = user?.role_names?.includes("service_provider");

  const rawStatus = (searchParams.get("status") ?? "pending").toLowerCase();
  const statusFilter: StatusFilter =
    rawStatus === "actioned" || rawStatus === "completed" ? "actioned" : rawStatus === "all" ? "all" : "pending";

  const params: Record<string, string> = { status: statusFilter };

  const {
    items: requests,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    sentinelRef,
  } = useCursorInfiniteScroll<ProviderServiceRequestItem>({
    endpoint: "/marketplace/my-requests/",
    params,
    pageSize: 15,
    enabled: isProvider === true,
    parseResponse: (data) => {
      const d = data as { results?: ProviderServiceRequestItem[]; next?: string | null };
      return { results: d?.results ?? [], next: d?.next ?? null };
    },
  });

  const updateFilter = useCallback(
    (next: StatusFilter) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "pending") p.delete("status");
      else p.set("status", next);
      router.replace(`${pathname}?${p.toString()}`);
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  async function handleMarkActioned(req: ProviderServiceRequestItem) {
    setActioningId(req.id);
    try {
      await api.patch(`/marketplace/requests/${req.id}/`, { status: "actioned" });
      refresh();
      window.dispatchEvent(new CustomEvent("provider-requests-updated"));
    } catch {
      alert("Failed to update request.");
    } finally {
      setActioningId(null);
    }
  }

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
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Requests</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "actioned", label: "Actioned / completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Incoming requests</h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">Service requests from users. Mark as actioned when you’ve addressed them.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab.key}
            onClick={() => updateFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === tab.key
                ? "bg-primary-600 text-white"
                : "border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading && !requests.length ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400">
            {statusFilter === "pending"
              ? "No pending requests."
              : statusFilter === "actioned"
                ? "No actioned requests yet."
                : "No requests yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-surface-100">{req.service_title}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">From: {req.requester_email}</p>
                  {req.requester_phone && (
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">Phone: {req.requester_phone}</p>
                  )}
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-2 whitespace-pre-wrap">{req.message}</p>
                  {req.preferred_date && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                      Preferred date: {new Date(req.preferred_date).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">Received {new Date(req.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      req.status === "pending"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                        : req.status === "actioned"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                          : "bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300"
                    }`}
                  >
                    {req.status === "pending" ? "Pending" : req.status === "actioned" ? "Actioned" : "Cancelled"}
                  </span>
                  {req.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleMarkActioned(req)}
                      disabled={actioningId === req.id}
                      className="rounded-lg bg-primary-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      {actioningId === req.id ? "Updating…" : "Mark actioned"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="min-h-[48px] flex justify-center items-center py-4">
              {loadingMore && (
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
