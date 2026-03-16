"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";

const UNIT_TYPES = [
  { value: "", label: "Any" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "One Bedroom" },
  { value: "two_bedroom", label: "Two Bedroom" },
  { value: "three_bedroom", label: "Three Bedroom" },
  { value: "apartment", label: "Apartment" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "serviced_apartment", label: "Serviced Apartment" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 20;

interface VacancyDiscoveryItem {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  monthly_rent: string;
  available_from: string;
  property_id: string;
  property_name: string;
  address: string;
  location: string;
  public_description?: string;
  amenities?: string;
  parking_info?: string;
  nearby_landmarks?: string;
  house_rules?: string;
  contact_preference?: string;
  contact: {
    property_owner_phone?: string | null;
    manager_phone?: string | null;
    caretaker_phone?: string | null;
  };
  first_image: string | null;
}

interface VacancySearchResponse {
  results: VacancyDiscoveryItem[];
  count?: number;
  units_found?: number;
  next?: string | null;
  previous?: string | null;
}

export default function FindUnitsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [unitType, setUnitType] = useState("");
  const [location, setLocation] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [list, setList] = useState<VacancyDiscoveryItem[]>([]);
  const [unitsFound, setUnitsFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function getBaseSearchParams(): URLSearchParams {
    const params = new URLSearchParams();
    if (unitType) params.set("unit_type", unitType);
    if (location.trim()) params.set("location", location.trim());
    if (minRent.trim()) params.set("min_rent", minRent.trim());
    if (maxRent.trim()) params.set("max_rent", maxRent.trim());
    return params;
  }

  const search = useCallback(() => {
    setSearched(true);
    setNextPageUrl(null);
    setList([]);
    setLoading(true);
    const params = getBaseSearchParams();
    params.set("page_size", String(PAGE_SIZE));
    params.set("page", "1");
    api
      .get<VacancySearchResponse>(`/vacancies/search/?${params.toString()}`)
      .then((res) => {
        const d = res.data as VacancySearchResponse;
        setList(d.results ?? []);
        setUnitsFound(d.units_found ?? d.count ?? d.results?.length ?? 0);
        setNextPageUrl(d.next ?? null);
      })
      .catch(() => {
        setList([]);
        setUnitsFound(0);
        setNextPageUrl(null);
      })
      .finally(() => setLoading(false));
  }, [unitType, location, minRent, maxRent]);

  function loadMore() {
    if (!nextPageUrl || loadingMore || loading) return;
    setLoadingMore(true);
    api
      .get<VacancySearchResponse>(nextPageUrl)
      .then((res) => {
        const d = res.data as VacancySearchResponse;
        setList((prev) => [...prev, ...(d.results ?? [])]);
        setNextPageUrl(d.next ?? null);
      })
      .catch(() => setNextPageUrl(null))
      .finally(() => setLoadingMore(false));
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextPageUrl && !loadingMore && !loading) loadMore();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextPageUrl, loadingMore, loading]);

  useEffect(() => {
    const params = getBaseSearchParams();
    params.set("page_size", String(PAGE_SIZE));
    params.set("page", "1");
    setLoading(true);
    setSearched(true);
    api
      .get<VacancySearchResponse>(`/vacancies/search/?${params.toString()}`)
      .then((res) => {
        const d = res.data as VacancySearchResponse;
        setList(d.results ?? []);
        setUnitsFound(d.units_found ?? d.count ?? d.results?.length ?? 0);
        setNextPageUrl(d.next ?? null);
      })
      .catch(() => {
        setList([]);
        setUnitsFound(0);
        setNextPageUrl(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Find a unit</h1>
      <p className="text-surface-600 dark:text-surface-400">Search available vacancies by unit type, location, and price.</p>

      <div className="flex flex-wrap gap-4 items-end p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit type</label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 min-w-[140px]"
          >
            {UNIT_TYPES.map((o) => (
              <option key={o.value || "any"} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or area"
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 min-w-[180px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Min rent (KSh)</label>
          <input
            type="number"
            min={0}
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
            placeholder="Optional"
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-28"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Max rent (KSh)</label>
          <input
            type="number"
            min={0}
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            placeholder="Optional"
            className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-28"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {loading && list.length === 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-video bg-surface-200 dark:bg-surface-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && list.length === 0 && (
        <div className="space-y-2 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
          <p className="font-medium text-surface-800 dark:text-surface-200">Units Found: 0</p>
          <p className="text-surface-600 dark:text-surface-400">No units currently match your search. Try adjusting filters or check back later.</p>
        </div>
      )}

      {list.length > 0 && (
        <>
          {!loading && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
              <span className="font-medium text-surface-800 dark:text-surface-200">Units Found: {unitsFound}</span>
              <span>Showing {list.length}{list.length < unitsFound ? ` of ${unitsFound}` : ""}</span>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="aspect-video bg-surface-100 dark:bg-surface-700 relative">
                  <img
                    src={item.first_image || "https://placehold.co/400x225/f1f5f9/64748b?text=No+image"}
                    alt={item.property_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x225/f1f5f9/64748b?text=No+image";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <span className="bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
                      {item.unit_type}
                    </span>
                    <span className="bg-white/90 dark:bg-surface-800/90 text-surface-800 dark:text-surface-200 text-sm font-semibold px-2 py-1 rounded">
                      KSh {Number(item.monthly_rent).toLocaleString("en-KE")}/mo
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-surface-900 dark:text-surface-100">{item.property_name} – Unit {item.unit_number}</h2>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{item.location || item.address}</p>
                  {item.public_description && <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">{item.public_description}</p>}
                  {item.amenities && <p className="text-xs text-surface-500 dark:text-surface-500 mt-0.5">Amenities: {item.amenities}</p>}
                  <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">Available from {new Date(item.available_from).toLocaleDateString()}</p>
                  <Link
                    href={`/find-units/${item.unit_id}`}
                    className="mt-3 inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                  >
                    View details & contact →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px]" aria-hidden />
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          )}
          {!loadingMore && nextPageUrl && list.length < unitsFound && (
            <p className="text-center text-sm text-surface-500 dark:text-surface-400 py-2">Scroll for more</p>
          )}
          <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 space-y-4">
            <h3 className="font-medium text-surface-800 dark:text-surface-200">Get notified when new units match your search</h3>
            <form onSubmit={submitSubscribe} className="flex flex-wrap gap-4 items-end max-w-lg">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={subscribePhone}
                  onChange={(e) => setSubscribePhone(e.target.value)}
                  placeholder="+254..."
                  className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-44"
                />
              </div>
              <button type="submit" disabled={subscribeSubmitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
                {subscribeSubmitting ? "Subscribing…" : "Notify me"}
              </button>
            </form>
            {subscribeError && <p className="text-sm text-red-600 dark:text-red-400">{subscribeError}</p>}
            {subscribeSuccess && <p className="text-sm text-green-600 dark:text-green-400">You're subscribed. We'll notify you when a matching unit is available.</p>}
          </div>
        </>
      )}
    </div>
  );
}
