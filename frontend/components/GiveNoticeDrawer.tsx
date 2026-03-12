"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, Lease } from "@/lib/api";

const MODAL_OVERLAY_CLASS =
  "fixed inset-0 top-0 left-0 w-[100vw] min-w-full h-[100vh] min-h-screen overflow-hidden flex justify-end bg-surface-900/40 dark:bg-surface-950/50 backdrop-blur-sm z-[100] transition-opacity";

export default function GiveNoticeDrawer({
  lease,
  onClose,
  onSuccess,
}: {
  lease: Lease;
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div
      className={MODAL_OVERLAY_CLASS}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="give-notice-title"
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div className="p-6 pt-4">
          <h2 id="give-notice-title" className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">Give Notice</h2>
          <p className="text-surface-600 dark:text-surface-400 text-sm mb-6">
            {lease.unit?.property?.name} – Unit {lease.unit?.unit_number}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Move-out date *</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Relocating"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Message (optional)</label>
              <textarea
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                rows={3}
                placeholder="Additional details for landlord/manager"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {loading ? "Submitting…" : "Submit notice"}
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
