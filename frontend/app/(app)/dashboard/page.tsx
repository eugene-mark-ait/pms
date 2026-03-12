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
  const canAddUnit = isLandlord || isManager;
  const canAddTenant = isLandlord || isManager;

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
          <span className="text-sm text-surface-500 dark:text-surface-400">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "there";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">Dashboard</h1>
        <p className="text-surface-600 dark:text-surface-400 text-base">
          Welcome back, {displayName}
          {user?.role_names?.length ? (
            <span className="ml-1 text-surface-500 dark:text-surface-500">· {user.role_names.map((r) => r === "landlord" ? "Property Owner" : r).join(", ")}</span>
          ) : null}
        </p>
      </div>

      {canSeeOverview && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <h2 className="text-base font-semibold text-surface-800 dark:text-surface-200">Overview</h2>
            <div className="flex flex-wrap gap-3">
              {canAddProperty && (
                <Link href="/properties/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Property
                </Link>
              )}
              {canAddUnit && (
                <Link href="/units/new" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Unit
                </Link>
              )}
              {canAddTenant && (
                <Link href="/tenants/new" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Add Tenant
                </Link>
              )}
              <Link href="/payments" className="inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h6.21" /></svg>
                Record Payment
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total Properties</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.propertiesCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Units</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.unitsCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Occupied</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.occupiedCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Monthly Revenue</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">KSh {(stats.revenue ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Overdue</p>
              <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueCount ?? 0}</p>
            </div>
          </div>

          {stats.complaintsCount !== undefined && (
            <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm inline-block">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Open Complaints</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.complaintsCount}</p>
            </div>
          )}
        </>
      )}

      {isTenant && !canSeeOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Outstanding Balance</p>
            <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">KSh {(stats.balance ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
          </div>
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">My Units</p>
            <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.myUnitsCount ?? 0}</p>
          </div>
        </div>
      )}

      {!isLandlord && !isTenant && !isManager && !isCaretaker && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Role</p>
          <p className="mt-1 text-lg font-semibold text-surface-900 dark:text-surface-100">{user?.role_names?.join(", ") || "—"}</p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-4">Recent payments</h2>
        {recentPayments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
            <p className="text-surface-500 dark:text-surface-400 text-sm">No recent payments</p>
            <Link href="/payments" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View payments</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-surface-700 dark:text-surface-300">Date</th>
                  {canSeeOverview && <th className="text-left px-4 py-3 font-medium text-surface-700 dark:text-surface-300">Tenant / Unit</th>}
                  <th className="text-left px-4 py-3 font-medium text-surface-700 dark:text-surface-300">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-700 dark:text-surface-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-700/30">
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                    {canSeeOverview && (
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        {p.lease?.tenant ? (() => {
                          const name = [p.lease.tenant.first_name, p.lease.tenant.last_name].filter(Boolean).join(" ").trim() || p.lease.tenant.email || "—";
                          return name + (p.lease?.unit?.unit_number ? ` · ${p.lease.unit.unit_number}` : "");
                        })() : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-100">KSh {Number(p.amount).toLocaleString("en-KE")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        p.payment_status === "completed" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20 dark:ring-emerald-500/30" : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                      }`}>
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-surface-200 dark:border-surface-700 px-4 py-2 bg-surface-50/50 dark:bg-surface-700/30">
              <Link href="/payments" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all payments →</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
