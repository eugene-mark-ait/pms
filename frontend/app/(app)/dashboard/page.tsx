"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";

interface PaymentRow {
  id: string;
  amount: string;
  payment_date: string;
  payment_status: string;
  lease?: { unit?: { unit_number?: string }; tenant?: { first_name?: string; last_name?: string } };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    propertiesCount?: number;
    unitsCount?: number;
    occupiedCount?: number;
    revenue?: string;
    overdueCount?: number;
    pendingPaymentsCount?: number;
    balance?: string;
    myUnitsCount?: number;
    complaintsCount?: number;
  }>({});
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isLandlord = user?.role_names?.includes("landlord");
  const isManager = user?.role_names?.includes("manager");
  const isCaretaker = user?.role_names?.includes("caretaker");
  const isTenant = user?.role_names?.includes("tenant");
  const canSeeOverview = isLandlord || isManager || isCaretaker;
  const canAddProperty = isLandlord;
  const canAddUnit = isLandlord || isManager || isCaretaker;
  const canAddTenant = isLandlord || isManager || isCaretaker;

  useEffect(() => {
    (async () => {
      try {
        const userRes = await api.get<User>("/auth/me/");
        setUser(userRes.data);
        const roles = userRes.data.role_names || [];

        if (roles.includes("landlord") || roles.includes("manager") || roles.includes("caretaker")) {
          const [propsRes, unitsRes, leasesRes, paymentsRes, compRes] = await Promise.all([
            api.get("/properties/").catch(() => ({ data: [] })),
            api.get("/units/").catch(() => ({ data: [] })),
            api.get("/leases/").catch(() => ({ data: [] })),
            api.get("/payments/").catch(() => ({ data: [] })),
            api.get("/complaints/").catch(() => ({ data: [] })),
          ]);
          const properties = Array.isArray(propsRes.data) ? propsRes.data : (propsRes.data as { results?: unknown[] })?.results ?? [];
          const units = Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data as { results?: unknown[] })?.results ?? [];
          const leases = Array.isArray(leasesRes.data) ? leasesRes.data : (leasesRes.data as { results?: unknown[] })?.results ?? [];
          const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data as { results?: unknown[] })?.results ?? [];
          const complaints = Array.isArray(compRes.data) ? compRes.data : (compRes.data as { results?: unknown[] })?.results ?? [];

          const occupied = (units as { is_vacant?: boolean }[]).filter((u) => !u.is_vacant).length;
          const overdue = (leases as { payment_status?: string }[]).filter((l) => l.payment_status === "overdue").length;
          const thisMonth = (payments as PaymentRow[]).filter((p) => {
            const d = new Date(p.payment_date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          const revenue = thisMonth.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);

          setStats({
            propertiesCount: (properties as unknown[]).length,
            unitsCount: (units as unknown[]).length,
            occupiedCount: occupied,
            revenue: revenue.toFixed(2),
            overdueCount: overdue,
            pendingPaymentsCount: overdue,
            complaintsCount: (complaints as unknown[]).length,
          });
          setRecentPayments((payments as PaymentRow[]).slice(0, 5));
        } else if (roles.includes("tenant")) {
          const [myUnitsRes, paymentsRes] = await Promise.all([
            api.get("/tenant/my-units/").catch(() => ({ data: [] })),
            api.get("/payments/history/").catch(() => ({ data: [] })),
          ]);
          const myUnits = Array.isArray(myUnitsRes.data) ? myUnitsRes.data : (myUnitsRes.data as { results?: unknown[] })?.results ?? [];
          const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data as { results?: unknown[] })?.results ?? [];
          const balance = (myUnits as { outstanding_balance?: string }[]).reduce((s, u) => s + parseFloat(u.outstanding_balance || "0"), 0);
          setStats({
            balance: balance.toFixed(2),
            myUnitsCount: (myUnits as unknown[]).length,
          });
          setRecentPayments((payments as PaymentRow[]).slice(0, 5));
        }
      } catch {
        setStats({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-surface-500">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
        <p className="text-surface-600 text-sm">
          Welcome back, {user?.first_name || user?.email}
          {user?.role_names?.length ? ` · ${user.role_names.map((r) => r === "landlord" ? "Property Owner" : r).join(", ")}` : ""}
        </p>
      </div>

      {canSeeOverview && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider">Overview</h2>
            <div className="flex flex-wrap gap-2">
              {canAddProperty && (
                <Link href="/properties/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Property
                </Link>
              )}
              {canAddUnit && (
                <Link href="/units/new" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Unit
                </Link>
              )}
              {canAddTenant && (
                <Link href="/tenants/new" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Add Tenant
                </Link>
              )}
              <Link href="/payments" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h6.21" /></svg>
                Record Payment
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Total Properties</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{stats.propertiesCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Units</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{stats.unitsCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Occupied</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{stats.occupiedCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Monthly Revenue</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">${stats.revenue ?? "0"}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Overdue</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats.overdueCount ?? 0}</p>
            </div>
          </div>

          {stats.complaintsCount !== undefined && (
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm inline-block">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Open Complaints</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{stats.complaintsCount}</p>
            </div>
          )}
        </>
      )}

      {isTenant && !canSeeOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">Outstanding Balance</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">${stats.balance ?? "0"}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">My Units</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">{stats.myUnitsCount ?? 0}</p>
          </div>
        </div>
      )}

      {!isLandlord && !isTenant && !isManager && !isCaretaker && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500">Role</p>
          <p className="mt-1 text-lg font-semibold text-surface-900">{user?.role_names?.join(", ") || "—"}</p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">Recent payments</h2>
        {recentPayments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50/50 p-8 text-center">
            <p className="text-surface-500 text-sm">No recent payments</p>
            <Link href="/payments" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">View payments</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-surface-700">Date</th>
                  {canSeeOverview && <th className="text-left px-4 py-3 font-medium text-surface-700">Tenant / Unit</th>}
                  <th className="text-left px-4 py-3 font-medium text-surface-700">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50/50">
                    <td className="px-4 py-3 text-surface-600">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                    {canSeeOverview && (
                      <td className="px-4 py-3 text-surface-700">
                        {p.lease?.tenant ? `${p.lease.tenant.first_name || ""} ${p.lease.tenant.last_name || ""}`.trim() || "—" : "—"}
                        {p.lease?.unit?.unit_number ? ` · ${p.lease.unit.unit_number}` : ""}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-surface-900">${p.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        p.payment_status === "completed" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-surface-100 text-surface-600"
                      }`}>
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-surface-200 px-4 py-2 bg-surface-50/50">
              <Link href="/payments" className="text-sm font-medium text-primary-600 hover:underline">View all payments →</Link>
            </div>
          </div>
        )}
      </section>

      {isTenant && (
        <section>
          <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/my-units" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
              My units
            </Link>
            <Link href="/payments" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50">
              Payment history
            </Link>
            <Link href="/find-units" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50">
              Find units
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
