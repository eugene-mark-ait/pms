"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import { SERVICE_CATEGORIES, type MarketplaceService } from "@/components/forms/ServiceForm";

interface MarketplaceInsights {
  total_services?: number;
  active_providers?: number;
  total_requests?: number;
  recent_activity?: { id: string; type: string; label: string; at: string }[];
}

function getCategoryLabel(value: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<MarketplaceInsights | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get<MarketplaceInsights>("/marketplace/insights/")
      .then((res) => { if (!cancelled) setInsights(res.data ?? null); })
      .catch(() => { if (!cancelled) setInsights(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get<{ results?: MarketplaceService[] }>("/marketplace/services/")
      .then((res) => { if (!cancelled) setServices(res.data?.results ?? []); })
      .catch(() => { if (!cancelled) setServices([]); })
      .finally(() => { if (!cancelled) setServicesLoading(false); });
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
          Browse by category: Plumbers, Electricians, Cleaners, Security, Maintenance, and more.
        </p>
        {servicesLoading ? (
          <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-6">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
            <span>Loading services…</span>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
            <p className="text-surface-500 dark:text-surface-400 text-sm">No services listed yet. Service providers can add their offerings from the Provider Dashboard.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-700/30 p-4"
              >
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">{s.title}</h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{getCategoryLabel(s.category)}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{s.service_area}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">{s.description}</p>
                {s.price_range && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">Price: {s.price_range}</p>
                )}
                {s.contact_info && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Contact: {s.contact_info}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
