"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Payment, User, formatKSH, PaginatedResponse } from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";
import { PaginationControls } from "@/components/PaginationControls";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const isTenant =
    user != null
    && user.role_names?.includes("tenant")
    && !user.role_names?.includes("landlord")
    && !user.role_names?.includes("manager");

  useEffect(() => {
    let cancelled = false;
    api.get<User>("/auth/me/")
      .then((res) => { if (!cancelled) setUser(res.data); })
      .catch(() => { if (!cancelled) { setUser(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(() => {
    if (user == null) return;
    setLoading(true);
    const endpoint = isTenant ? "/payments/history/" : "/payments/";
    const params = { page, page_size: pageSize };
    api.get<Payment[] | PaginatedResponse<Payment>>(endpoint, { params }).then((res) => {
      const data = res.data;
      if (Array.isArray(data)) {
        setList(data);
        setCount(data.length);
        setNext(null);
        setPrevious(null);
      } else {
        const p = data as PaginatedResponse<Payment>;
        setList(p.results ?? []);
        setCount(p.count ?? 0);
        setNext(p.next ?? null);
        setPrevious(p.previous ?? null);
      }
    }).catch(() => { setList([]); setCount(0); setNext(null); setPrevious(null); }).finally(() => setLoading(false));
  }, [user, isTenant, page, pageSize]);

  useEffect(() => {
    if (user == null) return;
    refresh();
  }, [user, refresh]);

  async function handleExport(format: "csv" | "pdf") {
    const token = typeof window !== "undefined" ? localStorage.getItem("pms_access_token") : null;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "") + "/api";
    const url = `${base}/payments/export/?format=${format}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const ext = format === "pdf" ? "pdf" : "csv";
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
          <h1 className="text-2xl font-bold text-surface-900">{isTenant ? "Payment History" : "Payments"}</h1>
          <p className="text-surface-600 text-sm mt-1">
            {isTenant ? "Your rent payments." : "All payments for your properties."}
          </p>
        </div>
        {!isTenant && list.length > 0 && (
          <div className="flex gap-2">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport("csv"); }}
              className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 text-sm font-medium"
            >
              Export CSV
            </a>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No payments yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-surface-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Date</th>
                  {!isTenant && (
                    <>
                      <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Tenant</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Unit</th>
                    </>
                  )}
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Amount</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Months</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                    {!isTenant && p.lease && (
                      <>
                        <td className="px-6 py-4 text-surface-700">
                          {p.lease.tenant?.first_name} {p.lease.tenant?.last_name} ({p.lease.tenant?.email})
                        </td>
                        <td className="px-6 py-4 text-surface-600">
                          {p.lease.unit?.unit_number} {p.lease.unit?.property?.name ? `– ${p.lease.unit.property.name}` : ""}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 font-medium">{formatKSH(p.amount)}</td>
                    <td className="px-6 py-4">{p.months_paid_for ?? 1}</td>
                    <td className="px-6 py-4 capitalize">{p.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {list.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-surface-900">{formatKSH(p.amount)}</span>
                  <span className="capitalize text-sm text-surface-600">{p.payment_status}</span>
                </div>
                <p className="text-sm text-surface-600 mt-1">{format(new Date(p.payment_date), "MMM d, yyyy")} · {p.months_paid_for ?? 1} month(s)</p>
                {!isTenant && p.lease && (
                  <p className="text-sm text-surface-500 mt-2">
                    {p.lease.tenant?.first_name} {p.lease.tenant?.last_name} · {p.lease.unit?.unit_number} {p.lease.unit?.property?.name ? `– ${p.lease.unit.property.name}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
          {(next != null || previous != null || count > list.length) && (
            <div className="bg-white rounded-b-xl border border-surface-200 border-t-0 px-4">
              <PaginationControls
                count={count}
                page={page}
                next={next}
                previous={previous}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                onNext={() => setPage((p) => p + 1)}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                loading={loading}
              />
            </div>
          )}
        </>
      )}
      {isTenant && <Link href="/dashboard/my-units" className="inline-block text-primary-600 hover:underline">← My units</Link>}
    </div>
  );
}
