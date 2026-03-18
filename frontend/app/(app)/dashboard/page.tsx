"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";

const UNIT_TYPES: { value: string; label: string }[] = [
  { value: "", label: "Any" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "One Bedroom" },
  { value: "two_bedroom", label: "Two Bedroom" },
  { value: "three_bedroom", label: "Three Bedroom" },
  { value: "apartment", label: "Apartment" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "serviced_apartment", label: "Serviced Apartment" },
  { value: "other", label: "Other" },
];

interface PaymentRow {
  id: string;
  amount: string;
  payment_date: string;
  payment_status: string;
  lease?: { unit?: { unit_number?: string }; tenant?: { first_name?: string; last_name?: string } };
}

interface VacancyPreference {
  id: string;
  is_looking: boolean;
  preferred_unit_type: string;
  preferred_location: string;
}

interface VacancyMatchItem {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  monthly_rent: string;
  property_name: string;
  address?: string;
  location?: string;
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
    /** Tenant: "paid" | "due" | "overdue" | "partial" from lease payment_status */
    paymentStatusSummary?: "paid" | "due" | "overdue" | "partial";
  }>({});
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preference, setPreference] = useState<VacancyPreference | null>(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [matches, setMatches] = useState<VacancyMatchItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [requestCounts, setRequestCounts] = useState<{ total: number; pending: number; actioned: number } | null>(null);

  const isPropertyOwner = user?.role_names?.includes("property_owner");
  const isManager = user?.role_names?.includes("manager");
  const isCaretaker = user?.role_names?.includes("caretaker");
  const isTenant = user?.role_names?.includes("tenant");
  const isServiceProvider = user?.role_names?.includes("service_provider");
  const canSeeOverview = isPropertyOwner || isManager || isCaretaker;
  const canAddProperty = isPropertyOwner;
  const canAddUnit = isPropertyOwner || isManager;
  const canAddTenant = isPropertyOwner || isManager;

  useEffect(() => {
    (async () => {
      try {
        const userRes = await api.get<User>("/auth/me/");
        setUser(userRes.data);
        const roles = userRes.data.role_names || [];

        if (roles.includes("property_owner") || roles.includes("manager") || roles.includes("caretaker")) {
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
            api.get("/tenant/my-units/").catch((err) => {
              setDashboardError(err?.response?.data?.detail ?? "Could not load your units.");
              return { data: [] };
            }),
            api.get("/payments/history/").catch(() => ({ data: [] })),
          ]);
          const myUnits = Array.isArray(myUnitsRes.data) ? myUnitsRes.data : (myUnitsRes.data as { results?: unknown[] })?.results ?? [];
          const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data as { results?: unknown[] })?.results ?? [];
          const unitsList = myUnits as { outstanding_balance?: string; payment_status?: string }[];
          const balance = unitsList.reduce((s, u) => s + parseFloat(String(u?.outstanding_balance ?? "0") || "0"), 0);
          const statuses = unitsList.map((u) => u?.payment_status).filter(Boolean) as string[];
          let paymentStatusSummary: "paid" | "due" | "overdue" | "partial" = "paid";
          if (statuses.length === 0) paymentStatusSummary = "paid";
          else if (statuses.some((s) => s === "overdue")) paymentStatusSummary = "overdue";
          else if (statuses.some((s) => s === "due")) paymentStatusSummary = "due";
          else if (statuses.some((s) => s !== "paid")) paymentStatusSummary = "partial";
          setStats({
            balance: balance.toFixed(2),
            myUnitsCount: myUnits.length,
            paymentStatusSummary,
          });
          setRecentPayments((payments as PaymentRow[]).slice(0, 5));
        }
        if (roles.includes("tenant")) {
          api.get<VacancyPreference>("/vacancies/my-preference/").then((res) => setPreference(res.data)).catch(() => setPreference(null));
        }
        if (roles.some((r) => ["tenant", "property_owner", "manager", "caretaker"].includes(r))) {
          api.get<{ total: number; pending: number; actioned: number }>("/marketplace/my-sent-requests/count/").then((res) => setRequestCounts(res.data ?? null)).catch(() => setRequestCounts(null));
        }
      } catch (err) {
        setStats({});
        setDashboardError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isTenant || !preference?.is_looking) return;
    setMatchesLoading(true);
    api.get<VacancyMatchItem[] | { results?: VacancyMatchItem[] }>("/vacancies/matches/").then((res) => {
      const data = res.data;
      setMatches(Array.isArray(data) ? data : (data?.results ?? []));
    }).catch(() => setMatches([])).finally(() => setMatchesLoading(false));
  }, [isTenant, preference?.is_looking]);

  useEffect(() => {
    const refetch = () => {
      if (user?.role_names?.some((r) => ["tenant", "property_owner", "manager", "caretaker"].includes(r))) {
        api.get<{ total: number; pending: number; actioned: number }>("/marketplace/my-sent-requests/count/").then((res) => setRequestCounts(res.data ?? null)).catch(() => {});
      }
    };
    window.addEventListener("marketplace-request-created", refetch);
    return () => window.removeEventListener("marketplace-request-created", refetch);
  }, [user?.role_names]);

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

  function savePreference(updates: Partial<VacancyPreference>) {
    if (!isTenant) return;
    setPrefError("");
    setPrefSaving(true);
    api.patch<VacancyPreference>("/vacancies/my-preference/", updates).then((res) => setPreference(res.data)).catch((err: { response?: { data?: { detail?: string } } }) => setPrefError(err?.response?.data?.detail ?? "Failed to save")).finally(() => setPrefSaving(false));
  }

  const tenantBalance = stats.balance != null ? parseFloat(String(stats.balance)) : 0;
  const hasBalance = tenantBalance > 0;
  const isFullyPaid = stats.paymentStatusSummary === "paid";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">Dashboard</h1>
        <p className="text-surface-600 dark:text-surface-400 text-base">
          Welcome back, {displayName}
          {user?.role_names?.length ? (
            <span className="ml-1 text-surface-500 dark:text-surface-500">· {user.role_names.map((r) => (r === "landlord" || r === "property_owner") ? "Property Owner" : r === "service_provider" ? "Service Provider" : r).join(", ")}</span>
          ) : null}
        </p>
      </div>

      {dashboardError && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {dashboardError} <Link href="/dashboard" className="font-medium underline">Refresh</Link>
        </div>
      )}

      {isTenant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`rounded-xl border p-5 shadow-sm ${
                  hasBalance
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20"
                    : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Outstanding balance</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${hasBalance ? "text-amber-800 dark:text-amber-200" : "text-surface-900 dark:text-surface-100"}`}>
                  KSh {String(stats.balance ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                {hasBalance ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Rent + unpaid deposit minus payments</p>
                ) : (
                  <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">No balance due</p>
                )}
                <Link href="/payments" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  View payments →
                </Link>
              </div>
              <div
                className={`rounded-xl border p-5 shadow-sm ${
                  isFullyPaid
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20"
                    : stats.paymentStatusSummary === "overdue"
                      ? "border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20"
                      : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                }`}
              >
                <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Payment status</p>
                <p className={`mt-1 text-lg font-bold ${isFullyPaid ? "text-emerald-800 dark:text-emerald-200" : stats.paymentStatusSummary === "overdue" ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
                  {isFullyPaid ? "Up to date" : stats.paymentStatusSummary === "overdue" ? "Overdue" : stats.paymentStatusSummary === "due" ? "Due" : "Partial"}
                </p>
                <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  {isFullyPaid ? "All leases paid" : "See My Units for details"}
                </p>
                <Link href="/dashboard/my-units" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  My units →
                </Link>
              </div>
            </div>
            {stats.myUnitsCount != null && stats.myUnitsCount > 0 && (
              <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-sm">
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">My Units</p>
                <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.myUnitsCount}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Link href="/alerts" className="block rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm hover:bg-surface-50 dark:hover:bg-surface-700/50 transition">
              <span className="font-medium text-surface-900 dark:text-surface-100">Vacancy Alerts</span>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Create and manage alerts for matching units</p>
            </Link>
            <Link href="/complaints" className="block rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm hover:bg-surface-50 dark:hover:bg-surface-700/50 transition">
              <span className="font-medium text-surface-900 dark:text-surface-100">Complaints</span>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">View and submit complaints</p>
            </Link>
            {requestCounts !== null && (
              <Link href="/marketplace/requests" className="block rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm hover:bg-surface-50 dark:hover:bg-surface-700/50 transition">
                <span className="font-medium text-surface-900 dark:text-surface-100">Total Requests / Bookings</span>
                <p className="mt-1 text-xl font-bold text-surface-900 dark:text-surface-100">{requestCounts.total}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requestCounts.pending > 0 && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">Pending: {requestCounts.pending}</span>
                  )}
                  {requestCounts.actioned > 0 && (
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">Actioned: {requestCounts.actioned}</span>
                  )}
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Marketplace service requests</p>
              </Link>
            )}
          </div>
        </div>
      )}

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
          {requestCounts !== null && (
            <Link href="/marketplace/requests" className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm inline-block hover:bg-surface-50 dark:hover:bg-surface-700/50 transition">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total Requests / Bookings</p>
              <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{requestCounts.total}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {requestCounts.pending > 0 && (
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">Pending: {requestCounts.pending}</span>
                )}
                {requestCounts.actioned > 0 && (
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">Actioned: {requestCounts.actioned}</span>
                )}
              </div>
            </Link>
          )}
        </>
      )}

      {isTenant && (
        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 space-y-4">
          <h2 className="font-semibold text-surface-900 dark:text-surface-100">Currently looking for a vacancy</h2>
          {prefError && <p className="text-sm text-red-600 dark:text-red-400">{prefError}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preference?.is_looking ?? false}
                onChange={(e) => savePreference({ is_looking: e.target.checked })}
                disabled={prefSaving}
                className="rounded border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">I am currently looking</span>
            </label>
            {preference?.is_looking && (
              <>
                <div>
                  <label className="block text-xs text-surface-500 dark:text-surface-400 mb-0.5">Preferred type (optional)</label>
                  <select
                    value={preference.preferred_unit_type || ""}
                    onChange={(e) => savePreference({ preferred_unit_type: e.target.value })}
                    disabled={prefSaving}
                    className="rounded-lg border border-surface-300 dark:border-surface-600 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                  >
                    {UNIT_TYPES.map((o) => (
                      <option key={o.value || "any"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-500 dark:text-surface-400 mb-0.5">Preferred location (optional)</label>
                  <input
                    type="text"
                    value={preference.preferred_location || ""}
                    onChange={(e) => setPreference((p) => p ? { ...p, preferred_location: e.target.value } : null)}
                    onBlur={(e) => savePreference({ preferred_location: e.target.value.trim() })}
                    disabled={prefSaving}
                    placeholder="City or area"
                    className="rounded-lg border border-surface-300 dark:border-surface-600 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-40"
                  />
                </div>
                <Link href="#dashboard-matches" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View my matches ↓</Link>
              </>
            )}
          </div>
          {preference?.is_looking && (
            <div id="dashboard-matches" className="pt-2 border-t border-surface-200 dark:border-surface-600">
              <h3 className="font-medium text-surface-800 dark:text-surface-200 mb-2">Matches for you</h3>
              {matchesLoading ? <p className="text-sm text-surface-500">Loading…</p> : matches.length === 0 ? <p className="text-sm text-surface-500">No matching vacancies right now. Try <Link href="/find-units" className="text-primary-600 dark:text-primary-400 hover:underline">Find Units</Link> to search.</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.slice(0, 6).map((item) => (
                    <Link key={item.id} href={`/find-units/${item.unit_id}`} className="block p-3 rounded-lg border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700/50 text-sm">
                      <span className="font-medium text-surface-900 dark:text-surface-100">{item.property_name} – Unit {item.unit_number}</span>
                      <span className="text-surface-500 dark:text-surface-400 ml-1">KSh {Number(item.monthly_rent).toLocaleString("en-KE")}/mo</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isServiceProvider && !canSeeOverview && !isTenant && (
        <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">Service Provider</h2>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">Manage your services, profile, and incoming requests from the Provider Dashboard.</p>
          <Link href="/dashboard/provider" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Open Provider Dashboard →
          </Link>
        </div>
      )}

      {!isPropertyOwner && !isTenant && !isManager && !isCaretaker && !isServiceProvider && (
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
