"use client";

import { useEffect, useState } from "react";
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
  contact: {
    landlord_phone?: string | null;
    manager_phone?: string | null;
    caretaker_phone?: string | null;
  };
  first_image: string | null;
}

interface VacancyPreference {
  id: string;
  is_looking: boolean;
  preferred_unit_type: string;
  preferred_location: string;
}

export default function FindUnitsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [unitType, setUnitType] = useState("");
  const [location, setLocation] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [list, setList] = useState<VacancyDiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [preference, setPreference] = useState<VacancyPreference | null>(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [matches, setMatches] = useState<VacancyDiscoveryItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const isTenant = user?.role_names?.includes("tenant");

  function search() {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams();
    if (unitType) params.set("unit_type", unitType);
    if (location.trim()) params.set("location", location.trim());
    if (minRent.trim()) params.set("min_rent", minRent.trim());
    if (maxRent.trim()) params.set("max_rent", maxRent.trim());
    api
      .get<VacancyDiscoveryItem[]>(`/vacancies/search/?${params.toString()}`)
      .then((res) => setList(Array.isArray(res.data) ? res.data : (res.data as { results?: VacancyDiscoveryItem[] })?.results ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    search();
  }, []);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isTenant) return;
    api.get<VacancyPreference>("/vacancies/my-preference/").then((res) => setPreference(res.data)).catch(() => setPreference(null));
  }, [isTenant]);

  useEffect(() => {
    if (!isTenant || !preference?.is_looking) return;
    setMatchesLoading(true);
    api.get<VacancyDiscoveryItem[]>(`/vacancies/matches/`).then((res) => setMatches(Array.isArray(res.data) ? res.data : (res.data as { results?: VacancyDiscoveryItem[] })?.results ?? [])).catch(() => setMatches([])).finally(() => setMatchesLoading(false));
  }, [isTenant, preference?.is_looking]);

  function savePreference(updates: Partial<VacancyPreference>) {
    if (!isTenant) return;
    setPrefError("");
    setPrefSaving(true);
    api.patch<VacancyPreference>("/vacancies/my-preference/", updates).then((res) => setPreference(res.data)).catch((err) => setPrefError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save")).finally(() => setPrefSaving(false));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Find a unit</h1>
      <p className="text-surface-600 dark:text-surface-400">Search available vacancies by unit type, location, and price.</p>

      {isTenant && (
        <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 space-y-4">
          <h2 className="font-semibold text-surface-900 dark:text-surface-100">Currently looking for a vacancy</h2>
          {prefError && <p className="text-sm text-red-600 dark:text-red-400">{prefError}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preference?.is_looking ?? false}
                onChange={(e) => savePreference({ is_looking: e.target.checked })}
                disabled={prefSaving}
                className="rounded border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">I am currently looking</span>
            </label>
            {preference?.is_looking && (
              <>
                <div>
                  <label className="block text-xs text-surface-500 dark:text-surface-400 mb-0.5">Preferred type (optional)</label>
                  <select
                    value={preference.preferred_unit_type || ""}
                    onChange={(e) => savePreference({ preferred_unit_type: e.target.value })}
                    disabled={prefSaving}
                    className="rounded-lg border border-surface-300 dark:border-surface-600 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700"
                  >
                    {UNIT_TYPES.map((o) => (
                      <option key={o.value || "any"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-surface-500 dark:text-surface-400 mb-0.5">Preferred location (optional)</label>
                  <input
                    type="text"
                    value={preference.preferred_location || ""}
                    onChange={(e) => setPreference((p) => p ? { ...p, preferred_location: e.target.value } : null)}
                    onBlur={(e) => savePreference({ preferred_location: e.target.value.trim() })}
                    disabled={prefSaving}
                    placeholder="City or area"
                    className="rounded-lg border border-surface-300 dark:border-surface-600 px-2 py-1.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-700 w-40"
                  />
                </div>
                <Link href="#matches" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View my matches ↓</Link>
              </>
            )}
          </div>
          {preference?.is_looking && (
            <div id="matches" className="pt-2 border-t border-surface-200 dark:border-surface-600">
              <h3 className="font-medium text-surface-800 dark:text-surface-200 mb-2">Matches for you</h3>
              {matchesLoading ? <p className="text-sm text-surface-500">Loading…</p> : matches.length === 0 ? <p className="text-sm text-surface-500">No matching vacancies right now. Try the search below.</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.slice(0, 6).map((item) => (
                    <Link key={item.id} href={`/find-units/${item.unit_id}`} className="block p-3 rounded-lg border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700/50 text-sm">
                      <span className="font-medium text-surface-900 dark:text-surface-100">{item.property_name} – Unit {item.unit_number}</span>
                      <span className="text-surface-500 dark:text-surface-400 ml-1">KSh {Number(item.monthly_rent).toLocaleString("en-KE")}/mo</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {loading && <p className="text-surface-500 dark:text-surface-400">Loading…</p>}
      {!loading && searched && list.length === 0 && (
        <p className="text-surface-600 dark:text-surface-400">No vacancies match your filters. Try different criteria.</p>
      )}
      {!loading && list.length > 0 && (
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
      )}
    </div>
  );
}
