"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Lease {
  id: string;
  tenant: { email: string; first_name: string; last_name: string };
  unit: { unit_number: string; property: { name: string } };
}

export default function TenantsPage() {
  const [list, setList] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Lease[] | { results: Lease[] }>("/leases/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Tenants</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No tenants.</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Tenant</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Property / Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((l) => (
                <tr key={l.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4">
                    {l.tenant?.first_name} {l.tenant?.last_name} ({l.tenant?.email})
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    {typeof l.unit?.property === "object" && l.unit?.property?.name
                      ? `${l.unit.property.name} – ${l.unit.unit_number}`
                      : `${l.unit?.unit_number}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
