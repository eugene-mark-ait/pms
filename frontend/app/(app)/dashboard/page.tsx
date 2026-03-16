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

interface SubscriptionAlert {
  id: string;
  email: string;
  phone: string;
  search_filters: { unit_type?: string; location?: string; min_rent?: string | number; max_rent?: string | number };
  created_at: string;
  match_count: number;
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
  }>({});
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionAlert[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [addAlertOpen, setAddAlertOpen] = useState(false);
  const [addAlertSubmitting, setAddAlertSubmitting] = useState(false);
  const [addAlertError, setAddAlertError] = useState("");
  const [addAlertForm, setAddAlertForm] = useState({ location: "", unit_type: "", min_rent: "", max_rent: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addAlertDrawerVisible, setAddAlertDrawerVisible] = useState(false);
  const [preference, setPreference] = useState<VacancyPreference | null>(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [matches, setMatches] = useState<VacancyMatchItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

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
          const [myUnitsRes, paymentsRes, subsRes] = await Promise.all([
            api.get("/tenant/my-units/").catch(() => ({ data: [] })),
            api.get("/payments/history/").catch(() => ({ data: [] })),
            api.get<SubscriptionAlert[]>("/vacancies/my-subscriptions/").catch(() => ({ data: [] })),
          ]);
          const myUnits = Array.isArray(myUnitsRes.data) ? myUnitsRes.data : (myUnitsRes.data as { results?: unknown[] })?.results ?? [];
          const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data as { results?: unknown[] })?.results ?? [];
          const balance = (myUnits as { outstanding_balance?: string }[]).reduce((s, u) => s + parseFloat(u.outstanding_balance || "0"), 0);
          setStats({
            balance: balance.toFixed(2),
            myUnitsCount: (myUnits as unknown[]).length,
          });
          setRecentPayments((payments as PaymentRow[]).slice(0, 5));
          setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
        }
        if (roles.includes("tenant")) {
          api.get<VacancyPreference>("/vacancies/my-preference/").then((res) => setPreference(res.data)).catch(() => setPreference(null));
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

  function buildFindUnitsQuery(filters: SubscriptionAlert["search_filters"]) {
    const p = new URLSearchParams();
    if (filters?.unit_type) p.set("unit_type", String(filters.unit_type));
    if (filters?.location) p.set("location", String(filters.location));
    if (filters?.min_rent != null && String(filters.min_rent).trim()) p.set("min_rent", String(filters.min_rent));
    if (filters?.max_rent != null && String(filters.max_rent).trim()) p.set("max_rent", String(filters.max_rent));
    return p.toString();
  }

  function refreshSubscriptions() {
    if (!isTenant) return;
    setSubscriptionsLoading(true);
    api.get<SubscriptionAlert[]>("/vacancies/my-subscriptions/").then((r) => setSubscriptions(Array.isArray(r.data) ? r.data : [])).catch(() => setSubscriptions([])).finally(() => setSubscriptionsLoading(false));
  }

  function submitAddAlert(e: React.FormEvent) {
    e.preventDefault();
    setAddAlertError("");
    setAddAlertSubmitting(true);
    const filters: SubscriptionAlert["search_filters"] = {};
    if (addAlertForm.unit_type) filters.unit_type = addAlertForm.unit_type;
    if (addAlertForm.location.trim()) filters.location = addAlertForm.location.trim();
    if (addAlertForm.min_rent.trim()) filters.min_rent = addAlertForm.min_rent.trim();
    if (addAlertForm.max_rent.trim()) filters.max_rent = addAlertForm.max_rent.trim();
    api.post("/vacancies/notify-subscribe/", { email: user?.email ?? "", search_filters: filters }).then(() => {
      setAddAlertOpen(false);
      setAddAlertForm({ location: "", unit_type: "", min_rent: "", max_rent: "" });
      refreshSubscriptions();
    }).catch((err: { response?: { data?: { detail?: string } } }) => {
      setAddAlertError(err?.response?.data?.detail ?? "Failed to add alert.");
    }).finally(() => setAddAlertSubmitting(false));
  }

  function deleteSubscription(id: string) {
    if (!confirm("Remove this alert?")) return;
    setDeletingId(id);
    api.delete(`/vacancies/notify-subscribe/${id}/`).then(() => refreshSubscriptions()).finally(() => setDeletingId(null));
  }

  function formatUnitType(v: string) {
    return (UNIT_TYPES.find((t) => t.value === v)?.label ?? v) || "Any";
  }

  useEffect(() => {
    if (addAlertOpen) {
      const t = requestAnimationFrame(() => setAddAlertDrawerVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setAddAlertDrawerVisible(false);
  }, [addAlertOpen]);

  useEffect(() => {
    if (!isTenant || !preference?.is_looking) return;
    setMatchesLoading(true);
    api.get<VacancyMatchItem[] | { results?: VacancyMatchItem[] }>("/vacancies/matches/").then((res) => {
      const data = res.data;
      setMatches(Array.isArray(data) ? data : (data?.results ?? []));
    }).catch(() => setMatches([])).finally(() => setMatchesLoading(false));
  }, [isTenant, preference?.is_looking]);

  function savePreference(updates: Partial<VacancyPreference>) {
    if (!isTenant) return;
    setPrefError("");
    setPrefSaving(true);
    api.patch<VacancyPreference>("/vacancies/my-preference/", updates).then((res) => setPreference(res.data)).catch((err: { response?: { data?: { detail?: string } } }) => setPrefError(err?.response?.data?.detail ?? "Failed to save")).finally(() => setPrefSaving(false));
  }

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

      {isTenant && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Unit Alerts</h2>
            <button
              type="button"
              onClick={() => { setAddAlertOpen(true); setAddAlertError(""); }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Add Alert
            </button>
          </div>
          {subscriptionsLoading ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">Loading alerts…</p>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-6 text-center">
              <p className="text-surface-600 dark:text-surface-400 text-sm">No vacancy alerts yet.</p>
              <p className="text-surface-500 dark:text-surface-500 text-sm mt-1">Add an alert to get notified when units match your criteria.</p>
              <Link href="/find-units" className="mt-3 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Browse Find Units →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        Location: {sub.search_filters?.location || "Any"} · Budget: {sub.search_filters?.min_rent != null && String(sub.search_filters.min_rent).trim() ? `KES ${Number(sub.search_filters.min_rent).toLocaleString("en-KE")}` : "—"} – {sub.search_filters?.max_rent != null && String(sub.search_filters.max_rent).trim() ? `KES ${Number(sub.search_filters.max_rent).toLocaleString("en-KE")}` : "—"}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Type: {formatUnitType(sub.search_filters?.unit_type ?? "")}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Subscribed {format(new Date(sub.created_at), "MMM d, yyyy")}</p>
                      <p className="mt-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                        {sub.match_count} unit{sub.match_count !== 1 ? "s" : ""} currently match{sub.match_count === 1 ? "es" : ""} this alert
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/find-units?${buildFindUnitsQuery(sub.search_filters ?? {})}`}
                        className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700"
                      >
                        View Matches
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteSubscription(sub.id)}
                        disabled={deletingId === sub.id}
                        className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {deletingId === sub.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {addAlertOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => !addAlertSubmitting && setAddAlertOpen(false)} aria-hidden />
              <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-surface-800 shadow-xl border-l border-surface-200 dark:border-surface-700 z-50 flex flex-col transition-transform duration-300 ease-out ${addAlertDrawerVisible ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
                <div className="p-6 space-y-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Add vacancy alert</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Get notified when new units match your criteria.</p>
                  <form onSubmit={submitAddAlert} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={addAlertForm.location}
                      onChange={(e) => setAddAlertForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Westlands"
                      className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit type</label>
                    <select
                      value={addAlertForm.unit_type}
                      onChange={(e) => setAddAlertForm((f) => ({ ...f, unit_type: e.target.value }))}
                      className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                    >
                      {UNIT_TYPES.map((o) => (
                        <option key={o.value || "any"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Min rent (KSh)</label>
                      <input
                        type="number"
                        min={0}
                        value={addAlertForm.min_rent}
                        onChange={(e) => setAddAlertForm((f) => ({ ...f, min_rent: e.target.value }))}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max rent (KSh)</label>
                      <input
                        type="number"
                        min={0}
                        value={addAlertForm.max_rent}
                        onChange={(e) => setAddAlertForm((f) => ({ ...f, max_rent: e.target.value }))}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                      />
                    </div>
                  </div>
                  {addAlertError && <p className="text-sm text-red-600 dark:text-red-400">{addAlertError}</p>}
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAddAlertOpen(false)} disabled={addAlertSubmitting} className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                      Cancel
                    </button>
                    <button type="submit" disabled={addAlertSubmitting} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                      {addAlertSubmitting ? "Adding…" : "Save alert"}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            </>
          )}
        </section>
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
