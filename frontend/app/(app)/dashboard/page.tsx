"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    revenue?: string;
    overdueCount?: number;
    vacancyRate?: string;
    complaintsCount?: number;
    balance?: string;
    myUnitsCount?: number;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [userRes, myUnitsRes, paymentsRes] = await Promise.all([
          api.get<User>("/auth/me/"),
          api.get("/tenant/my-units/").catch(() => ({ data: [] })),
          api.get("/payments/history/").catch(() => ({ data: [] })),
        ]);
        setUser(userRes.data);
        const roles = userRes.data.role_names || [];
        const myUnits = Array.isArray(myUnitsRes.data) ? myUnitsRes.data : (myUnitsRes.data as { results?: unknown[] })?.results ?? [];
        const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data as { results?: unknown[] })?.results ?? [];

        if (roles.includes("landlord")) {
          const [leaseRes, compRes] = await Promise.all([
            api.get("/leases/").catch(() => ({ data: [] })),
            api.get("/complaints/").catch(() => ({ data: [] })),
          ]);
          const leases = Array.isArray(leaseRes.data) ? leaseRes.data : (leaseRes.data as { results?: unknown[] })?.results ?? [];
          const complaints = Array.isArray(compRes.data) ? compRes.data : (compRes.data as { results?: unknown[] })?.results ?? [];
          const vacanciesRes = await api.get("/vacancies/").catch(() => ({ data: [] }));
          const vacancies = Array.isArray(vacanciesRes.data) ? vacanciesRes.data : (vacanciesRes.data as { results?: unknown[] })?.results ?? [];
          const revenue = (payments as { amount?: string }[]).reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
          const overdue = (leases as { payment_status?: string }[]).filter((l) => l.payment_status === "overdue").length;
          setStats({
            revenue: revenue.toFixed(2),
            overdueCount: overdue,
            vacancyRate: (leases as unknown[]).length ? (((vacancies as unknown[]).length / (leases as unknown[]).length) * 100).toFixed(1) + "%" : "0%",
            complaintsCount: (complaints as unknown[]).length,
          });
        } else if (roles.includes("tenant")) {
          const balance = (myUnits as { outstanding_balance?: string }[]).reduce((s, u) => s + parseFloat(u.outstanding_balance || "0"), 0);
          setStats({
            balance: balance.toFixed(2),
            myUnitsCount: (myUnits as unknown[]).length,
          });
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-surface-500">Loading…</div>
      </div>
    );
  }

  const isLandlord = user?.role_names?.includes("landlord");
  const isTenant = user?.role_names?.includes("tenant");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
      <p className="text-surface-600">
        Welcome, {user?.first_name || user?.email}
        {user?.role_names?.length ? ` (${user.role_names.join(", ")})` : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLandlord && (
          <>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">Revenue (from recent payments)</p>
              <p className="text-2xl font-bold text-surface-900">${stats.revenue ?? "0"}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">Overdue tenants</p>
              <p className="text-2xl font-bold text-surface-900">{stats.overdueCount ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">Vacancy rate</p>
              <p className="text-2xl font-bold text-surface-900">{stats.vacancyRate ?? "0%"}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">Open complaints</p>
              <p className="text-2xl font-bold text-surface-900">{stats.complaintsCount ?? 0}</p>
            </div>
          </>
        )}
        {isTenant && !isLandlord && (
          <>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">Outstanding balance</p>
              <p className="text-2xl font-bold text-surface-900">${stats.balance ?? "0"}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-surface-500">My units</p>
              <p className="text-2xl font-bold text-surface-900">{stats.myUnitsCount ?? 0}</p>
            </div>
          </>
        )}
        {!isLandlord && !isTenant && (
          <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-surface-500">Role</p>
            <p className="text-lg font-semibold text-surface-900">{user?.role_names?.join(", ") || "—"}</p>
          </div>
        )}
      </div>

      {isTenant && (
        <section id="my-units">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick links</h2>
          <div className="flex gap-4">
            <Link href="/dashboard/my-units" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              My units
            </Link>
            <Link href="/payments" className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50">
              Payment history
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
