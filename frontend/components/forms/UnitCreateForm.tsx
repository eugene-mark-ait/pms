"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const UNIT_CREATE_FORM_ID = "unit-create-form";

interface PropertyOption {
  id: string;
  name: string;
}

interface UnitCreateFormProps {
  initialPropertyId?: string;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function UnitCreateForm({
  initialPropertyId = "",
  onSuccess,
  onSubmittingChange,
}: UnitCreateFormProps) {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
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
    api
      .get<PropertyOption[]>("/properties/options/")
      .then((res) => {
        const all = Array.isArray(res.data) ? res.data : [];
        setProperties(all);
        if (initialPropertyId) setPropertyId(initialPropertyId);
        else if (all.length === 1) setPropertyId(all[0].id);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [initialPropertyId]);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [submitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    onSubmittingChange?.(true);
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
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string; unit_number?: string[] } } }).response?.data
          : null;
      const detail = msg && typeof msg === "object" && "detail" in msg ? (msg as { detail?: string }).detail : null;
      const unitErr = msg && typeof msg === "object" && "unit_number" in msg ? (msg as { unit_number?: string[] }).unit_number?.[0] : null;
      setError(detail || unitErr || "Failed to create unit.");
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading properties…</span>
      </div>
    );
  }

  return (
    <form id={UNIT_CREATE_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <div>
        <label className={labelClass}>Property</label>
        <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputBase} required>
          <option value="">Select property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Unit number</label>
        <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputBase} placeholder="e.g. 101" required />
      </div>
      <div>
        <label className={labelClass}>Unit type</label>
        <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className={inputBase}>
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
          <label className={labelClass}>Rent</label>
          <input type="number" step="0.01" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputBase} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Payment frequency</label>
          <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value as "weekly" | "monthly" | "yearly")} className={inputBase}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Security deposit</label>
          <input type="number" step="0.01" min="0" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className={inputBase} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Service charge</label>
          <input type="number" step="0.01" min="0" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} className={inputBase} placeholder="0" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Extra costs (optional)</label>
        <input type="text" value={extraCosts} onChange={(e) => setExtraCosts(e.target.value)} className={inputBase} placeholder="e.g. Water, parking" />
      </div>
    </form>
  );
}
