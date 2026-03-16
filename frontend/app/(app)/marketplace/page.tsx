"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

interface MarketplaceInsights {
  total_services?: number;
  active_providers?: number;
  total_requests?: number;
  recent_activity?: { id: string; type: string; label: string; at: string }[];
}

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<MarketplaceInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    // Stub: replace with real API when backend marketplace exists, e.g. GET /api/marketplace/insights/
    let cancelled = false;
    api.get<MarketplaceInsights>("/marketplace/insights/")
      .then((res) => { if (!cancelled) setInsights(res.data ?? null); })
      .catch(() => { if (!cancelled) setInsights(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalServices = insights?.total_services ?? 0;
  const activeProviders = insights?.active_providers ?? 0;
  const totalRequests = insights?.total_requests ?? 0;
  const recentActivity = insights?.recent_activity ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Marketplace</h1>
        <p className="mt-1 text-surface-600 dark:text-surface-400">
          Find property service providers: plumbers, electricians, cleaners, security, maintenance, and more.
        </p>
      </div>

      {!loading && (
        <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-4">Marketplace insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 p-4">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total services listed</p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{totalServices}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 p-4">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Active providers</p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{activeProviders}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 p-4">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Total requests / bookings</p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-surface-100">{totalRequests}</p>
            </div>
            <div className="rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Recent activity</p>
              <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
                {recentActivity.length === 0 ? "No recent activity" : `${recentActivity.length} item(s)`}
              </p>
            </div>
          </div>
          {recentActivity.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-surface-700 dark:text-surface-300">
              {recentActivity.slice(0, 5).map((a) => (
                <li key={a.id}>{a.label}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">Service providers</h2>
        <p className="text-surface-600 dark:text-surface-400 text-sm mb-4">
          Browse by category: Plumbers, Electricians, Cleaners, Security, Property inspection, General maintenance.
        </p>
        <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400 text-sm">Provider listing will appear here when the marketplace API is connected.</p>
          <p className="text-surface-400 dark:text-surface-500 text-xs mt-1">Use search and filters to find providers by category and location.</p>
        </div>
      </section>
    </div>
  );
}
