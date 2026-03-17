"use client";

import { useState } from "react";
import { api, Lease } from "@/lib/api";
import SlideOverForm from "@/components/SlideOverForm";

const inputBase = "w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function GiveNoticeDrawer({
  lease,
  onClose,
  onSuccess,
}: {
  lease: Lease | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [moveOutDate, setMoveOutDate] = useState("");
  const [reason, setReason] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lease) return;
    if (!moveOutDate) {
      setError("Move-out date is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/leases/give-notice/", {
        lease_id: lease.id,
        move_out_date: moveOutDate,
        reason: reason || undefined,
        notice_message: noticeMessage || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; detail?: string } } };
      setError(ax.response?.data?.error || ax.response?.data?.detail || "Failed to submit notice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlideOverForm
      isOpen={!!lease}
      onClose={onClose}
      title="Give Notice"
      width="md"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
            Cancel
          </button>
          <button form="give-notice-form" type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {loading ? "Submitting…" : "Submit notice"}
          </button>
        </div>
      }
    >
      {lease && (
        <>
          <p className="text-surface-600 dark:text-surface-400 text-sm mb-6">
            {lease.unit?.property?.name} – Unit {lease.unit?.unit_number}
          </p>
          <form id="give-notice-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className={labelClass}>Move-out date *</label>
              <input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} required className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Reason (optional)</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Relocating" className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Message (optional)</label>
              <textarea value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} rows={3} placeholder="Additional details for property owner/manager" className={inputBase} />
            </div>
          </form>
        </>
      )}
    </SlideOverForm>
  );
}
