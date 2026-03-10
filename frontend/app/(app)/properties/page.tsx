"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  address: string;
  location?: string;
  unit_count: number;
  first_image?: string | null;
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition">
              <Link href={`/properties/${p.id}`} className="block aspect-video bg-surface-100 relative">
                {p.first_image ? (
                  <img src={p.first_image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-400 text-sm">No image</div>
                )}
              </Link>
              <div className="p-4">
                <h2 className="font-semibold text-surface-900">{p.name}</h2>
                <p className="text-sm text-surface-600 mt-1">{p.location || p.address}</p>
                <p className="text-xs text-surface-500 mt-1">{p.unit_count ?? 0} unit(s)</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/properties/${p.id}`} className="text-primary-600 hover:underline text-sm font-medium">View</Link>
                  {canEditDelete && (
                    <>
                      <Link href={`/properties/${p.id}/edit`} className="text-surface-600 hover:underline text-sm">Edit</Link>
                      {isLandlord && (
                        <button type="button" onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:underline text-sm">Delete</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
