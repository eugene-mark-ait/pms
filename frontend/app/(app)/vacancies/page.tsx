"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";

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
  const [list, setList] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  const canView =
    user?.role_names?.includes("landlord") ||
    user?.role_names?.includes("manager") ||
    user?.role_names?.includes("caretaker");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user != null && !canView) return;
    api.get<Vacancy[] | { results: Vacancy[] }>("/vacancies/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : (data as { results?: Vacancy[] })?.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, [user, canView]);

  if (user && !canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900">Upcoming Vacancies</h1>
        <p className="text-surface-600">You don’t have access to view vacancies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Upcoming Vacancies</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No upcoming vacancies.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.filter((v) => !v.is_filled).map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
              <p className="font-medium text-surface-900">
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
              <p className="text-sm text-surface-600 mt-2">
                Vacates on: {format(new Date(v.notice_due_date), "d MMMM yyyy")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
