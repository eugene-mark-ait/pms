"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Unit {
  id: string;
  unit_number: string;
  property: string;
  is_vacant?: boolean;
  unit_type?: string;
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
  const propertyId = searchParams.get("property");
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPropertyId, setBulkPropertyId] = useState(propertyId ?? "");
  const [bulkFile, setBulkFile] = useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const canView = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");
  const canManage = user?.role_names?.includes("landlord") || user?.role_names?.includes("manager");
  const enabled = !!user && !!canView;

  const { items: list, loading, loadingMore, hasMore, error, refresh, sentinelRef } = useInfiniteScroll<Unit>({
    endpoint: "/units/",
    params: propertyId ? { property: propertyId } : {},
    pageSize: 20,
    enabled,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!canManage) return;
    api.get<PropertyOption[] | { results: PropertyOption[] }>("/properties/").then((res) => {
      const data = res.data;
      setProperties(Array.isArray(data) ? data : (data as { results?: PropertyOption[] })?.results ?? []);
    }).catch(() => setProperties([]));
  }, [canManage]);

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
        <h1 className="text-2xl font-bold text-surface-900">Units</h1>
        <p className="text-surface-600">You don’t have access to view units.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900">Units</h1>
        {canManage && (
          <div className="flex gap-2">
            <Link
              href={propertyId ? `/units/new?property=${propertyId}` : "/units/new"}
              className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium"
            >
              Add Unit
            </Link>
            <button
              type="button"
              onClick={() => { setBulkOpen(true); setBulkPropertyId(propertyId ?? ""); setBulkResult(null); }}
              className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-surface-700 hover:bg-surface-50 text-sm font-medium"
            >
              Bulk upload
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No units.{canManage && <> <Link href="/units/new" className="text-primary-600 hover:underline">Add one</Link>.</>}</p>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-surface-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Unit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Property</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-surface-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4 font-medium">{u.unit_number} {u.unit_type && <span className="text-surface-500 font-normal text-sm">({u.unit_type.replace(/_/g, " ")})</span>}</td>
                    <td className="px-6 py-4 text-surface-600">
                      <Link href={`/properties/${u.property}`} className="text-primary-600 hover:underline">{u.property}</Link>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_vacant ? (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">Vacant</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">Occupied</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {canManage && (
                        <>
                          <Link href={`/units/${u.id}/edit`} className="text-primary-600 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</Link>
                          <button type="button" onClick={() => handleDelete(u)} className="text-red-600 hover:underline text-sm">Delete</button>
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
              <div key={u.id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
                <p className="font-medium text-surface-900">{u.unit_number} {u.unit_type && <span className="text-surface-500 font-normal text-sm">({u.unit_type.replace(/_/g, " ")})</span>}</p>
                <Link href={`/properties/${u.property}`} className="text-sm text-primary-600 hover:underline mt-1 block">{u.property}</Link>
                <div className="mt-2">
                  {u.is_vacant ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Vacant</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Occupied</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-3 mt-3">
                    <Link href={`/units/${u.id}/edit`} className="min-h-[44px] inline-flex items-center text-primary-600 hover:underline text-sm font-medium">Edit</Link>
                    <button type="button" onClick={() => handleDelete(u)} className="min-h-[44px] text-red-600 hover:underline text-sm">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 text-sm">No more units</p>}
        </>
      )}

      {canManage && bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !bulkSubmitting && setBulkOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-surface-900">Bulk upload units</h2>
            <p className="text-sm text-surface-600">Upload a CSV with columns: Unit Name, Type, Rent, Deposit, Status.</p>
            <a href="/unit-bulk-template.csv" download className="inline-block text-sm text-primary-600 hover:underline">Download template</a>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Property</label>
              <select
                value={bulkPropertyId}
                onChange={(e) => setBulkPropertyId(e.target.value)}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">CSV content (paste or upload then paste)</label>
              <textarea
                value={bulkFile}
                onChange={(e) => setBulkFile(e.target.value)}
                placeholder="Unit Name,Type,Rent,Deposit,Status&#10;101,one_bedroom,1200,2400,vacant"
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900 font-mono text-sm min-h-[120px]"
                rows={6}
              />
            </div>
            {bulkResult && <p className={`text-sm ${bulkResult.startsWith("Created") ? "text-emerald-600" : "text-red-600"}`}>{bulkResult}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setBulkOpen(false)} disabled={bulkSubmitting} className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleBulkSubmit} disabled={bulkSubmitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">{bulkSubmitting ? "Creating…" : "Create units"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
