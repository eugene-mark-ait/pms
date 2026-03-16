"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

export default function ProviderProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My profile</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My profile</h1>
      <p className="text-surface-600 dark:text-surface-400">Edit your business name, category, location, contact, description, and upload verification documents. Profile API coming soon.</p>
      <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
        <p className="text-surface-500 dark:text-surface-400 text-sm">Profile form will appear here when the marketplace backend is connected.</p>
        <Link href="/settings" className="mt-3 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Account settings →</Link>
      </div>
    </div>
  );
}
