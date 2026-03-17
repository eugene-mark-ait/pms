"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import SlideOverForm from "@/components/SlideOverForm";
import PropertyForm, { PROPERTY_FORM_ID } from "@/components/forms/PropertyForm";

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
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [propertySearchDebounced, setPropertySearchDebounced] = useState("");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null);
  const [propertyFormSubmitting, setPropertyFormSubmitting] = useState(false);
  const isPropertyOwner = user?.role_names?.includes("property_owner");
  const isManager = user?.role_names?.includes("manager");
  const isCaretaker = user?.role_names?.includes("caretaker");
  const canEditDelete = isPropertyOwner || isManager;
  const enabled = user !== null && (isPropertyOwner || isManager || isCaretaker);

  useEffect(() => {
    if (searchParams?.get("open") === "add" && isPropertyOwner) setAddDrawerOpen(true);
  }, [searchParams, isPropertyOwner]);

  useEffect(() => {
    const t = setTimeout(() => setPropertySearchDebounced(propertySearch.trim()), 300);
    return () => clearTimeout(t);
  }, [propertySearch]);

  const propertyParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (propertySearchDebounced) p.search = propertySearchDebounced;
    return p;
  }, [propertySearchDebounced]);

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Property>({
    endpoint: "/properties/",
    pageSize: 20,
    enabled,
    params: propertyParams,
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

  if (user && !isPropertyOwner && !isManager && !isCaretaker) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Properties</h1>
        <p className="text-surface-600 dark:text-surface-400">You don’t have access to view properties.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Properties</h1>
        {(isPropertyOwner || isManager || isCaretaker) && (
          <div className="flex items-center gap-2 min-w-[200px] max-w-sm flex-1">
            <label htmlFor="property-search" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap sr-only">
              Search properties
            </label>
            <input
              id="property-search"
              type="search"
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
              placeholder="Search by name or location…"
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm w-full"
            />
          </div>
        )}
        {isPropertyOwner && (
          <button
            type="button"
            onClick={() => setAddDrawerOpen(true)}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium min-h-[44px] inline-flex items-center"
          >
            Add Property
          </button>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button type="button" onClick={() => refresh()} className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700">
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading properties…</span>
        </div>
      ) : list.length === 0 && !error ? (
        <p className="text-surface-600 dark:text-surface-400">No properties.{isPropertyOwner && <> <button type="button" onClick={() => setAddDrawerOpen(true)} className="text-primary-600 dark:text-primary-400 hover:underline">Add one</button>.</>}</p>
      ) : list.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {list.map((p) => (
              <div key={p.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm hover:shadow-md transition">
                <Link href={`/properties/${p.id}`} className="block aspect-video bg-surface-100 dark:bg-surface-700 relative">
                  {p.first_image ? (
                    <img src={p.first_image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400 dark:text-surface-500 text-sm">No image</div>
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
                        <button type="button" onClick={() => setEditPropertyId(p.id)} className="text-surface-600 dark:text-surface-400 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</button>
                        {isPropertyOwner && (
                          <button type="button" onClick={() => handleDelete(p.id, p.name)} className="text-red-600 dark:text-red-400 hover:underline text-sm min-h-[44px] sm:min-h-0">Delete</button>
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
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more properties</p>}
        </>
      ) : null}

      <SlideOverForm
        isOpen={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title="Add Property"
        width="md"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAddDrawerOpen(false)} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={PROPERTY_FORM_ID} type="submit" disabled={propertyFormSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {propertyFormSubmitting ? "Creating…" : "Create Property"}
            </button>
          </div>
        }
      >
        <PropertyForm
          mode="create"
          onSuccess={() => { setAddDrawerOpen(false); refresh(); }}
          onSubmittingChange={setPropertyFormSubmitting}
        />
      </SlideOverForm>

      <SlideOverForm
        isOpen={editPropertyId !== null}
        onClose={() => setEditPropertyId(null)}
        title="Edit Property"
        width="md"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditPropertyId(null)} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={PROPERTY_FORM_ID} type="submit" disabled={propertyFormSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {propertyFormSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        {editPropertyId && (
          <PropertyForm
            mode="edit"
            propertyId={editPropertyId}
            onSuccess={() => { setEditPropertyId(null); refresh(); }}
            onSubmittingChange={setPropertyFormSubmitting}
          />
        )}
      </SlideOverForm>
    </div>
  );
}
