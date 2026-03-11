"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface UnitOption {
  id: string;
  unit_number: string;
  property: string;
  monthly_rent?: string;
  security_deposit?: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

export default function NewLeasePage() {
  const router = useRouter();
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [unitId, setUnitId] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [searchByPhone, setSearchByPhone] = useState(false);
  const [tenantResults, setTenantResults] = useState<{ id: string; email: string; first_name?: string; last_name?: string; role_names: string[] }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedTenantEmail, setSelectedTenantEmail] = useState("");
  const [selectedTenantName, setSelectedTenantName] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [depositPaid, setDepositPaid] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<UnitOption[] | { results: UnitOption[] }>("/units/").then((r) => r.data),
      api.get<PropertyOption[] | { results: PropertyOption[] }>("/properties/").then((r) => r.data),
    ]).then(([unitsData, propsData]) => {
      setUnits(Array.isArray(unitsData) ? unitsData : (unitsData as { results?: UnitOption[] })?.results ?? []);
      setProperties(Array.isArray(propsData) ? propsData : (propsData as { results?: PropertyOption[] })?.results ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!unitId) return;
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      if (unit.monthly_rent != null && unit.monthly_rent !== "") setMonthlyRent(String(unit.monthly_rent));
      if (unit.security_deposit != null && unit.security_deposit !== "") setDepositAmount(String(unit.security_deposit));
    }
  }, [unitId, units]);

  async function searchTenants() {
    const q = tenantSearch.trim();
    if (!q) return;
    try {
      const param = searchByPhone ? "phone" : "search";
      const value = searchByPhone ? q.replace(/\D/g, "") || q : q;
      const { data } = await api.get<{ id: string; email: string; first_name?: string; last_name?: string; role_names: string[] }[]>(
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
    try {
      await api.post("/leases/", {
        unit: unitId,
        tenant: selectedTenantId,
        ...(monthlyRent ? { monthly_rent: monthlyRent } : {}),
        deposit_amount: depositAmount || "0",
        deposit_paid: depositPaid,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      });
      router.push("/tenants");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to create lease.";
      setError(typeof msg === "string" ? msg : "Failed to create lease.");
    } finally {
      setSubmitting(false);
    }
  }

  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? id;

  if (loading) return <p className="text-surface-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/tenants" className="text-surface-500 hover:text-surface-700">← Tenants</Link>
      <h1 className="text-2xl font-bold text-surface-900">Add Lease (Assign Tenant)</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Unit</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            required
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_number} – {propertyName(u.property)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Tenant</label>
          <p className="text-xs text-surface-500 mb-1">Search by phone or email. The user will get the tenant role automatically.</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-sm text-surface-600">
              <input type="radio" checked={!searchByPhone} onChange={() => setSearchByPhone(false)} className="rounded border-surface-300 text-primary-600" />
              Email
            </label>
            <label className="flex items-center gap-1.5 text-sm text-surface-600">
              <input type="radio" checked={searchByPhone} onChange={() => setSearchByPhone(true)} className="rounded border-surface-300 text-primary-600" />
              Phone
            </label>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder={searchByPhone ? "e.g. 0712345678" : "Search by email"}
              value={tenantSearch}
              onChange={(e) => { setTenantSearch(e.target.value); setSelectedTenantId(""); setSelectedTenantEmail(""); setSelectedTenantName(""); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTenants())}
              className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            />
            <button type="button" onClick={searchTenants} className="rounded-lg bg-surface-200 text-surface-700 px-4 py-2 hover:bg-surface-300">
              Search
            </button>
          </div>
          {tenantResults.length > 0 && (
            <ul className="border border-surface-200 rounded-lg divide-y max-h-32 overflow-y-auto">
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
                        setTenantSearch(searchByPhone ? (u as { phone?: string }).phone || u.email : u.email);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${selectedTenantId === u.id ? "bg-primary-50 text-primary-700" : "hover:bg-surface-50"}`}
                    >
                      {name} {u.email !== name ? `(${u.email})` : ""} {u.role_names?.length ? ` · ${u.role_names.join(", ")}` : ""}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {selectedTenantId && (
            <p className="text-sm text-surface-600 mt-1">
              Selected: {selectedTenantName || selectedTenantEmail} ({selectedTenantEmail})
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Monthly rent (from unit, editable)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Deposit amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="depositPaid"
            checked={depositPaid}
            onChange={(e) => setDepositPaid(e.target.checked)}
            className="rounded border-surface-300"
          />
          <label htmlFor="depositPaid" className="text-sm text-surface-700">Deposit paid</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
            {submitting ? "Creating…" : "Create Lease"}
          </button>
          <Link href="/tenants" className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
