"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

interface ServiceRequestItem {
  id: string;
  user: string;
  requester_email: string;
  provider: string;
  service: string;
  service_title: string;
  message: string;
  preferred_date: string | null;
  status: "pending" | "actioned" | "cancelled";
  created_at: string;
}

export default function ProviderRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const isProvider = user?.role_names?.includes("service_provider");

  function loadRequests() {
    if (!isProvider) return;
    api
      .get<{ results?: ServiceRequestItem[]; next?: string | null; count?: number } | ServiceRequestItem[]>("/marketplace/my-requests/")
      .then((r) => {
        const raw = (r.data as { results?: ServiceRequestItem[] })?.results ?? r.data;
        setRequests(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isProvider) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRequests();
  }, [isProvider]);

  async function handleMarkActioned(req: ServiceRequestItem) {
    setActioningId(req.id);
    try {
      await api.patch(`/marketplace/requests/${req.id}/`, { status: "actioned" });
      loadRequests();
    } catch {
      alert("Failed to update request.");
    } finally {
      setActioningId(null);
    }
  }

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My requests</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My requests</h1>
      <p className="text-surface-600 dark:text-surface-400">Incoming service requests from users. Mark as actioned when you’ve addressed them.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400">No requests yet. They will appear here when users request your services.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-surface-100">{req.service_title}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">From: {req.requester_email}</p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-2 whitespace-pre-wrap">{req.message}</p>
                  {req.preferred_date && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">Preferred date: {new Date(req.preferred_date).toLocaleDateString()}</p>
                  )}
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">Received {new Date(req.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      req.status === "pending"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                        : req.status === "actioned"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                          : "bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300"
                    }`}
                  >
                    {req.status === "pending" ? "Pending" : req.status === "actioned" ? "Actioned" : "Cancelled"}
                  </span>
                  {req.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleMarkActioned(req)}
                      disabled={actioningId === req.id}
                      className="rounded-lg bg-primary-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                    >
                      {actioningId === req.id ? "Updating…" : "Mark actioned"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
