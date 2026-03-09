"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  address: string;
  unit_count: number;
}

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Property[] | { results: Property[] }>("/properties/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Properties</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No properties.</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Address</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Units</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-surface-600">{p.address}</td>
                  <td className="px-6 py-4">{p.unit_count ?? 0}</td>
                  <td className="px-6 py-4">
                    <Link href={`/properties/${p.id}`} className="text-primary-600 hover:underline text-sm">
                      View
                    </Link>
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
