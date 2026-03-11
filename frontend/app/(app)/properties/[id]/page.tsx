"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, User, formatKSH } from "@/lib/api";

interface UserRef {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ManagerAssignment {
  id: string;
  manager: UserRef;
  assigned_at: string;
}

interface CaretakerAssignment {
  id: string;
  caretaker: UserRef;
  assigned_at: string;
}

interface UnitDetail {
  id: string;
  unit_number: string;
  unit_type?: string;
  monthly_rent?: string;
  is_vacant?: boolean;
  current_tenant_name?: string | null;
}

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  location?: string;
  landlord?: { id: string; email: string; first_name?: string; last_name?: string };
  units: UnitDetail[];
  unit_count?: number;
  occupied_count?: number;
  vacant_count?: number;
  total_rent_potential?: number | string;
  images?: { id: string; image: string; caption?: string }[];
  rules: { id: string; title: string }[];
  manager_assignments?: ManagerAssignment[];
  caretaker_assignments?: CaretakerAssignment[];
}

type AssignMode = "manager" | "caretaker" | null;

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignMode, setAssignMode] = useState<AssignMode>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; email: string; role_names: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const isLandlord = user?.role_names?.includes("landlord");
  const isManager = user?.role_names?.includes("manager");
  const canEdit = isLandlord || isManager;
  const canManageAssignments = isLandlord;

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  function refresh() {
    if (!id) return;
    api.get<PropertyDetail>(`/properties/${id}/`).then((res) => setProperty(res.data)).catch(() => setProperty(null)).finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleDelete() {
    if (!property || !confirm(`Delete property "${property.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${id}/`);
      router.push("/properties");
    } catch {
      alert("Failed to delete property.");
    }
  }

  async function searchUsers() {
    const q = userSearch.trim();
    if (!q) return;
    setSearching(true);
    setAssignError("");
    try {
      const { data } = await api.get<{ id: string; email: string; role_names: string[] }[]>(`/auth/users/?search=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
      setAssignError("Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function assignUser(userId: string, email: string, roleNames: string[]) {
    if (!assignMode) return;
    setAssigning(true);
    setAssignError("");
    try {
      const roleToAssign = assignMode === "manager" ? "manager" : "caretaker";
      if (!roleNames.includes(roleToAssign)) {
        await api.post("/auth/assign-roles/", { user_id: userId, role_names: [...roleNames, roleToAssign] });
      }
      if (assignMode === "manager") {
        await api.post(`/properties/${id}/managers/`, { user_id: userId });
      } else {
        await api.post(`/properties/${id}/caretakers/`, { user_id: userId });
      }
      setAssignMode(null);
      setUserSearch("");
      setSearchResults([]);
      refresh();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to assign.";
      setAssignError(typeof msg === "string" ? msg : "Failed to assign.");
    } finally {
      setAssigning(false);
    }
  }

  async function removeManager(userId: string) {
    if (!confirm("Remove this manager from the property?")) return;
    try {
      await api.delete(`/properties/${id}/managers/${userId}/`);
      refresh();
    } catch {
      alert("Failed to remove manager.");
    }
  }

  async function removeCaretaker(userId: string) {
    if (!confirm("Remove this caretaker from the property?")) return;
    try {
      await api.delete(`/properties/${id}/caretakers/${userId}/`);
      refresh();
    } catch {
      alert("Failed to remove caretaker.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-surface-500">Loading property…</div>
      </div>
    );
  }
  if (!property) {
    return (
      <div className="space-y-4">
        <Link href="/properties" className="text-primary-600 hover:underline">← Back to properties</Link>
        <p className="text-surface-600">Property not found. It may have been removed or you don’t have access.</p>
      </div>
    );
  }

  const managers = property.manager_assignments ?? [];
  const caretakers = property.caretaker_assignments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/properties" className="text-surface-500 hover:text-surface-700">← Properties</Link>
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/properties/${id}/edit`} className="rounded-lg border border-surface-300 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50">Edit</Link>
            {isLandlord && (
              <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
            )}
          </div>
        )}
      </div>
      {property.images && property.images.length > 0 && (
        <section className="rounded-xl overflow-hidden border border-surface-200 bg-surface-50">
          <img
            src={property.images[0].image.startsWith("http") ? property.images[0].image : ((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "") + property.images[0].image)}
            alt={property.name}
            className="w-full max-h-64 object-cover"
          />
        </section>
      )}

      <section className="rounded-xl border border-surface-200 bg-white p-4 sm:p-6">
        <h2 className="text-base font-semibold text-surface-900 mb-3">Overview</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-surface-500">Location</dt>
            <dd className="font-medium text-surface-900">{property.location || property.address?.slice(0, 40) || "—"}</dd>
          </div>
          <div>
            <dt className="text-surface-500">Owner</dt>
            <dd className="font-medium text-surface-900">
              {property.landlord ? `${property.landlord.first_name || ""} ${property.landlord.last_name || ""}`.trim() || property.landlord.email : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-surface-500">Units</dt>
            <dd className="font-medium text-surface-900">{property.unit_count ?? property.units?.length ?? 0} total</dd>
          </div>
          <div>
            <dt className="text-surface-500">Occupied / Vacant</dt>
            <dd className="font-medium text-surface-900">{property.occupied_count ?? 0} / {property.vacant_count ?? 0}</dd>
          </div>
          <div>
            <dt className="text-surface-500">Total monthly rent potential</dt>
            <dd className="font-medium text-surface-900">{formatKSH(property.total_rent_potential ?? 0)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-3">Units</h2>
        {(!property.units || property.units.length === 0) ? (
          <p className="text-surface-500">No units. {canEdit && <Link href={`/units/new?property=${property.id}`} className="text-primary-600 hover:underline">Add one</Link>}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property.units.map((u) => (
              <div key={u.id} className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/units?property=${property.id}`} className="font-medium text-surface-900 hover:text-primary-600">
                    Unit {u.unit_number}
                    {u.unit_type && <span className="text-surface-500 font-normal text-sm ml-1">({String(u.unit_type).replace(/_/g, " ")})</span>}
                  </Link>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${u.is_vacant ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"}`}>
                    {u.is_vacant ? "Vacant" : "Occupied"}
                  </span>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-surface-500">Rent</dt>
                    <dd className="font-medium">{formatKSH(u.monthly_rent ?? 0)}</dd>
                  </div>
                  {!u.is_vacant && u.current_tenant_name && (
                    <div className="flex justify-between">
                      <dt className="text-surface-500">Tenant</dt>
                      <dd className="font-medium">{u.current_tenant_name}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      {canManageAssignments && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-2">Managers</h2>
            <ul className="space-y-1">
              {managers.map((ma) => (
                <li key={ma.id} className="flex items-center justify-between gap-2">
                  <span>{ma.manager?.email ?? "—"}</span>
                  <button type="button" onClick={() => removeManager(ma.manager.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                </li>
              ))}
              {managers.length === 0 && <li className="text-surface-500">No managers assigned</li>}
            </ul>
            <button type="button" onClick={() => setAssignMode("manager")} className="mt-2 rounded-lg border border-surface-300 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50">
              Assign manager
            </button>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-2">Caretakers</h2>
            <ul className="space-y-1">
              {caretakers.map((ca) => (
                <li key={ca.id} className="flex items-center justify-between gap-2">
                  <span>{ca.caretaker?.email ?? "—"}</span>
                  <button type="button" onClick={() => removeCaretaker(ca.caretaker.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                </li>
              ))}
              {caretakers.length === 0 && <li className="text-surface-500">No caretakers assigned</li>}
            </ul>
            <button type="button" onClick={() => setAssignMode("caretaker")} className="mt-2 rounded-lg border border-surface-300 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50">
              Assign caretaker
            </button>
          </section>
        </>
      )}

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Rules</h2>
        <ul className="list-disc pl-6 space-y-1">
          {property.rules?.map((r) => <li key={r.id}>{r.title}</li>)}
          {(!property.rules || property.rules.length === 0) && <li className="text-surface-500">No rules</li>}
        </ul>
      </section>

      {assignMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !assigning && setAssignMode(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-900">
              Assign {assignMode === "manager" ? "manager" : "caretaker"}
            </h3>
            <p className="text-sm text-surface-600">Search by email to find a user, then assign them to this property. They will get the {assignMode} role if needed.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
              />
              <button type="button" onClick={searchUsers} disabled={searching} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
            {assignError && <p className="text-red-600 text-sm">{assignError}</p>}
            <ul className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 rounded-lg p-2">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">{u.email} {u.role_names?.length ? `(${u.role_names.join(", ")})` : ""}</span>
                  <button
                    type="button"
                    onClick={() => assignUser(u.id, u.email, u.role_names ?? [])}
                    disabled={assigning}
                    className="text-primary-600 hover:underline text-sm disabled:opacity-50"
                  >
                    Assign
                  </button>
                </li>
              ))}
              {searchResults.length === 0 && userSearch.trim() && !searching && <li className="text-surface-500 text-sm">No users found. Try another search.</li>}
            </ul>
            <div className="flex justify-end">
              <button type="button" onClick={() => setAssignMode(null)} disabled={assigning} className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
