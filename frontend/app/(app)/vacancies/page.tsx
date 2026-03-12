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

export default function VacanciesPage() {
  const [user, setUser] = useState<User | null>(null);

  const canView =
    user?.role_names?.includes("landlord") ||
    user?.role_names?.includes("manager") ||
    user?.role_names?.includes("caretaker");
  const enabled = !!user && !!canView;

  const { items: list, loading, loadingMore, hasMore, error, sentinelRef } = useInfiniteScroll<Vacancy>({
    endpoint: "/vacancies/",
    pageSize: 20,
    enabled,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

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
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Upcoming Vacancies</h1>
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
                  <span className="text-surface-500">Property: </span>
                  <Link href={`/properties/${v.property_id}`} className="text-primary-600 hover:underline">
                    {v.property_name}
                  </Link>
                </p>
                <p className="text-sm mt-1">
                  <span className="text-surface-500">Unit: </span>
                  <Link href={`/units/${v.unit_id}/edit`} className="text-primary-600 hover:underline">
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
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 text-sm">No more vacancies</p>}
        </>
      )}
    </div>
  );
}
