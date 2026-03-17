"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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

function formatPriceRange(s: MarketplaceService): string {
  if (s.min_price != null && s.max_price != null) {
    return `KSh ${Number(s.min_price).toLocaleString("en-KE")} – ${Number(s.max_price).toLocaleString("en-KE")}`;
  }
  if (s.min_price != null) return `From KSh ${Number(s.min_price).toLocaleString("en-KE")}`;
  if (s.max_price != null) return `Up to KSh ${Number(s.max_price).toLocaleString("en-KE")}`;
  return s.price_range || "Price on request";
}

function StarRating({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, value));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= Math.round(v) ? "★" : "☆"}</span>
      ))}
      <span className="ml-1 text-sm text-surface-500 dark:text-surface-400">({v})</span>
    </span>
  );
}

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<MarketplaceInsights | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");

  const fetchServices = useCallback(() => {
    setServicesLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (minPrice.trim()) params.set("min_price", minPrice.trim());
    if (maxPrice.trim()) params.set("max_price", maxPrice.trim());
    if (minRating.trim()) params.set("min_rating", minRating.trim());
    api
      .get<{ results?: MarketplaceService[] }>(`/marketplace/services/?${params.toString()}`)
      .then((res) => setServices(res.data?.results ?? []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [category, minPrice, maxPrice, minRating]);

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
    fetchServices();
  }, [fetchServices]);

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
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">Browse services</h2>
        <p className="text-surface-600 dark:text-surface-400 text-sm mb-4">
          Filter by category, price range, and minimum rating.
        </p>
        <div className="flex flex-wrap gap-4 items-end p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700 mb-6">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 min-w-[140px]"
            >
              <option value="">All</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Min price (KSh)</label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Optional"
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 w-28 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max price (KSh)</label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Optional"
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 w-28 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Min rating</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}+ stars</option>
              ))}
            </select>
          </div>
        </div>
        {servicesLoading ? (
          <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-6">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
            <span>Loading services…</span>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
            <p className="text-surface-500 dark:text-surface-400 text-sm">No services match your filters. Try adjusting or clear filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/marketplace/services/${s.id}`}
                className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-700/30 p-4 hover:shadow-md transition block"
              >
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">{s.title}</h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{getCategoryLabel(s.category)}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{s.provider_name ?? "Provider"}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">{s.service_area}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">{s.description}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">{formatPriceRange(s)}</p>
                {(s.average_rating ?? 0) > 0 && (
                  <p className="mt-1"><StarRating value={s.average_rating ?? 0} /></p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
