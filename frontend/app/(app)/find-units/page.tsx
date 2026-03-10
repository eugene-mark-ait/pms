"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const UNIT_TYPES = [
  { value: "", label: "Any" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "One Bedroom" },
  { value: "two_bedroom", label: "Two Bedroom" },
  { value: "three_bedroom", label: "Three Bedroom" },
  { value: "penthouse", label: "Penthouse" },
  { value: "other", label: "Other" },
];

interface VacancySearchItem {
  id: string;
  property: { id: string; name: string; address: string; location?: string; first_image?: string | null };
  unit: {
    id: string;
    unit_number: string;
    unit_type: string;
    monthly_rent: string;
    is_vacant: boolean;
    images?: { id: string; image: string }[];
  };
  available_from: string;
  is_filled: boolean;
}

export default function FindUnitsPage() {
  const [unitType, setUnitType] = useState("");
  const [location, setLocation] = useState("");
  const [list, setList] = useState<VacancySearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function search() {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams();
    if (unitType) params.set("unit_type", unitType);
    if (location.trim()) params.set("location", location.trim());
    api
      .get<VacancySearchItem[]>(`/vacancies/search/?${params.toString()}`)
      .then((res) => setList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    search();
  }, []);

  const unitImageUrl = (unit: VacancySearchItem["unit"]) => {
    const imgs = unit.images;
    if (imgs?.length && imgs[0]?.image) return imgs[0].image;
    return null;
  };
  const propertyImageUrl = (item: VacancySearchItem) => item.property.first_image;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Find a unit</h1>
      <p className="text-surface-600">Search available vacancies by unit type and location.</p>

      <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-xl border border-surface-200">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Unit type</label>
          <select
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            className="rounded-lg border border-surface-300 px-3 py-2 text-surface-900 min-w-[140px]"
          >
            {UNIT_TYPES.map((o) => (
              <option key={o.value || "any"} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or area"
            className="rounded-lg border border-surface-300 px-3 py-2 text-surface-900 min-w-[180px]"
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

      {loading && <p className="text-surface-500">Loading…</p>}
      {!loading && searched && list.length === 0 && (
        <p className="text-surface-600">No vacancies match your filters. Try different criteria.</p>
      )}
      {!loading && list.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-video bg-surface-100 relative">
                <img
                  src={propertyImageUrl(item) || unitImageUrl(item.unit) || "https://placehold.co/400x225/f1f5f9/64748b?text=No+image"}
                  alt={item.property.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x225/f1f5f9/64748b?text=No+image";
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <span className="bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
                    {UNIT_TYPES.find((t) => t.value === item.unit.unit_type)?.label || item.unit.unit_type}
                  </span>
                  <span className="bg-white/90 text-surface-800 text-sm font-semibold px-2 py-1 rounded">
                    ${item.unit.monthly_rent}/mo
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-surface-900">{item.property.name} – Unit {item.unit.unit_number}</h2>
                <p className="text-sm text-surface-600 mt-1">{item.property.location || item.property.address}</p>
                <p className="text-xs text-surface-500 mt-1">Available from {new Date(item.available_from).toLocaleDateString()}</p>
                <Link
                  href={`/properties/${item.property.id}`}
                  className="mt-3 inline-block text-primary-600 hover:underline text-sm font-medium"
                >
                  View property →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
