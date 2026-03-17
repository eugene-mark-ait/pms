"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

export default function ProviderDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [servicesCount, setServicesCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isProvider) return;
    // Stub: replace with real APIs when backend marketplace exists
    api.get<{ count?: number }>("/marketplace/my-services/").then((r) => setServicesCount(r.data?.count ?? 0)).catch(() => setServicesCount(0));
    api.get<{ count?: number }>("/marketplace/my-requests/").then((r) => setRequestsCount(r.data?.count ?? 0)).catch(() => setRequestsCount(0));
  }, [isProvider]);

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
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Incoming requests</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 dark:text-surface-100">{requestsCount}</p>
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
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">Service requests (bookings)</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Incoming requests from property owners, managers, caretakers, and tenants.</p>
        <Link href="/dashboard/provider/requests" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View requests →</Link>
      </section>
    </div>
  );
}
