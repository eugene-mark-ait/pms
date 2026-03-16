"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import EmptyState from "@/components/EmptyState";

interface Vacancy {
  id: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  tenant_name: string | null;
  notice_due_date: string;
  available_from: string;
  is_filled: boolean;
}

interface PropertyOption {
  id: string;
  name: string;
}

export default function VacanciesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<string>("");

  const canView =
    user?.role_names?.includes("property_owner") ||
    user?.role_names?.includes("manager") ||
    user?.role_names?.includes("caretaker");
  const enabled = !!user && !!canView;

  const { items: list, loading, loadingMore, hasMore, error, sentinelRef } = useInfiniteScroll<Vacancy>({
    endpoint: "/vacancies/",
    pageSize: 20,
    enabled,
    params: propertyFilter ? { property: propertyFilter } : {},
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!canView || !user) return;
    api.get<PropertyOption[]>("/properties/options/")
      .then((res) => setProperties(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProperties([]));
  }, [canView, user]);

  if (user && !canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Upcoming Vacancies</h1>
        <p className="text-surface-600 dark:text-surface-400">You don’t have access to view vacancies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Upcoming Vacancies</h1>
        {properties.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="vacancy-property-filter" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
              Property
            </label>
            <select
              id="vacancy-property-filter"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-w-[180px] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((v) => (
              <div key={v.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm">
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  Tenant: {v.tenant_name ?? "—"}
                </p>
                <p className="text-sm mt-1">
                  <span className="text-surface-500 dark:text-surface-400">Property: </span>
                  <Link href={`/properties/${v.property_id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                    {v.property_name}
                  </Link>
                </p>
                <p className="text-sm mt-1">
                  <span className="text-surface-500 dark:text-surface-400">Unit: </span>
                  <Link href={`/units/${v.unit_id}/edit`} className="text-primary-600 dark:text-primary-400 hover:underline">
                    {v.unit_number}
                  </Link>
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                  Vacates on: {format(new Date(v.notice_due_date), "d MMMM yyyy")}
                </p>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 dark:text-surface-400 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more vacancies</p>}
        </>
      )}
    </div>
  );
}
