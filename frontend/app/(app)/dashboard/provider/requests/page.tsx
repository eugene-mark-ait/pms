"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

export default function ProviderRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<unknown[]>([]);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isProvider) return;
    api.get<{ results?: unknown[] }>("/marketplace/my-requests/").then((r) => setRequests(r.data?.results ?? [])).catch(() => setRequests([]));
  }, [isProvider]);

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Incoming requests</h1>
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
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Incoming requests</h1>
      <p className="text-surface-600 dark:text-surface-400">View and respond to service requests and bookings from customers.</p>
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400 text-sm">No requests yet. Requests will appear here when customers contact you from the Marketplace.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(requests as { id: string }[]).map((r) => (
            <li key={r.id} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">Request (API coming soon)</li>
          ))}
        </ul>
      )}
    </div>
  );
}
