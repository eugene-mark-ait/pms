"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Property {
  id: string;
  name: string;
  address: string;
  location?: string;
  unit_count: number;
  first_image?: string | null;
  is_closed?: boolean;
}

export default function PropertiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const isLandlord = user?.role_names?.includes("landlord");
  const isManager = user?.role_names?.includes("manager");
  const isCaretaker = user?.role_names?.includes("caretaker");
  const canEditDelete = isLandlord || isManager;
  const enabled = user !== null && (isLandlord || isManager || isCaretaker);

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Property>({
    endpoint: "/properties/",
    pageSize: 20,
    enabled,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete property "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${id}/`);
      refresh();
    } catch {
      alert("Failed to delete property.");
    }
  }

  if (user && !isLandlord && !isManager && !isCaretaker) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Properties</h1>
        <p className="text-surface-600 dark:text-surface-400">You don’t have access to view properties.</p>
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
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium min-h-[44px] inline-flex items-center"
          >
            Add Property
          </Link>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No properties.{isLandlord && <> <Link href="/properties/new" className="text-primary-600 hover:underline">Add one</Link>.</>}</p>
      ) : (
        <>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-surface-900 dark:text-surface-100">{p.name}</h2>
                    {p.is_closed && (
                      <span className="inline-flex items-center rounded-md bg-surface-200 dark:bg-surface-600 px-2 py-0.5 text-xs font-medium text-surface-700 dark:text-surface-300">
                        Closed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{p.location || p.address}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">{p.unit_count ?? 0} unit(s)</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/properties/${p.id}`} className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium min-h-[44px] sm:min-h-0 inline-flex items-center">View</Link>
                    {canEditDelete && !p.is_closed && (
                      <>
                        <Link href={`/properties/${p.id}/edit`} className="text-surface-600 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</Link>
                        {isLandlord && (
                          <button type="button" onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:underline text-sm min-h-[44px] sm:min-h-0">Delete</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 text-sm">No more properties</p>}
        </>
      )}
    </div>
  );
}
