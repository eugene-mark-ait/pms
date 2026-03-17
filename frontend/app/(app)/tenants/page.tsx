"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, User, getDisplayName } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { clsx } from "clsx";
import GiveEvictionNoticeDrawer from "@/components/GiveEvictionNoticeDrawer";
import SlideOverForm from "@/components/SlideOverForm";
import LeaseCreateForm, { LEASE_CREATE_FORM_ID } from "@/components/forms/LeaseCreateForm";

interface Lease {
  id: string;
  tenant: { email: string; first_name?: string; last_name?: string; phone?: string };
  unit: { id?: string; unit_number: string; property: { name: string } };
  payment_status?: string;
  is_active?: boolean;
  eviction_active?: boolean;
}

interface UnitOption {
  id: string;
  unit_number: string;
  property_name?: string;
  property?: { name: string };
}

export default function TenantsPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<"current" | "previous" | "all">("current");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantSearchDebounced, setTenantSearchDebounced] = useState("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [evictionDrawerLease, setEvictionDrawerLease] = useState<Lease | null>(null);
  const [addLeaseDrawerOpen, setAddLeaseDrawerOpen] = useState(false);
  const [leaseFormSubmitting, setLeaseFormSubmitting] = useState(false);

  const canView = user?.role_names?.includes("property_owner") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");
  const canManage = user?.role_names?.includes("property_owner") || user?.role_names?.includes("manager");
  const enabled = !!user && !!canView;

  // Debounce tenant search so we don't hit API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setTenantSearchDebounced(tenantSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [tenantSearch]);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (statusFilter === "current") p.is_active = "true";
    else if (statusFilter === "previous") p.is_active = "false";
    if (unitFilter) p.unit = unitFilter;
    if (tenantSearchDebounced) p.search = tenantSearchDebounced;
    return p;
  }, [statusFilter, unitFilter, tenantSearchDebounced]);

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Lease>({
    endpoint: "/leases/",
    pageSize: 20,
    enabled,
    params,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (searchParams?.get("open") === "add" && canManage) setAddLeaseDrawerOpen(true);
  }, [searchParams, canManage]);

  useEffect(() => {
    if (!canView) return;
    setUnitsLoading(true);
    api
      .get<UnitOption[] | { results: UnitOption[] }>("/units/", { params: { page_size: 500, page: 1 } })
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data as { results?: UnitOption[] })?.results ?? [];
        const options: UnitOption[] = list.map((u) => ({
          id: u.id,
          unit_number: u.unit_number,
          property_name: u.property?.name ?? u.property_name,
        }));
        setUnits(options.sort((a, b) => (a.property_name || "").localeCompare(b.property_name || "") || a.unit_number.localeCompare(b.unit_number)));
      })
      .catch(() => setUnits([]))
      .finally(() => setUnitsLoading(false));
  }, [canView]);

  if (user && !canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Tenants</h1>
        <p className="text-surface-600 dark:text-surface-400">You don’t have access to view tenants and leases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Tenants</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => setAddLeaseDrawerOpen(true)}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium min-h-[44px] inline-flex items-center"
          >
            Add Lease (Assign Tenant)
          </button>
        )}
      </div>

      {canView && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label htmlFor="tenant-search" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap sr-only">
              Search tenants
            </label>
            <input
              id="tenant-search"
              type="search"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm w-full max-w-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="tenant-status-filter" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
              Status
            </label>
            <select
              id="tenant-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "current" | "previous" | "all")}
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm min-w-[140px]"
            >
              <option value="current">Current tenants</option>
              <option value="previous">Previous tenants</option>
              <option value="all">All tenants</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="tenant-unit-filter" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
              Apartment / Unit
            </label>
            <select
              id="tenant-unit-filter"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              disabled={unitsLoading}
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm min-w-[180px]"
            >
              <option value="">All units</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.property_name ? `${u.property_name} – ${u.unit_number}` : u.unit_number}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading tenants…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-600 dark:text-surface-400 font-medium">No tenants found.</p>
          <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">Try changing the filters or add a lease to assign a tenant.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Tenant</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Property / Unit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {list.map((l) => {
                  const isPrevious = l.is_active === false;
                  return (
                    <tr
                      key={l.id}
                      className={clsx(
                        "hover:bg-surface-50 dark:hover:bg-surface-700/30",
                        isPrevious && "opacity-70 bg-surface-50/50 dark:bg-surface-800/50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className={clsx("font-medium", isPrevious ? "text-surface-500 dark:text-surface-400" : "text-surface-900 dark:text-surface-100")}>
                          {getDisplayName(l.tenant)}
                        </span>
                        <span className={clsx("text-sm block", isPrevious ? "text-surface-400 dark:text-surface-500" : "text-surface-500 dark:text-surface-400")}>
                          {l.tenant?.email}
                        </span>
                        {l.tenant?.phone && (
                          <span className={clsx("text-sm block", isPrevious ? "text-surface-400 dark:text-surface-500" : "text-surface-500 dark:text-surface-400")}>
                            {l.tenant.phone}
                          </span>
                        )}
                      </td>
                      <td className={clsx("px-6 py-4", isPrevious ? "text-surface-500 dark:text-surface-400" : "text-surface-600 dark:text-surface-400")}>
                        {typeof l.unit?.property === "object" && l.unit?.property?.name
                          ? `${l.unit.property.name} – ${l.unit.unit_number}`
                          : `${l.unit?.unit_number ?? "—"}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {l.is_active !== false && (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20">
                              Active lease
                            </span>
                          )}
                          {l.is_active === false && (
                            <span className="inline-flex items-center rounded-md bg-surface-200 dark:bg-surface-600 px-2 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                              Previous
                            </span>
                          )}
                          {l.eviction_active && (
                            <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-red-600/20">
                              Eviction notice
                            </span>
                          )}
                          {l.payment_status === "overdue" && (
                            <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-red-600/20">
                              Overdue
                            </span>
                          )}
                          {l.payment_status === "paid" || l.payment_status === "current" ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20">
                              Paid
                            </span>
                          ) : (
                            l.payment_status !== "overdue" &&
                            l.payment_status && (
                              <span className="inline-flex items-center rounded-md bg-surface-100 dark:bg-surface-700 px-2 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                                {l.payment_status}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage && (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {!isPrevious && !l.eviction_active && (
                              <button
                                type="button"
                                onClick={() => setEvictionDrawerLease(l)}
                                className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium min-h-[44px] sm:min-h-0 inline-flex items-center"
                              >
                                Give Eviction Notice
                              </button>
                            )}
                            <Link
                              href={`/tenants/${l.id}/edit`}
                              className={clsx("text-sm min-h-[44px] sm:min-h-0 inline-flex items-center", isPrevious ? "text-surface-500 dark:text-surface-400 hover:underline" : "text-primary-600 dark:text-primary-400 hover:underline")}
                            >
                              Edit
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((l) => {
              const isPrevious = l.is_active === false;
              return (
                <div
                  key={l.id}
                  className={clsx(
                    "bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm",
                    isPrevious && "opacity-75"
                  )}
                >
                  <p className={clsx("font-medium", isPrevious ? "text-surface-500 dark:text-surface-400" : "text-surface-900 dark:text-surface-100")}>
                    {getDisplayName(l.tenant)}
                  </p>
                  <p className={clsx("text-sm mt-0.5", isPrevious ? "text-surface-400 dark:text-surface-500" : "text-surface-600 dark:text-surface-400")}>{l.tenant?.email}</p>
                  {l.tenant?.phone && (
                    <p className={clsx("text-sm", isPrevious ? "text-surface-400 dark:text-surface-500" : "text-surface-500 dark:text-surface-400")}>{l.tenant.phone}</p>
                  )}
                  <p className={clsx("text-sm mt-2", isPrevious ? "text-surface-500 dark:text-surface-500" : "text-surface-500 dark:text-surface-400")}>
                    {typeof l.unit?.property === "object" && l.unit?.property?.name
                      ? `${l.unit.property.name} – ${l.unit.unit_number}`
                      : l.unit?.unit_number}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {l.is_active !== false && (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                    {l.is_active === false && (
                      <span className="inline-flex items-center rounded-md bg-surface-200 dark:bg-surface-600 px-2 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                        Previous
                      </span>
                    )}
                    {l.eviction_active && (
                      <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                        Eviction notice
                      </span>
                    )}
                    {l.payment_status === "overdue" && (
                      <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                        Overdue
                      </span>
                    )}
                    {(l.payment_status === "paid" || l.payment_status === "current") && (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Paid
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {!isPrevious && !l.eviction_active && (
                        <button
                          type="button"
                          onClick={() => setEvictionDrawerLease(l)}
                          className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline min-h-[44px] inline-flex items-center"
                        >
                          Give Eviction Notice
                        </button>
                      )}
                      <Link
                        href={`/tenants/${l.id}/edit`}
                        className={clsx("inline-flex items-center min-h-[44px] text-sm font-medium", isPrevious ? "text-surface-500 dark:text-surface-400 hover:underline" : "text-primary-600 dark:text-primary-400 hover:underline")}
                      >
                        Edit lease
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && (
              <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
                Loading more…
              </div>
            )}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more tenants</p>}
        </>
      )}
      <SlideOverForm
        isOpen={addLeaseDrawerOpen}
        onClose={() => setAddLeaseDrawerOpen(false)}
        title="Add Lease (Assign Tenant)"
        width="lg"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAddLeaseDrawerOpen(false)} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={LEASE_CREATE_FORM_ID} type="submit" disabled={leaseFormSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {leaseFormSubmitting ? "Creating…" : "Create Lease"}
            </button>
          </div>
        }
      >
        <LeaseCreateForm
          onSuccess={() => { setAddLeaseDrawerOpen(false); refresh(); }}
          onSubmittingChange={setLeaseFormSubmitting}
        />
      </SlideOverForm>

      <GiveEvictionNoticeDrawer
        lease={evictionDrawerLease}
        onClose={() => setEvictionDrawerLease(null)}
        onSuccess={() => { setEvictionDrawerLease(null); refresh(); }}
      />
    </div>
  );
}
