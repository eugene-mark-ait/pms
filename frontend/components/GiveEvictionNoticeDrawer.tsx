"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, Lease } from "@/lib/api";

const MODAL_OVERLAY_CLASS =
  "fixed inset-0 top-0 left-0 w-[100vw] min-w-full h-[100vh] min-h-screen overflow-hidden flex justify-end bg-surface-900/40 dark:bg-surface-950/50 backdrop-blur-sm z-[100] transition-opacity";

export default function GiveEvictionNoticeDrawer({
  lease,
  onClose,
  onSuccess,
}: {
  lease: Lease | { id: string; unit?: { id?: string; unit_number: string; property?: { name: string } } };
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div
      className={MODAL_OVERLAY_CLASS}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="give-eviction-notice-title"
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div className="p-6 pt-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 id="give-eviction-notice-title" className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">
              Give Eviction Notice
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-surface-600 dark:text-surface-400 text-sm mb-6">
            {lease.unit?.property?.name ?? "Property"} – Unit {lease.unit?.unit_number ?? "—"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Eviction reason *
              </label>
              <textarea
                value={evictionReason}
                onChange={(e) => setEvictionReason(e.target.value)}
                required
                rows={4}
                placeholder="State the reason for this eviction notice"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Move-out deadline *
              </label>
              <input
                type="date"
                value={evictionDate}
                onChange={(e) => setEvictionDate(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Optional notes
              </label>
              <textarea
                value={optionalNotes}
                onChange={(e) => setOptionalNotes(e.target.value)}
                rows={3}
                placeholder="Additional details for the tenant"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Submitting…" : "Submit eviction notice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
