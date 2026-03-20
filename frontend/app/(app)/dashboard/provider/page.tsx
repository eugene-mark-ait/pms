"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { format } from "date-fns";

interface RequestCounts {
  pending: number;
  actioned: number;
}

interface IncomingRequestItem {
  id: string;
  service_title: string;
  requester_email: string;
  message: string;
  status: string;
  created_at: string;
}
interface RecentRequestItem extends IncomingRequestItem {}

export default function ProviderDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [servicesCount, setServicesCount] = useState(0);
  const [requestCounts, setRequestCounts] = useState<RequestCounts>({ pending: 0, actioned: 0 });
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequestItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequestItem[]>([]);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const loadProviderMarketplaceStats = useCallback(() => {
    if (!isProvider) return;
    api.get<{ results?: unknown[]; count?: number }>("/marketplace/my-services/").then((r) => {
      const d = r.data as { count?: number; results?: unknown[] };
      setServicesCount(d?.count ?? (Array.isArray(d?.results) ? d.results.length : 0));
    }).catch(() => setServicesCount(0));
    api.get<RequestCounts>("/marketplace/my-requests/counts/").then((r) => setRequestCounts(r.data ?? { pending: 0, actioned: 0 })).catch(() => setRequestCounts({ pending: 0, actioned: 0 }));
    api.get<{ results?: IncomingRequestItem[] }>("/marketplace/my-requests/").then((r) => {
      const raw = (r.data as { results?: IncomingRequestItem[] })?.results ?? r.data;
      setIncomingRequests(Array.isArray(raw) ? raw : []);
    }).catch(() => setIncomingRequests([]));
    api.get<{ results?: RecentRequestItem[] }>("/marketplace/my-requests/?status=all").then((r) => {
      const raw = (r.data as { results?: RecentRequestItem[] })?.results ?? r.data;
      setRecentRequests(Array.isArray(raw) ? raw.slice(0, 10) : []);
    }).catch(() => setRecentRequests([]));
  }, [isProvider]);

  useEffect(() => {
    loadProviderMarketplaceStats();
  }, [loadProviderMarketplaceStats]);

  useEffect(() => {
    if (!isProvider) return;
    const onUpdated = () => loadProviderMarketplaceStats();
    window.addEventListener("provider-requests-updated", onUpdated);
    return () => window.removeEventListener("provider-requests-updated", onUpdated);
  }, [isProvider, loadProviderMarketplaceStats]);

  if (loading) {
    return (
      <div className="flex justify-center min-h-[40vh] items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Provider Dashboard</h1>
        <p className="text-surface-600 dark:text-surface-400">You need the Service Provider role to access this page.</p>
        <Link href="/choose-role" className="text-primary-600 dark:text-primary-400 hover:underline">Choose role</Link>
      </div>
    );
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Provider";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">Provider Dashboard</h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">Welcome back, {displayName}. Manage your profile, services, and requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">My services</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{servicesCount}</p>
          <Link href="/dashboard/provider/services" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View & edit →</Link>
        </div>
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400">Incoming requests</p>
            <span className="text-lg font-bold text-surface-900 dark:text-surface-100">{requestCounts.pending}</span>
          </div>
          <Link href="/dashboard/provider/requests" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View requests →</Link>
        </div>
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Verification</p>
          <p className="mt-2 text-sm text-surface-700 dark:text-surface-300">Pending</p>
          <Link href="/dashboard/provider/profile" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">Profile & docs →</Link>
        </div>
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Reviews</p>
          <p className="mt-2 text-sm text-surface-700 dark:text-surface-300">—</p>
          <Link href="/dashboard/provider/reviews" className="mt-2 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View reviews →</Link>
        </div>
      </div>

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/provider/services"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Add a New Service You Offer
          </Link>
          <Link
            href="/dashboard/provider/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700"
          >
            Edit my profile
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700"
          >
            Account settings
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">My profile</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Business name, category, location, contact, and verification documents.</p>
        <Link href="/dashboard/provider/profile" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View and edit profile →</Link>
      </section>

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">My Incoming Requests</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Pending requests only. Mark as actioned when done; then users can rate the service.</p>
        {incomingRequests.length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400">No pending requests. They will appear here when users request your services.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {incomingRequests.map((req) => (
              <li key={req.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-700 p-3 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-100">{req.service_title}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">From: {req.requester_email}</p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5 line-clamp-2">{req.message}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{format(new Date(req.created_at), "MMM d, yyyy HH:mm")}</p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">Pending</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/provider/requests" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View all requests →</Link>
      </section>

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">Recent Requests</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Latest 10 requests (all statuses).</p>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400">No requests yet.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {recentRequests.map((req) => (
              <li key={req.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-surface-200 dark:border-surface-700 p-3 bg-surface-50/50 dark:bg-surface-800/50">
                <div className="min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-100">{req.service_title}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">From: {req.requester_email}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{format(new Date(req.created_at), "MMM d, yyyy")}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    req.status === "pending"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      : req.status === "actioned"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300"
                  }`}
                >
                  {req.status === "pending" ? "Pending" : req.status === "actioned" ? "Actioned" : "Cancelled"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/provider/requests" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View all requests →</Link>
      </section>
    </div>
  );
}
