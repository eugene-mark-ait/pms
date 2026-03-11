"use client";

import { useState, useEffect } from "react";
import { api, Lease } from "@/lib/api";

interface Recipient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function FileComplaintModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [units, setUnits] = useState<Lease[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [unitId, setUnitId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Lease[]>("/tenant/my-units/").then((res) => {
      const data = res.data;
      setUnits(Array.isArray(data) ? data : (data as { results?: Lease[] })?.results ?? []);
    }).catch(() => setUnits([])).finally(() => setLoadingUnits(false));
  }, []);

  const selectedLease = units.find((l) => l.unit?.id === unitId);
  const propertyId = selectedLease?.unit?.property?.id;

  useEffect(() => {
    if (!propertyId) {
      setRecipients([]);
      setRecipientId("");
      return;
    }
    setLoadingRecipients(true);
    api.get<Recipient[]>(`/properties/${propertyId}/complaint-recipients/`)
      .then((res) => setRecipients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRecipients([]))
      .finally(() => {
        setLoadingRecipients(false);
        setRecipientId("");
      });
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedLease?.unit?.property?.id || !unitId || !recipientId || !title.trim() || !description.trim()) {
      setError("Please select unit, recipient, and fill title and description.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/complaints/", {
        property: selectedLease.unit.property.id,
        unit: unitId,
        assigned_to: recipientId,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax.response?.data?.detail || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-surface-900/40 dark:bg-surface-950/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-complaint-title"
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div className="p-6">
        <h2 id="file-complaint-title" className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">File a complaint</h2>
        <p className="text-surface-600 dark:text-surface-400 text-sm mb-6">
          Choose the unit and who should receive this (Landlord, Caretaker, or Manager). The complaint will be linked to your unit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit *</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 px-3 py-2"
              disabled={loadingUnits}
            >
              <option value="">Select your unit</option>
              {units.map((l) => (
                <option key={l.id} value={l.unit?.id}>
                  {l.unit?.property?.name} – Unit {l.unit?.unit_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Send to *</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 px-3 py-2"
              disabled={loadingRecipients || !propertyId}
            >
              <option value="">Select recipient (Landlord / Caretaker / Manager)</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email} ({r.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 px-3 py-2"
              placeholder="e.g. Leaking tap in bathroom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 px-3 py-2"
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-surface-300 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit complaint"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
