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
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [extraCosts, setExtraCosts] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAllProperties() {
      const all: PropertyOption[] = [];
      let page = 1;
      const pageSize = 500;
      while (true) {
        const res = await api.get<{ results?: PropertyOption[]; next?: string | null }>("/properties/", {
          params: { page, page_size: pageSize },
        });
        const data = res.data;
        const results = data.results ?? [];
        all.push(...results);
        if (!data.next || results.length < pageSize) break;
        page += 1;
      }
      setProperties(all);
      if (propertyIdFromQuery) setPropertyId(propertyIdFromQuery);
      else if (all.length === 1) setPropertyId(all[0].id);
    }
    fetchAllProperties().catch(() => setProperties([])).finally(() => setLoading(false));
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
        security_deposit: securityDeposit || "0",
        service_charge: serviceCharge || "0",
        extra_costs: extraCosts || undefined,
        payment_frequency: paymentFrequency,
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
            <option value="apartment">Apartment</option>
            <option value="studio">Studio</option>
            <option value="bedsitter">Bedsitter</option>
            <option value="one_bedroom">One Bedroom</option>
            <option value="two_bedroom">Two Bedroom</option>
            <option value="three_bedroom">Three Bedroom</option>
            <option value="penthouse">Penthouse</option>
            <option value="duplex">Duplex</option>
            <option value="shop">Shop</option>
            <option value="office">Office</option>
            <option value="warehouse">Warehouse</option>
            <option value="retail_space">Retail Space</option>
            <option value="kiosk">Kiosk</option>
            <option value="parking_space">Parking Space</option>
            <option value="storage_unit">Storage Unit</option>
            <option value="commercial_space">Commercial Space</option>
            <option value="serviced_apartment">Serviced Apartment</option>
            <option value="hostel_room">Hostel Room</option>
            <option value="airbnb_unit">Airbnb Unit</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Rent</label>
            <input type="number" step="0.01" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Payment frequency</label>
            <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value as "weekly" | "monthly" | "yearly")} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Security deposit</label>
            <input type="number" step="0.01" min="0" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Service charge</label>
            <input type="number" step="0.01" min="0" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" placeholder="0" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Extra costs (optional)</label>
          <input type="text" value={extraCosts} onChange={(e) => setExtraCosts(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" placeholder="e.g. Water, parking" />
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
