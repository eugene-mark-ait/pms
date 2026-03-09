"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-surface-500">Loading…</p>;
  if (!user) return <p className="text-surface-600">Not logged in.</p>;

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
          <label className="block text-sm font-medium text-surface-500">Roles</label>
          <p className="text-surface-900">{user.role_names?.join(", ") || "—"}</p>
        </div>
      </div>
    </div>
  );
}
