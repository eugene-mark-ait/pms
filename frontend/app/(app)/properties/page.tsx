"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  address: string;
  unit_count: number;
}

export default function PropertiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const isLandlord = user?.role_names?.includes("landlord");
  const isManager = user?.role_names?.includes("manager");
  const canEditDelete = isLandlord || isManager;

  function refresh() {
    api.get<Property[] | { results: Property[] }>("/properties/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user != null && !isLandlord && !isManager) return;
    refresh();
  }, [user]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete property "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${id}/`);
      refresh();
    } catch {
      alert("Failed to delete property.");
    }
  }

  if (user && !isLandlord && !isManager) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900">Properties</h1>
        <p className="text-surface-600">You don’t have access to view properties.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Properties</h1>
        {isLandlord && (
          <Link
            href="/properties/new"
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium"
          >
            Add Property
          </Link>
        )}
      </div>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No properties.{isLandlord && <> <Link href="/properties/new" className="text-primary-600 hover:underline">Add one</Link>.</>}</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Address</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Units</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-surface-600">{p.address}</td>
                  <td className="px-6 py-4">{p.unit_count ?? 0}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/properties/${p.id}`} className="text-primary-600 hover:underline text-sm">View</Link>
                    {canEditDelete && (
                      <>
                        <Link href={`/properties/${p.id}/edit`} className="text-surface-600 hover:underline text-sm">Edit</Link>
                        {isLandlord && (
                          <button type="button" onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:underline text-sm">Delete</button>
                        )}
                      </>
                    )}
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
