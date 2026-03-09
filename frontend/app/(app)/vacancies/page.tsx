"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface Vacancy {
  id: string;
  unit: { unit_number: string };
  available_from: string;
  is_filled: boolean;
}

export default function VacanciesPage() {
  const [list, setList] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Vacancy[] | { results: Vacancy[] }>("/vacancies/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

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
            <div key={v.id} className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="font-medium">Unit {v.unit?.unit_number}</p>
              <p className="text-sm text-surface-500">Available from {format(new Date(v.available_from), "MMM d, yyyy")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
