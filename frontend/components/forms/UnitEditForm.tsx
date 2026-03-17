"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const UNIT_EDIT_FORM_ID = "unit-edit-form";

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

interface UnitEditFormProps {
  unitId: string;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function UnitEditForm({ unitId, onSuccess, onSubmittingChange }: UnitEditFormProps) {
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
    if (!unitId) return;
    setLoading(true);
    api
      .get<UnitDetail>(`/units/${unitId}/`)
      .then((res) => {
        const d = res.data;
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
      })
      .catch(() => setError("Unit not found."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUnit();
  }, [unitId]);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [submitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await api.patch(`/units/${unitId}/`, { unit_number: unitNumber });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Failed to update unit.";
      setError(typeof msg === "string" ? msg : "Failed to update unit.");
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  async function handleVacancyStatusChange() {
    setVacancyError("");
    setVacancySubmitting(true);
    try {
      await api.patch(`/units/${unitId}/vacancy/`, {
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading unit…</span>
      </div>
    );
  }

  return (
    <>
      <form id={UNIT_EDIT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <div>
          <label className={labelClass}>Unit number</label>
          <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputBase} required />
        </div>
      </form>

      <div className="mt-6 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 space-y-4">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">Vacancy status</h3>
        <p className="text-xs text-surface-600 dark:text-surface-400">Control whether this unit appears in Find Units and which contact details are visible.</p>
        {vacancyError && <p className="text-sm text-red-600 dark:text-red-400">{vacancyError}</p>}
        <div>
          <span className={labelClass}>Status</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {(["vacant", "occupied", "reserved"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setVacancyStatus(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                  vacancyStatus === status ? "bg-primary-600 text-white" : "border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
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
              <label className={labelClass}>Availability date</label>
              <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputBase} />
            </div>
            <div className="space-y-2">
              <span className={labelClass}>Contact visibility</span>
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
          </>
        )}
        <button type="button" onClick={handleVacancyStatusChange} disabled={vacancySubmitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm hover:bg-primary-700 disabled:opacity-50">
          {vacancySubmitting ? "Updating…" : "Update vacancy status"}
        </button>
      </div>
    </>
  );
}
