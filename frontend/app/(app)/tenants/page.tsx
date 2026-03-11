"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User, getDisplayName } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Lease {
  id: string;
  tenant: { email: string; first_name: string; last_name: string };
  unit: { unit_number: string; property: { name: string } };
  payment_status?: string;
  is_active?: boolean;
}

export default function TenantsPage() {
  const [user, setUser] = useState<User | null>(null);
  const canView = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");
  const canManage = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager");
  const enabled = !!user && !!canView;

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Lease>({
    endpoint: "/leases/",
    pageSize: 20,
    enabled,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

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
          <Link href="/tenants/new" className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium min-h-[44px] inline-flex items-center">
            Add Lease (Assign Tenant)
          </Link>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
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
                      <span className="font-medium text-surface-900">{getDisplayName(l.tenant)}</span>
                      <span className="text-surface-500 text-sm block">{l.tenant?.email}</span>
                      {l.tenant?.phone && <span className="text-surface-500 text-sm block">{l.tenant.phone}</span>}
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
                <p className="font-medium text-surface-900">{getDisplayName(l.tenant)}</p>
                <p className="text-sm text-surface-600 mt-0.5">{l.tenant?.email}</p>
                {l.tenant?.phone && <p className="text-sm text-surface-500">{l.tenant.phone}</p>}
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
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 text-sm">No more tenants</p>}
        </>
      )}
    </div>
  );
}
