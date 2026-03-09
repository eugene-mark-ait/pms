"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface Unit {
  id: string;
  unit_number: string;
  property: string;
}

export default function UnitsPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property");
  const [list, setList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = propertyId ? `/units/?property=${propertyId}` : "/units/";
    api
      .get<Unit[] | { results: Unit[] }>(url)
      .then((res) => {
        const data = res.data;
        setList(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [propertyId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Units</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No units.</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">
                  Unit number
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">
                  Property ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4 font-medium">{u.unit_number}</td>
                  <td className="px-6 py-4 text-surface-600">{u.property}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
