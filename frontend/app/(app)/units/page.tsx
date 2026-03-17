"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import SlideOverForm from "@/components/SlideOverForm";
import UnitCreateForm, { UNIT_CREATE_FORM_ID } from "@/components/forms/UnitCreateForm";
import UnitEditForm, { UNIT_EDIT_FORM_ID } from "@/components/forms/UnitEditForm";

interface Unit {
  id: string;
  unit_number: string;
  property: string;
  property_name?: string;
  is_vacant?: boolean;
  unit_type?: string;
  has_active_notice?: boolean;
}

interface PropertyOption {
  id: string;
  name: string;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = values[j] ?? ""; });
    rows.push(row);
  }
  return rows;
}

export default function UnitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get("property");
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [unitSearch, setUnitSearch] = useState("");
  const [unitSearchDebounced, setUnitSearchDebounced] = useState("");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editUnitId, setEditUnitId] = useState<string | null>(null);
  const [unitFormSubmitting, setUnitFormSubmitting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPropertyId, setBulkPropertyId] = useState(propertyId ?? "");
  const [bulkFile, setBulkFile] = useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const canView = user?.role_names?.includes("property_owner") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");
  const canManage = user?.role_names?.includes("property_owner") || user?.role_names?.includes("manager");
  const enabled = !!user && !!canView;

  useEffect(() => {
    const t = setTimeout(() => setUnitSearchDebounced(unitSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [unitSearch]);

  const unitParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (propertyId) p.property = propertyId;
    if (unitSearchDebounced) p.search = unitSearchDebounced;
    return p;
  }, [propertyId, unitSearchDebounced]);

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Unit>({
    endpoint: "/units/",
    params: unitParams,
    pageSize: 20,
    enabled,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!canView) return;
    api.get<PropertyOption[]>("/properties/options/").then((res) => {
      setProperties(Array.isArray(res.data) ? res.data : []);
    }).catch(() => setProperties([]));
  }, [canView]);

  useEffect(() => {
    if (searchParams?.get("open") === "add" && canManage) setAddDrawerOpen(true);
    const editId = searchParams?.get("edit");
    if (editId && canManage) setEditUnitId(editId);
  }, [searchParams, canManage]);

  async function handleBulkSubmit() {
    if (!bulkPropertyId || !bulkFile.trim()) {
      setBulkResult("Select a property and paste CSV or upload a file.");
      return;
    }
    const rows = parseCSV(bulkFile);
    if (rows.length === 0) {
      setBulkResult("No rows in CSV. Use template: Unit Name, Type, Rent, Deposit, Status");
      return;
    }
    const units = rows.map((r) => ({
      unit_number: r.unit_name ?? r["unit name"] ?? "",
      unit_type: (r.type ?? "other").toLowerCase().replace(/\s+/g, "_"),
      monthly_rent: r.rent ?? "0",
      security_deposit: r.deposit ?? "0",
    })).filter((u) => u.unit_number);
    if (units.length === 0) {
      setBulkResult("No valid rows (Unit Name required).");
      return;
    }
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const { data } = await api.post<{ created: number; errors: unknown[] }>("/units/bulk/", { property: bulkPropertyId, units });
      setBulkResult(`Created ${data.created} unit(s).${(data.errors?.length ?? 0) > 0 ? ` ${data.errors.length} row(s) had errors.` : ""}`);
      refresh();
      setBulkFile("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail : "Bulk create failed.";
      setBulkResult(typeof msg === "string" ? msg : "Bulk create failed.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function handleDelete(u: Unit) {
    if (!confirm(`Delete unit ${u.unit_number}?`)) return;
    try {
      await api.delete(`/units/${u.id}/`);
      refresh();
    } catch {
      alert("Failed to delete unit.");
    }
  }

  if (user && !canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Units</h1>
        <p className="text-surface-600 dark:text-surface-400">You don’t have access to view units.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Units</h1>
        {canView && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 min-w-[180px]">
              <label htmlFor="unit-search" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap sr-only">
                Search units
              </label>
              <input
                id="unit-search"
                type="search"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Search by unit name…"
                className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm w-full"
              />
            </div>
            {properties.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="unit-property-filter" className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
                  Property
                </label>
                <select
              id="unit-property-filter"
              value={propertyId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const params = new URLSearchParams(searchParams?.toString() ?? "");
                if (v) params.set("property", v);
                else params.delete("property");
                router.replace(params.toString() ? `/units?${params.toString()}` : "/units");
              }}
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-w-[180px]"
            >
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
              </div>
            )}
          </div>
        )}
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddDrawerOpen(true)}
              className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium"
            >
              Add Unit
            </button>
            <button
              type="button"
              onClick={() => { setBulkOpen(true); setBulkPropertyId(propertyId ?? ""); setBulkResult(null); }}
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-2 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 text-sm font-medium"
            >
              Bulk upload
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {loading ? (
        <p className="text-surface-500 dark:text-surface-400">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600 dark:text-surface-400">No units.{canManage && <> <button type="button" onClick={() => setAddDrawerOpen(true)} className="text-primary-600 dark:text-primary-400 hover:underline">Add one</button>.</>}</p>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Unit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Property</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30">
                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">{u.unit_number} {u.unit_type && <span className="text-surface-500 dark:text-surface-400 font-normal text-sm">({u.unit_type.replace(/_/g, " ")})</span>}</td>
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400 max-w-[180px]" title={u.property_name ?? u.property}>
                      <Link href={`/properties/${u.property}`} className="text-primary-600 dark:text-primary-400 hover:underline truncate block">
                        {u.property_name ? (u.property_name.length > 35 ? `${u.property_name.slice(0, 35)}…` : u.property_name) : u.property}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.has_active_notice && (
                          <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 ring-1 ring-amber-600/30">Notice Given</span>
                        )}
                        {u.is_vacant ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-600/20">Vacant</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20">Occupied</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {canManage && (
                        <>
                          <Link href={`/units/${u.id}/edit`} className="text-primary-600 dark:text-primary-400 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</Link>
                          <button type="button" onClick={() => handleDelete(u)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((u) => (
              <div key={u.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm">
                <p className="font-medium text-surface-900 dark:text-surface-100">{u.unit_number} {u.unit_type && <span className="text-surface-500 dark:text-surface-400 font-normal text-sm">({u.unit_type.replace(/_/g, " ")})</span>}</p>
                <Link href={`/properties/${u.property}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1 block truncate max-w-full" title={u.property_name ?? u.property}>
                  {u.property_name ? (u.property_name.length > 30 ? `${u.property_name.slice(0, 30)}…` : u.property_name) : u.property}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {u.has_active_notice && (
                    <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">Notice Given</span>
                  )}
                  {u.is_vacant ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Vacant</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">Occupied</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-3 mt-3">
                    <button type="button" onClick={() => setEditUnitId(u.id)} className="min-h-[44px] inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">Edit</button>
                    <button type="button" onClick={() => handleDelete(u)} className="min-h-[44px] text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 dark:text-surface-400 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more units</p>}
        </>
      )}

      <SlideOverForm
        isOpen={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title="Add Unit"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button type="button" onClick={onRequestClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={UNIT_CREATE_FORM_ID} type="submit" disabled={unitFormSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {unitFormSubmitting ? "Creating…" : "Create Unit"}
            </button>
          </div>
        )}
      >
        <UnitCreateForm
          initialPropertyId={propertyId ?? undefined}
          onSuccess={() => { setAddDrawerOpen(false); refresh(); }}
          onSubmittingChange={setUnitFormSubmitting}
        />
      </SlideOverForm>

      <SlideOverForm
        isOpen={editUnitId !== null}
        onClose={() => setEditUnitId(null)}
        title="Edit Unit"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button type="button" onClick={onRequestClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={UNIT_EDIT_FORM_ID} type="submit" disabled={unitFormSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {unitFormSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      >
        {editUnitId && (
          <UnitEditForm
            unitId={editUnitId}
            onSuccess={() => { setEditUnitId(null); refresh(); }}
            onSubmittingChange={setUnitFormSubmitting}
          />
        )}
      </SlideOverForm>

      <SlideOverForm
        isOpen={bulkOpen}
        onClose={() => !bulkSubmitting && setBulkOpen(false)}
        title="Bulk upload units"
        width="lg"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button type="button" onClick={onRequestClose} disabled={bulkSubmitting} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleBulkSubmit} disabled={bulkSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {bulkSubmitting ? "Creating…" : "Create units"}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">Upload a CSV with columns: Unit Name, Type, Rent, Deposit, Status.</p>
          <a href="/unit-bulk-template.csv" download className="inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline">Download template</a>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Property</label>
            <select
              value={bulkPropertyId}
              onChange={(e) => setBulkPropertyId(e.target.value)}
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            >
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">CSV content (paste or upload then paste)</label>
            <textarea
              value={bulkFile}
              onChange={(e) => setBulkFile(e.target.value)}
              placeholder="Unit Name,Type,Rent,Deposit,Status&#10;101,one_bedroom,1200,2400,vacant"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 font-mono text-sm min-h-[120px] placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              rows={6}
            />
          </div>
          {bulkResult && <p className={`text-sm ${bulkResult.startsWith("Created") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{bulkResult}</p>}
        </div>
      </SlideOverForm>
    </div>
  );
}
