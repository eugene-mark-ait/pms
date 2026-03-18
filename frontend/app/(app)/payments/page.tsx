"use client";

import { useEffect, useState } from "react";
import { api, Payment, User, formatKSH, getDisplayName } from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import EmptyState from "@/components/EmptyState";

export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const isTenant =
    user != null
    && user.role_names?.includes("tenant")
    && !user.role_names?.includes("property_owner")
    && !user.role_names?.includes("manager");
  const enabled = user != null;
  const endpoint = isTenant ? "/payments/history/" : "/payments/";

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Payment>({
    endpoint,
    pageSize: 20,
    enabled,
    parseResponse: (data) => {
      const d = data as { results?: Payment[]; next?: string | null };
      if (Array.isArray(d)) {
        return { results: d, next: null };
      }
      return {
        results: d?.results ?? [],
        next: d?.next ?? null,
      };
    },
  });

  useEffect(() => {
    let cancelled = false;
    api.get<User>("/auth/me/")
      .then((res) => { if (!cancelled) setUser(res.data); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, []);

  async function handleExport(formatType: "csv" | "pdf") {
    const token = typeof window !== "undefined" ? localStorage.getItem("mahaliwise_access_token") : null;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "") + "/api";
    const url = `${base}/payments/export/?format=${formatType}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const ext = formatType === "pdf" ? "pdf" : "csv";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{isTenant ? "Payment History" : "Payments"}</h1>
          <p className="text-surface-600 dark:text-surface-400 text-sm mt-1">
            {isTenant ? "Your rent payments." : "All payments for your properties."}
          </p>
        </div>
        {!isTenant && list.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 text-sm font-medium"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {loading ? (
        <p className="text-surface-500 dark:text-surface-400">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Date</th>
                  {!isTenant && (
                    <>
                      <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Tenant</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Unit</th>
                    </>
                  )}
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Months</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30">
                    <td className="px-6 py-4 text-surface-900 dark:text-surface-100">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                    {!isTenant && p.lease && (
                      <>
                        <td className="px-6 py-4 text-surface-700 dark:text-surface-300">
                          <span className="font-medium">{getDisplayName(p.lease.tenant)}</span>
                          {p.lease.tenant?.phone && <span className="text-surface-500 dark:text-surface-400 text-sm block">{p.lease.tenant.phone}</span>}
                        </td>
                        <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                          {p.lease.unit?.unit_number} {p.lease.unit?.property?.name ? `– ${p.lease.unit.property.name}` : ""}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">{formatKSH(p.amount)}</td>
                    <td className="px-6 py-4 text-surface-900 dark:text-surface-100">{p.months_paid_for ?? 1}</td>
                    <td className="px-6 py-4 capitalize text-surface-900 dark:text-surface-100">{p.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((p) => (
              <div key={p.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-surface-900 dark:text-surface-100">{formatKSH(p.amount)}</span>
                  <span className="capitalize text-sm text-surface-600 dark:text-surface-400">{p.payment_status}</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{format(new Date(p.payment_date), "MMM d, yyyy")} · {p.months_paid_for ?? 1} month(s)</p>
                {!isTenant && p.lease && (
                  <p className="text-sm text-surface-500 dark:text-surface-500 mt-2">
                    {getDisplayName(p.lease.tenant)}
                    {p.lease.tenant?.phone ? ` · ${p.lease.tenant.phone}` : ""} · {p.lease.unit?.unit_number} {p.lease.unit?.property?.name ? `– ${p.lease.unit.property.name}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 dark:text-surface-400 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more payments</p>}
        </>
      )}
    </div>
  );
}
