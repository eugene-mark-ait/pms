"use client";

import { useState } from "react";
import { api, Lease } from "@/lib/api";

export default function GiveNoticeModal({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-surface-900 mb-4">Give Notice</h2>
        <p className="text-surface-600 text-sm mb-6">
          {lease.unit?.property?.name} – Unit {lease.unit?.unit_number}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Move-out date *</label>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-surface-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Relocating"
              className="w-full px-4 py-2 rounded-lg border border-surface-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Message (optional)</label>
            <textarea
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              rows={3}
              placeholder="Additional details for landlord/manager"
              className="w-full px-4 py-2 rounded-lg border border-surface-300"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 rounded-lg hover:bg-surface-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? "Submitting…" : "Submit notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
