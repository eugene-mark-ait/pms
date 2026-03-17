"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export const LEASE_CREATE_FORM_ID = "lease-create-form";

interface UnitOption {
  id: string;
  unit_number: string;
  property: string;
  property_name?: string;
  monthly_rent?: string;
  security_deposit?: string;
  is_vacant?: boolean;
}

interface PropertyOption {
  id: string;
  name: string;
}

interface LeaseCreateFormProps {
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const inputBase = "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function LeaseCreateForm({ onSuccess, onSubmittingChange }: LeaseCreateFormProps) {
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [searchByPhone, setSearchByPhone] = useState(false);
  const [tenantResults, setTenantResults] = useState<{ id: string; email: string; first_name?: string; last_name?: string; role_names: string[]; phone?: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedTenantEmail, setSelectedTenantEmail] = useState("");
  const [selectedTenantName, setSelectedTenantName] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [depositPaid, setDepositPaid] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUnits = useCallback((propId: string) => {
    if (!propId) {
      setUnits([]);
      setUnitId("");
      setUnitsError("");
      return;
    }
    setUnitsLoading(true);
    setUnitsError("");
    setUnitId("");
    setUnits([]);
    setMonthlyRent("");
    setDepositAmount("0");
    api.get<UnitOption[] | { results: UnitOption[] }>("/units/", { params: { property: propId, page_size: 500 } })
      .then((res) => {
        const data = res.data;
        setUnits(Array.isArray(data) ? data : (data as { results?: UnitOption[] })?.results ?? []);
      })
      .catch(() => setUnitsError("Could not load units for this property."))
      .finally(() => setUnitsLoading(false));
  }, []);

  useEffect(() => {
    api.get<PropertyOption[]>("/properties/options/")
      .then((res) => setProperties(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPropertiesError("Could not load properties."))
      .finally(() => setPropertiesLoading(false));
  }, []);

  useEffect(() => {
    if (propertyId) fetchUnits(propertyId);
    else {
      setUnits([]);
      setUnitId("");
      setUnitsError("");
    }
  }, [propertyId, fetchUnits]);

  useEffect(() => {
    if (!unitId) return;
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      if (unit.monthly_rent != null && unit.monthly_rent !== "") setMonthlyRent(String(unit.monthly_rent));
      if (unit.security_deposit != null && unit.security_deposit !== "") setDepositAmount(String(unit.security_deposit));
    }
  }, [unitId, units]);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [submitting, onSubmittingChange]);

  async function searchTenants() {
    const q = tenantSearch.trim();
    if (!q) return;
    try {
      const param = searchByPhone ? "phone" : "search";
      const value = searchByPhone ? q.replace(/\D/g, "") || q : q;
      const { data } = await api.get<{ id: string; email: string; first_name?: string; last_name?: string; role_names: string[]; phone?: string }[]>(
        `/auth/users/?${param}=${encodeURIComponent(value)}`
      );
      const list = Array.isArray(data) ? data : [];
      setTenantResults(list);
      if (list.length === 1 && searchByPhone) {
        setSelectedTenantId(list[0].id);
        setSelectedTenantEmail(list[0].email);
        setSelectedTenantName([list[0].first_name, list[0].last_name].filter(Boolean).join(" ") || list[0].email);
      }
    } catch {
      setTenantResults([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenantId) {
      setError("Please search and select a tenant.");
      return;
    }
    setError("");
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await api.post("/leases/", {
        unit: unitId,
        tenant: selectedTenantId,
        monthly_rent: monthlyRent || undefined,
        deposit_amount: depositAmount || "0",
        deposit_paid: depositPaid,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail : "Failed to create lease.";
      setError(typeof msg === "string" ? msg : "Failed to create lease.");
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  const vacantUnits = units.filter((u) => u.is_vacant !== false);

  if (propertiesLoading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading properties…</span>
      </div>
    );
  }
  if (propertiesError) {
    return <p className="text-red-600 dark:text-red-400 text-sm">{propertiesError}</p>;
  }

  return (
    <form id={LEASE_CREATE_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
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
        <label className={labelClass}>Unit</label>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className={inputBase}
          required
          disabled={!propertyId || unitsLoading}
        >
          <option value="">
            {!propertyId ? "Select a property first" : unitsLoading ? "Loading units…" : vacantUnits.length === 0 ? "No vacant units" : "Select unit"}
          </option>
          {vacantUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.unit_number} {u.property_name ? `– ${u.property_name}` : ""}
            </option>
          ))}
        </select>
        {unitsLoading && (
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
            Loading units…
          </p>
        )}
        {unitsError && !unitsLoading && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{unitsError}</p>}
      </div>
      <div>
        <label className={labelClass}>Tenant</label>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Search by phone or email. The user will get the tenant role automatically.</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
            <input type="radio" checked={!searchByPhone} onChange={() => setSearchByPhone(false)} className="rounded border-surface-300 text-primary-600" />
            Email
          </label>
          <label className="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400">
            <input type="radio" checked={searchByPhone} onChange={() => setSearchByPhone(true)} className="rounded border-surface-300 text-primary-600" />
            Phone
          </label>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder={searchByPhone ? "e.g. 0712345678" : "Search by email"}
            value={tenantSearch}
            onChange={(e) => {
              setTenantSearch(e.target.value);
              setSelectedTenantId("");
              setSelectedTenantEmail("");
              setSelectedTenantName("");
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTenants())}
            className="flex-1 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
          />
          <button type="button" onClick={searchTenants} className="rounded-lg bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-200 px-4 py-2 hover:bg-surface-300 dark:hover:bg-surface-500">
            Search
          </button>
        </div>
        {tenantResults.length > 0 && (
          <ul className="border border-surface-200 dark:border-surface-600 rounded-lg divide-y divide-surface-200 dark:divide-surface-600 max-h-32 overflow-y-auto">
            {tenantResults.map((u) => {
              const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTenantId(u.id);
                      setSelectedTenantEmail(u.email);
                      setSelectedTenantName(name);
                      setTenantResults([]);
                      setTenantSearch(searchByPhone ? (u.phone || u.email) : u.email);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${selectedTenantId === u.id ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "hover:bg-surface-50 dark:hover:bg-surface-700/50 text-surface-900 dark:text-surface-100"}`}
                  >
                    {name} {u.email !== name ? `(${u.email})` : ""} {u.role_names?.length ? ` · ${u.role_names.join(", ")}` : ""}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {selectedTenantId && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Selected: {selectedTenantName || selectedTenantEmail} ({selectedTenantEmail})
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Monthly rent (from unit)</label>
          <input type="text" value={monthlyRent} readOnly disabled className="w-full rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 px-3 py-2 text-surface-700 dark:text-surface-300" />
        </div>
        <div>
          <label className={labelClass}>Deposit amount (from unit)</label>
          <input type="text" value={depositAmount} readOnly disabled className="w-full rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700/50 px-3 py-2 text-surface-700 dark:text-surface-300" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="depositPaid" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="rounded border-surface-300 dark:border-surface-600" />
        <label htmlFor="depositPaid" className="text-sm text-surface-700 dark:text-surface-300">Deposit paid</label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBase} required />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputBase} required />
        </div>
      </div>
    </form>
  );
}
