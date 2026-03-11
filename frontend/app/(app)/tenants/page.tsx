"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, User, PaginatedResponse } from "@/lib/api";
import { PaginationControls } from "@/components/PaginationControls";

interface Lease {
  id: string;
  tenant: { email: string; first_name: string; last_name: string };
  unit: { unit_number: string; property: { name: string } };
  payment_status?: string;
  is_active?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function TenantsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const canView = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");
  const canManage = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const refresh = useCallback(() => {
    if (!canView) return;
    setLoading(true);
    api.get<PaginatedResponse<Lease>>("/leases/", { params: { page, page_size: pageSize } })
      .then((res) => {
        const d = res.data;
        setList(d.results ?? []);
        setCount(d.count ?? 0);
        setNext(d.next ?? null);
        setPrevious(d.previous ?? null);
      })
      .catch(() => { setList([]); setCount(0); setNext(null); setPrevious(null); })
      .finally(() => setLoading(false));
  }, [canView, page, pageSize]);

  useEffect(() => {
    if (!canView) return;
    refresh();
  }, [canView, refresh]);

  if (user && !canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900">Tenants</h1>
        <p className="text-surface-600">You don’t have access to view tenants and leases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Tenants</h1>
        {canManage && (
          <Link href="/tenants/new" className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium">
            Add Lease (Assign Tenant)
          </Link>
        )}
      </div>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No tenants.</p>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-surface-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Tenant</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Property / Unit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-surface-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {list.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4">
                      {l.tenant?.first_name} {l.tenant?.last_name} ({l.tenant?.email})
                    </td>
                    <td className="px-6 py-4 text-surface-600">
                      {typeof l.unit?.property === "object" && l.unit?.property?.name
                        ? `${l.unit.property.name} – ${l.unit.unit_number}`
                        : `${l.unit?.unit_number}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {l.is_active !== false && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">Active lease</span>
                        )}
                        {l.payment_status === "overdue" && (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/20">Overdue</span>
                        )}
                        {l.payment_status === "paid" || l.payment_status === "current" ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">Paid</span>
                        ) : l.payment_status !== "overdue" && l.payment_status && (
                          <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">{l.payment_status}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage && (
                        <Link href={`/tenants/${l.id}/edit`} className="text-primary-600 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
                <p className="font-medium text-surface-900">
                  {l.tenant?.first_name} {l.tenant?.last_name}
                </p>
                <p className="text-sm text-surface-600 mt-0.5">{l.tenant?.email}</p>
                <p className="text-sm text-surface-500 mt-2">
                  {typeof l.unit?.property === "object" && l.unit?.property?.name
                    ? `${l.unit.property.name} – ${l.unit.unit_number}`
                    : l.unit?.unit_number}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {l.is_active !== false && (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                  )}
                  {l.payment_status === "overdue" && (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                  )}
                  {(l.payment_status === "paid" || l.payment_status === "current") && (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Paid</span>
                  )}
                </div>
                {canManage && (
                  <Link href={`/tenants/${l.id}/edit`} className="inline-flex items-center min-h-[44px] mt-3 text-primary-600 hover:underline text-sm font-medium">Edit lease</Link>
                )}
              </div>
            ))}
          </div>
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
        </>
      )}
    </div>
  );
}
