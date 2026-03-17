"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export const UNIT_ALERT_FORM_ID = "unit-alert-form";

export const UNIT_TYPES_ALERT = [
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

export interface TenantUnitAlertType {
  id: string;
  unit_type: string;
  min_rent: string | number | null;
  max_rent: string | number | null;
  location: string;
  property_name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

interface UnitAlertFormProps {
  mode: "create" | "edit";
  alertId?: string;
  initialData?: Partial<TenantUnitAlertType>;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default function UnitAlertForm({
  mode,
  alertId,
  initialData,
  onSuccess,
  onSubmittingChange,
}: UnitAlertFormProps) {
  const [unitType, setUnitType] = useState(initialData?.unit_type ?? "");
  const [minRent, setMinRent] = useState(
    initialData?.min_rent != null ? String(initialData.min_rent) : ""
  );
  const [maxRent, setMaxRent] = useState(
    initialData?.max_rent != null ? String(initialData.max_rent) : ""
  );
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [propertyName, setPropertyName] = useState(initialData?.property_name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [loading, setLoading] = useState(mode === "edit" && !!alertId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function loadAlert() {
    if (!alertId) return;
    setLoading(true);
    api
      .get<TenantUnitAlertType>(`/vacancies/alerts/${alertId}/`)
      .then((res) => {
        const d = res.data;
        setUnitType(d.unit_type ?? "");
        setMinRent(d.min_rent != null ? String(d.min_rent) : "");
        setMaxRent(d.max_rent != null ? String(d.max_rent) : "");
        setLocation(d.location ?? "");
        setPropertyName(d.property_name ?? "");
      })
      .catch(() => setError("Alert not found."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (mode === "edit" && alertId) loadAlert();
    if (initialData) {
      setUnitType(initialData.unit_type ?? "");
      setMinRent(initialData.min_rent != null ? String(initialData.min_rent) : "");
      setMaxRent(initialData.max_rent != null ? String(initialData.max_rent) : "");
      setLocation(initialData.location ?? "");
      setPropertyName(initialData.property_name ?? "");
      setEmail(initialData.email ?? "");
      setPhone(initialData.phone ?? "");
    }
  }, [mode, alertId]);

  function hasAtLeastOneCriterion() {
    if ((unitType || "").trim()) return true;
    if ((location || "").trim()) return true;
    if ((propertyName || "").trim()) return true;
    if ((minRent || "").trim()) return true;
    if ((maxRent || "").trim()) return true;
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!hasAtLeastOneCriterion()) {
      setError("Provide at least one criterion: unit type, location, property name, or rent range.");
      return;
    }
    const min = minRent.trim() ? Number(minRent.trim()) : null;
    const max = maxRent.trim() ? Number(maxRent.trim()) : null;
    if (min != null && (Number.isNaN(min) || min < 0)) {
      setError("Min rent must be a valid number ≥ 0.");
      return;
    }
    if (max != null && (Number.isNaN(max) || max < 0)) {
      setError("Max rent must be a valid number ≥ 0.");
      return;
    }
    if (min != null && max != null && min > max) {
      setError("Min rent cannot be greater than max rent.");
      return;
    }
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const payload = {
        unit_type: unitType.trim(),
        min_rent: min,
        max_rent: max,
        location: location.trim(),
        property_name: propertyName.trim(),
      };
      if (mode === "create") {
        await api.post("/vacancies/alerts/", payload);
      } else if (alertId) {
        await api.patch(`/vacancies/alerts/${alertId}/`, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { unit_type?: string[]; min_rent?: string[]; max_rent?: string[]; location?: string[]; non_field_errors?: string[] } } };
      const data = ax.response?.data;
      if (data?.non_field_errors?.length) {
        setError(data.non_field_errors[0]);
      } else if (data?.unit_type?.length) {
        setError(data.unit_type[0]);
      } else if (data?.min_rent?.length) {
        setError(data.min_rent[0]);
      } else if (data?.max_rent?.length) {
        setError(data.max_rent[0]);
      } else if (data?.location?.length) {
        setError(data.location[0]);
      } else {
        setError("Failed to save alert. Please try again.");
      }
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <form id={UNIT_ALERT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>Unit type</label>
        <select
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
          className={inputBase}
        >
          {UNIT_TYPES_ALERT.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Min rent (KSh)</label>
          <input
            type="number"
            min={0}
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
            placeholder="Optional"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelClass}>Max rent (KSh)</label>
          <input
            type="number"
            min={0}
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            placeholder="Optional"
            className={inputBase}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Location / area</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or area (optional)"
          className={inputBase}
        />
      </div>
      <div>
        <label className={labelClass}>Property name (optional)</label>
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="Filter by property name"
          className={inputBase}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Contact email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Where to notify you"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelClass}>Contact phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07XX XXX XXX"
            className={inputBase}
          />
        </div>
      </div>
      <p className="text-xs text-surface-500 dark:text-surface-400">
        Provide at least one criterion. You’ll be notified when matching units become available.
      </p>
    </form>
  );
}
