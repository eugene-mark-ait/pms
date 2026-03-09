"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, User } from "@/lib/api";

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

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  units: { id: string; unit_number: string }[];
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

  if (loading) return <p className="text-surface-500">Loading…</p>;
  if (!property) return <p className="text-surface-600">Property not found.</p>;

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
      <h1 className="text-2xl font-bold text-surface-900">{property.name}</h1>
      <p className="text-surface-600">{property.address}</p>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Units</h2>
        <ul className="space-y-1">
          {property.units?.map((u) => (
            <li key={u.id}>
              <Link href={`/units?property=${property.id}`} className="text-primary-600 hover:underline">
                Unit {u.unit_number}
              </Link>
            </li>
          ))}
          {(!property.units || property.units.length === 0) && <li className="text-surface-500">No units</li>}
        </ul>
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
