"use client";

import { useState } from "react";
import { api, Lease } from "@/lib/api";
import SlideOverForm from "@/components/SlideOverForm";

type LeaseLike = Lease | { id: string; unit?: { id?: string; unit_number: string; property?: { name: string } } };

const inputBase = "w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function GiveEvictionNoticeDrawer({
  lease,
  onClose,
  onSuccess,
}: {
  lease: LeaseLike | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [evictionReason, setEvictionReason] = useState("");
  const [evictionDate, setEvictionDate] = useState("");
  const [optionalNotes, setOptionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lease) return;
    if (!evictionReason.trim()) {
      setError("Eviction reason is required");
      return;
    }
    if (!evictionDate) {
      setError("Move-out deadline is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post(`/leases/${lease.id}/eviction/`, {
        lease_id: lease.id,
        eviction_reason: evictionReason.trim(),
        eviction_date: evictionDate,
        optional_notes: optionalNotes.trim() || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; detail?: string } } };
      setError(ax.response?.data?.error || ax.response?.data?.detail || "Failed to submit eviction notice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlideOverForm
      isOpen={!!lease}
      onClose={onClose}
      title="Give Eviction Notice"
      width="md"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
            Cancel
          </button>
          <button form="give-eviction-form" type="submit" disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? "Submitting…" : "Submit eviction notice"}
          </button>
        </div>
      }
    >
      {lease && (
        <>
          <p className="text-surface-600 dark:text-surface-400 text-sm mb-6">
            {lease.unit?.property?.name ?? "Property"} – Unit {lease.unit?.unit_number ?? "—"}
          </p>
          <form id="give-eviction-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className={labelClass}>Eviction reason *</label>
              <textarea value={evictionReason} onChange={(e) => setEvictionReason(e.target.value)} required rows={4} placeholder="State the reason for this eviction notice" className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Move-out deadline *</label>
              <input type="date" value={evictionDate} onChange={(e) => setEvictionDate(e.target.value)} required className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Optional notes</label>
              <textarea value={optionalNotes} onChange={(e) => setOptionalNotes(e.target.value)} rows={3} placeholder="Additional details for the tenant" className={inputBase} />
            </div>
          </form>
        </>
      )}
    </SlideOverForm>
  );
}
