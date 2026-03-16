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

interface UpcomingVacancy {
  id: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  tenant_name: string | null;
  notice_due_date: string;
  available_from: string;
}

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  location?: string;
  is_closed?: boolean;
  landlord?: { id: string; email: string; first_name?: string; last_name?: string };
  unit_count?: number;
  occupied_count?: number;
  vacant_count?: number;
  total_rent_potential?: number | string;
  images?: { id: string; image: string; caption?: string }[];
  upcoming_vacancies?: UpcomingVacancy[];
  rules: { id: string; title: string; description?: string }[];
  manager_assignments?: ManagerAssignment[];
  caretaker_assignments?: CaretakerAssignment[];
  public_description?: string;
  amenities?: string;
  parking_info?: string;
  nearby_landmarks?: string;
  house_rules?: string;
  contact_preference?: string;
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
  const [ruleForm, setRuleForm] = useState<{ open: boolean; id: string | null; title: string; description: string }>({ open: false, id: null, title: "", description: "" });
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleError, setRuleError] = useState("");
  const [publicListing, setPublicListing] = useState<{
    public_description: string;
    amenities: string;
    parking_info: string;
    nearby_landmarks: string;
    house_rules: string;
    contact_preference: string;
  }>({
    public_description: "",
    amenities: "",
    parking_info: "",
    nearby_landmarks: "",
    house_rules: "",
    contact_preference: "",
  });
  const [publicListingSaving, setPublicListingSaving] = useState(false);
  const [publicListingError, setPublicListingError] = useState("");

  const isLandlord = user?.role_names?.includes("landlord");
  const isManager = user?.role_names?.includes("manager");
  const isCaretaker = user?.role_names?.includes("caretaker");
  const canEdit = isLandlord || isManager;
  const canManageAssignments = isLandlord;
  const canCloseProperty = (isLandlord || isManager) && !isCaretaker;

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

  useEffect(() => {
    if (!property) return;
    setPublicListing({
      public_description: property.public_description ?? "",
      amenities: property.amenities ?? "",
      parking_info: property.parking_info ?? "",
      nearby_landmarks: property.nearby_landmarks ?? "",
      house_rules: property.house_rules ?? "",
      contact_preference: property.contact_preference ?? "",
    });
  }, [property]);

  async function handleDelete() {
    if (!property || !confirm(`Delete property "${property.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/properties/${id}/`);
      router.push("/properties");
    } catch {
      alert("Failed to delete property.");
    }
  }

  async function handleCloseProperty() {
    if (!property || property.is_closed || !confirm(`Close property "${property.name}"? You can reopen it later by editing the property.`)) return;
    try {
      await api.patch(`/properties/${id}/`, { is_closed: true });
      refresh();
    } catch {
      alert("Failed to close property.");
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

  function openAddRule() {
    setRuleForm({ open: true, id: null, title: "", description: "" });
    setRuleError("");
  }
  function openEditRule(r: { id: string; title: string; description?: string }) {
    setRuleForm({ open: true, id: r.id, title: r.title, description: r.description ?? "" });
    setRuleError("");
  }
  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleError("");
    setRuleSubmitting(true);
    try {
      if (ruleForm.id) {
        await api.patch(`/properties/${id}/rules/${ruleForm.id}/`, { title: ruleForm.title, description: ruleForm.description });
      } else {
        await api.post(`/properties/${id}/rules/`, { title: ruleForm.title, description: ruleForm.description });
      }
      setRuleForm((prev) => ({ ...prev, open: false }));
      refresh();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail : "Failed to save rule.";
      setRuleError(typeof msg === "string" ? msg : "Failed to save rule.");
    } finally {
      setRuleSubmitting(false);
    }
  }
  async function deleteRule(ruleId: string) {
    if (!confirm("Delete this rule?")) return;
    try {
      await api.delete(`/properties/${id}/rules/${ruleId}/`);
      refresh();
    } catch {
      alert("Failed to delete rule.");
    }
  }

  async function savePublicListing(e: React.FormEvent) {
    e.preventDefault();
    setPublicListingError("");
    setPublicListingSaving(true);
    try {
      await api.patch(`/properties/${id}/`, publicListing);
      refresh();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to save.";
      setPublicListingError(typeof msg === "string" ? msg : "Failed to save.");
    } finally {
      setPublicListingSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-surface-500 dark:text-surface-400">Loading property…</div>
      </div>
    );
  }
  if (!property) {
    return (
      <div className="space-y-4">
        <Link href="/properties" className="text-primary-600 dark:text-primary-400 hover:underline">← Back to properties</Link>
        <p className="text-surface-600 dark:text-surface-400">Property not found. It may have been removed or you don’t have access.</p>
      </div>
    );
  }

  const managers = property.manager_assignments ?? [];
  const caretakers = property.caretaker_assignments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link href="/properties" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300">← Properties</Link>
          {property.is_closed && (
            <span className="inline-flex items-center rounded-md bg-surface-200 dark:bg-surface-600 px-2 py-0.5 text-xs font-medium text-surface-700 dark:text-surface-300">
              Closed
            </span>
          )}
        </div>
        {canEdit && !property.is_closed && (
          <div className="flex gap-2">
            <Link href={`/properties/${id}/edit`} className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">Edit</Link>
            {canCloseProperty && (
              <button type="button" onClick={handleCloseProperty} className="rounded-lg border border-amber-200 dark:border-amber-700 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30">
                Close property
              </button>
            )}
            {isLandlord && (
              <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
            )}
          </div>
        )}
      </div>
      <section className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0].image.startsWith("http") ? property.images[0].image : ((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "") + property.images[0].image)}
            alt={property.name}
            className="w-full h-[320px] sm:h-[400px] object-cover"
          />
        ) : (
          <div className="w-full h-[320px] sm:h-[400px] flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500 text-sm">
            No property image
          </div>
        )}
      </section>

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">Overview</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Location</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{property.location || property.address?.slice(0, 40) || "—"}</dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Owner</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">
              {property.landlord ? `${property.landlord.first_name || ""} ${property.landlord.last_name || ""}`.trim() || property.landlord.email : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Units</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{property.unit_count ?? 0} total</dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Occupied / Vacant</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{property.occupied_count ?? 0} / {property.vacant_count ?? 0}</dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Upcoming vacancies</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{property.upcoming_vacancies?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Total monthly rent potential</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{formatKSH(property.total_rent_potential ?? 0)}</dd>
          </div>
        </dl>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
          {canEdit && <Link href={`/units?property=${property.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">View and manage units →</Link>}
        </p>
      </section>

      {property.upcoming_vacancies && property.upcoming_vacancies.length > 0 && (
        <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">Upcoming vacancies</h2>
          <ul className="space-y-3">
            {property.upcoming_vacancies.map((v) => (
              <li key={v.id} className="border border-surface-200 dark:border-surface-600 rounded-lg p-3 text-sm">
                <p className="font-medium text-surface-900 dark:text-surface-100">Tenant: {v.tenant_name ?? "—"}</p>
                <p className="mt-1">
                  <span className="text-surface-500 dark:text-surface-400">Property: </span>
                  <Link href={`/properties/${v.property_id}`} className="text-primary-600 dark:text-primary-400 hover:underline">{v.property_name}</Link>
                </p>
                <p className="mt-1">
                  <span className="text-surface-500 dark:text-surface-400">Unit: </span>
                  <Link href={`/units/${v.unit_id}/edit`} className="text-primary-600 dark:text-primary-400 hover:underline">{v.unit_number}</Link>
                </p>
                <p className="mt-1 text-surface-600 dark:text-surface-400">Vacates on: {new Date(v.notice_due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">Public Listing Information</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">This information is shown on the Find Units listing for tenants. Edit and save to update.</p>
        <form onSubmit={savePublicListing} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
            <textarea
              value={publicListing.public_description}
              onChange={(e) => setPublicListing((p) => ({ ...p, public_description: e.target.value }))}
              disabled={!canEdit}
              rows={3}
              placeholder="Short description for the public listing"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Amenities</label>
            <input
              type="text"
              value={publicListing.amenities}
              onChange={(e) => setPublicListing((p) => ({ ...p, amenities: e.target.value }))}
              disabled={!canEdit}
              placeholder="e.g. Water, security, gym"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Parking</label>
            <input
              type="text"
              value={publicListing.parking_info}
              onChange={(e) => setPublicListing((p) => ({ ...p, parking_info: e.target.value }))}
              disabled={!canEdit}
              placeholder="Parking information"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Nearby landmarks</label>
            <input
              type="text"
              value={publicListing.nearby_landmarks}
              onChange={(e) => setPublicListing((p) => ({ ...p, nearby_landmarks: e.target.value }))}
              disabled={!canEdit}
              placeholder="e.g. Near mall, school"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">House rules</label>
            <textarea
              value={publicListing.house_rules}
              onChange={(e) => setPublicListing((p) => ({ ...p, house_rules: e.target.value }))}
              disabled={!canEdit}
              rows={2}
              placeholder="Rules for tenants"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Contact preference</label>
            <input
              type="text"
              value={publicListing.contact_preference}
              onChange={(e) => setPublicListing((p) => ({ ...p, contact_preference: e.target.value }))}
              disabled={!canEdit}
              placeholder="e.g. Call preferred, WhatsApp, email"
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 disabled:opacity-70"
            />
          </div>
          {publicListingError && <p className="text-sm text-red-600 dark:text-red-400">{publicListingError}</p>}
          {canEdit && (
            <button type="submit" disabled={publicListingSaving} className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm hover:bg-primary-700 disabled:opacity-50">
              {publicListingSaving ? "Saving…" : "Save public listing"}
            </button>
          )}
        </form>
      </section>

      {canManageAssignments && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Managers</h2>
            <ul className="space-y-1">
              {managers.map((ma) => (
                <li key={ma.id} className="flex items-center justify-between gap-2 text-surface-900 dark:text-surface-100">
                  <span>{ma.manager?.email ?? "—"}</span>
                  <button type="button" onClick={() => removeManager(ma.manager.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Remove</button>
                </li>
              ))}
              {managers.length === 0 && <li className="text-surface-500 dark:text-surface-400">No managers assigned</li>}
            </ul>
            <button type="button" onClick={() => setAssignMode("manager")} className="mt-2 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
              Assign manager
            </button>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Caretakers</h2>
            <ul className="space-y-1">
              {caretakers.map((ca) => (
                <li key={ca.id} className="flex items-center justify-between gap-2 text-surface-900 dark:text-surface-100">
                  <span>{ca.caretaker?.email ?? "—"}</span>
                  <button type="button" onClick={() => removeCaretaker(ca.caretaker.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Remove</button>
                </li>
              ))}
              {caretakers.length === 0 && <li className="text-surface-500 dark:text-surface-400">No caretakers assigned</li>}
            </ul>
            <button type="button" onClick={() => setAssignMode("caretaker")} className="mt-2 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
              Assign caretaker
            </button>
          </section>
        </>
      )}

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">Property rules</h2>
          {canEdit && (
            <button type="button" onClick={openAddRule} className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 min-h-[44px] sm:min-h-0">
              Add rule
            </button>
          )}
        </div>
        {(!property.rules || property.rules.length === 0) && !ruleForm.open ? (
          <p className="text-surface-500 dark:text-surface-400 text-sm">No rules.</p>
        ) : (
          <ul className="space-y-3">
            {property.rules?.map((r) => (
              <li key={r.id} className="border-l-2 border-surface-200 dark:border-surface-600 pl-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">{r.title}</p>
                  {r.description && <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">{r.description}</p>}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditRule(r)} className="text-primary-600 dark:text-primary-400 hover:underline text-sm min-h-[44px] sm:min-h-0 inline-flex items-center">Edit</button>
                    <button type="button" onClick={() => deleteRule(r.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {ruleForm.open && (
          <form onSubmit={saveRule} className="mt-4 p-4 border border-surface-200 dark:border-surface-600 rounded-lg space-y-3 bg-surface-50/50 dark:bg-surface-700/30">
            <input
              type="text"
              placeholder="Rule title"
              value={ruleForm.title}
              onChange={(e) => setRuleForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={ruleForm.description}
              onChange={(e) => setRuleForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-h-[80px]"
              rows={3}
            />
            {ruleError && <p className="text-red-600 dark:text-red-400 text-sm">{ruleError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={ruleSubmitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm hover:bg-primary-700 disabled:opacity-50">
                {ruleSubmitting ? "Saving…" : ruleForm.id ? "Update rule" : "Add rule"}
              </button>
              <button type="button" onClick={() => setRuleForm((prev) => ({ ...prev, open: false }))} disabled={ruleSubmitting} className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {assignMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !assigning && setAssignMode(null)}>
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Assign {assignMode === "manager" ? "manager" : "caretaker"}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">Search by email to find a user, then assign them to this property. They will get the {assignMode} role if needed.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                className="flex-1 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
              />
              <button type="button" onClick={searchUsers} disabled={searching} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
            {assignError && <p className="text-red-600 text-sm">{assignError}</p>}
            <ul className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 dark:border-surface-600 rounded-lg p-2 bg-surface-50 dark:bg-surface-700/30">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-1 text-surface-900 dark:text-surface-100">
                  <span className="text-sm">{u.email} {u.role_names?.length ? `(${u.role_names.join(", ")})` : ""}</span>
                  <button
                    type="button"
                    onClick={() => assignUser(u.id, u.email, u.role_names ?? [])}
                    disabled={assigning}
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm disabled:opacity-50"
                  >
                    Assign
                  </button>
                </li>
              ))}
              {searchResults.length === 0 && userSearch.trim() && !searching && <li className="text-surface-500 dark:text-surface-400 text-sm">No users found. Try another search.</li>}
            </ul>
            <div className="flex justify-end">
              <button type="button" onClick={() => setAssignMode(null)} disabled={assigning} className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
