"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

export default function ProviderServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<unknown[]>([]);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isProvider) return;
    api.get<{ results?: unknown[] }>("/marketplace/my-services/").then((r) => setServices(r.data?.results ?? [])).catch(() => setServices([]));
  }, [isProvider]);

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My services</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
        </div>
        <Link href="/dashboard/provider/services/new" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Add service</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My services</h1>
      <p className="text-surface-600 dark:text-surface-400">Create and edit the services you offer. Listings appear in the Marketplace.</p>
      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400 text-sm">No services yet. Add your first service listing.</p>
          <Link href="/dashboard/provider/services/new" className="mt-3 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Add service →</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {(services as { id?: string; service_title?: string }[]).map((s) => (
            <li key={s.id} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 flex items-center justify-between">
              <span className="font-medium text-surface-900 dark:text-surface-100">{s.service_title ?? "Service"}</span>
              <span className="text-sm text-surface-500 dark:text-surface-400">Edit (API coming soon)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
