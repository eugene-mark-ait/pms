"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface VacancyInfo {
  available_from: string;
  show_property_owner_phone: boolean;
  show_manager_phone: boolean;
  show_caretaker_phone: boolean;
}

interface UnitDetail {
  id: string;
  property: string;
  property_name?: string;
  unit_number: string;
  is_vacant?: boolean;
  is_reserved?: boolean;
  vacancy_info?: VacancyInfo | null;
}

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vacancyStatus, setVacancyStatus] = useState<"vacant" | "occupied" | "reserved">("occupied");
  const [availableFrom, setAvailableFrom] = useState("");
  const [showPropertyOwnerPhone, setShowPropertyOwnerPhone] = useState(false);
  const [showManagerPhone, setShowManagerPhone] = useState(false);
  const [showCaretakerPhone, setShowCaretakerPhone] = useState(false);
  const [vacancySubmitting, setVacancySubmitting] = useState(false);
  const [vacancyError, setVacancyError] = useState("");

  function loadUnit() {
    if (!id) return;
    setLoading(true);
    api.get<UnitDetail>(`/units/${id}/`).then((res) => {
      const d = res.data;
      setUnit(d);
      setUnitNumber(d.unit_number);
      if (d.is_reserved) setVacancyStatus("reserved");
      else if (d.is_vacant) setVacancyStatus("vacant");
      else setVacancyStatus("occupied");
      if (d.vacancy_info) {
        setAvailableFrom(d.vacancy_info.available_from?.slice(0, 10) || "");
        setShowPropertyOwnerPhone(d.vacancy_info.show_property_owner_phone ?? false);
        setShowManagerPhone(d.vacancy_info.show_manager_phone ?? false);
        setShowCaretakerPhone(d.vacancy_info.show_caretaker_phone ?? false);
      } else {
        setAvailableFrom(new Date().toISOString().slice(0, 10));
      }
    }).catch(() => setError("Unit not found.")).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUnit();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/units/${id}/`, { unit_number: unitNumber });
      router.push("/units");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update unit.";
      setError(typeof msg === "string" ? msg : "Failed to update unit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVacancyStatusChange() {
    setVacancyError("");
    setVacancySubmitting(true);
    try {
      await api.patch(`/units/${id}/vacancy/`, {
        status: vacancyStatus,
        available_from: vacancyStatus === "vacant" ? availableFrom || undefined : undefined,
        show_property_owner_phone: vacancyStatus === "vacant" ? showPropertyOwnerPhone : undefined,
        show_manager_phone: vacancyStatus === "vacant" ? showManagerPhone : undefined,
        show_caretaker_phone: vacancyStatus === "vacant" ? showCaretakerPhone : undefined,
      });
      loadUnit();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update vacancy status.";
      setVacancyError(msg);
    } finally {
      setVacancySubmitting(false);
    }
  }

  if (loading) return <p className="text-surface-500 dark:text-surface-400">Loading…</p>;
  if (!unit) return <p className="text-surface-600 dark:text-surface-400">Unit not found.</p>;

  return (
    <div className="space-y-8">
      <Link href="/units" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300">← Units</Link>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Edit Unit</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit number</label>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            required
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
            {submitting ? "Saving…" : "Save"}
          </button>
          <Link href="/units" className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">Cancel</Link>
        </div>
      </form>

      <div className="max-w-md space-y-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
        <h2 className="font-semibold text-surface-900 dark:text-surface-100">Vacancy status</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400">Control whether this unit appears in tenant &quot;Find Units&quot; and which contact details are visible.</p>
        {vacancyError && <p className="text-sm text-red-600 dark:text-red-400">{vacancyError}</p>}
        <div>
          <span className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Status</span>
          <div className="flex flex-wrap gap-2">
            {(["vacant", "occupied", "reserved"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setVacancyStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                  vacancyStatus === status
                    ? "bg-primary-600 text-white"
                    : "border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        {vacancyStatus === "vacant" && (
          <>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Availability date</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Contact visibility (for tenants viewing this listing)</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPropertyOwnerPhone} onChange={(e) => setShowPropertyOwnerPhone(e.target.checked)} className="rounded border-surface-300 dark:border-surface-600" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">Show property owner phone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showManagerPhone} onChange={(e) => setShowManagerPhone(e.target.checked)} className="rounded border-surface-300 dark:border-surface-600" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">Show manager phone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showCaretakerPhone} onChange={(e) => setShowCaretakerPhone(e.target.checked)} className="rounded border-surface-300 dark:border-surface-600" />
                  <span className="text-sm text-surface-700 dark:text-surface-300">Show caretaker phone</span>
                </label>
              </div>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={handleVacancyStatusChange}
          disabled={vacancySubmitting}
          className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
        >
          {vacancySubmitting ? "Updating…" : "Update vacancy status"}
        </button>
      </div>
    </div>
  );
}
