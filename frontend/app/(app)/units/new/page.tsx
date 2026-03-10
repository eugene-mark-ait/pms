"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface PropertyOption {
  id: string;
  name: string;
}

export default function NewUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdFromQuery = searchParams.get("property");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState(propertyIdFromQuery ?? "");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState("other");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<PropertyOption[] | { results: PropertyOption[] }>("/properties/").then((res) => {
      const data = res.data;
      const list = Array.isArray(data) ? data : data.results ?? [];
      setProperties(list);
      if (propertyIdFromQuery && !propertyId) setPropertyId(propertyIdFromQuery);
      else if (list.length === 1 && !propertyId) setPropertyId(list[0].id);
    }).catch(() => setProperties([])).finally(() => setLoading(false));
  }, [propertyIdFromQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/units/", {
        property: propertyId,
        unit_number: unitNumber,
        unit_type: unitType,
        monthly_rent: monthlyRent || "0",
      });
      router.push(`/units?property=${propertyId}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string; unit_number?: string[] } } }).response?.data
        : null;
      const detail = msg && typeof msg === "object" && "detail" in msg ? (msg as { detail?: string }).detail : null;
      const unitErr = msg && typeof msg === "object" && "unit_number" in msg ? (msg as { unit_number?: string[] }).unit_number?.[0] : null;
      setError(detail || unitErr || "Failed to create unit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-surface-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/units" className="text-surface-500 hover:text-surface-700">← Units</Link>
      <h1 className="text-2xl font-bold text-surface-900">Add Unit</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            required
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Unit number</label>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            placeholder="e.g. 101"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Unit type</label>
          <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900">
            <option value="bedsitter">Bedsitter</option>
            <option value="studio">Studio</option>
            <option value="one_bedroom">One Bedroom</option>
            <option value="two_bedroom">Two Bedroom</option>
            <option value="three_bedroom">Three Bedroom</option>
            <option value="penthouse">Penthouse</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Monthly rent</label>
          <input type="number" step="0.01" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" placeholder="0" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
            {submitting ? "Creating…" : "Create Unit"}
          </button>
          <Link href="/units" className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
