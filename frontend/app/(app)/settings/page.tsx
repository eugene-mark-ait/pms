"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";

const ROLES = ["landlord", "manager", "tenant", "caretaker"];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignResults, setAssignResults] = useState<{ id: string; email: string; role_names: string[] }[]>([]);
  const [selectedForUser, setSelectedForUser] = useState<Record<string, string[]>>({});
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function searchForAssign() {
    const q = assignEmail.trim();
    if (!q) return;
    try {
      const { data } = await api.get<{ id: string; email: string; role_names: string[] }[]>(`/auth/users/?search=${encodeURIComponent(q)}`);
      const list = Array.isArray(data) ? data : [];
      setAssignResults(list);
      setSelectedForUser(Object.fromEntries(list.map((u) => [u.id, u.role_names ?? []])));
    } catch {
      setAssignResults([]);
    }
  }

  function toggleRole(userId: string, role: string) {
    setSelectedForUser((prev) => {
      const current = prev[userId] ?? [];
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, [userId]: next };
    });
  }

  async function submitAssign(targetUserId: string) {
    const roleNames = selectedForUser[targetUserId] ?? [];
    setAssigning(true);
    setAssignMsg("");
    try {
      await api.post("/auth/assign-roles/", { user_id: targetUserId, role_names: roleNames });
      setAssignMsg("Roles updated.");
      searchForAssign();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to assign roles.";
      setAssignMsg(typeof msg === "string" ? msg : "Failed.");
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <p className="text-surface-500">Loading…</p>;
  if (!user) return <p className="text-surface-600">Not logged in.</p>;

  const canAssignRoles = user?.is_staff === true;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
      <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-500">Email</label>
          <p className="text-surface-900">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-500">First name</label>
          <p className="text-surface-900">{user.first_name || "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-500">Last name</label>
          <p className="text-surface-900">{user.last_name || "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-500">Phone</label>
          <p className="text-surface-900">{user.phone || "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-500">Roles</label>
          <p className="text-surface-900">{user.role_names?.map((r) => r === "landlord" ? "Property Owner" : r).join(", ") || "—"}</p>
        </div>
      </div>

      {canAssignRoles && (
        <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-900">Assign roles to user</h2>
          <p className="text-sm text-surface-600">Staff only. Search by email and set roles (e.g. manager, caretaker, tenant, property owner).</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchForAssign())}
              className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            />
            <button type="button" onClick={searchForAssign} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700">Search</button>
          </div>
          {assignMsg && <p className="text-sm text-surface-600">{assignMsg}</p>}
          {assignResults.length > 0 && (
            <ul className="space-y-2 border border-surface-200 rounded-lg p-2">
              {assignResults.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-2 p-2 bg-surface-50 rounded">
                  <span className="font-medium">{u.email}</span>
                  <span className="text-xs text-surface-500">({u.role_names?.join(", ") || "no roles"})</span>
                  <div className="flex flex-wrap gap-1">
                    {ROLES.filter((r) => r !== "landlord" || user.role_names?.includes("staff")).map((role) => (
                      <label key={role} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={(selectedForUser[u.id] ?? []).includes(role)} onChange={() => toggleRole(u.id, role)} className="rounded" />
                        {role === "landlord" ? "Property Owner" : role}
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={() => submitAssign(u.id)} disabled={assigning} className="text-primary-600 hover:underline text-sm disabled:opacity-50">Apply roles</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
