"use client";

import { useState, useEffect } from "react";
import { api, Lease } from "@/lib/api";
import SlideOverForm from "@/components/SlideOverForm";

interface Recipient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function FileComplaintModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
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

  const inputBase =
    "w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2.5 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
  const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5";

  return (
    <SlideOverForm
      isOpen={isOpen}
      onClose={onClose}
      title="File a complaint"
      width="md"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
            Cancel
          </button>
          <button form="file-complaint-form" type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit complaint"}
          </button>
        </div>
      }
    >
      <p className="text-surface-600 dark:text-surface-400 text-sm mb-4">
        Choose the unit and who should receive this (Property Owner, Caretaker, or Manager). The complaint will be linked to your unit.
      </p>
      <form id="file-complaint-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div>
          <label className={labelClass}>Unit *</label>
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} required className={inputBase} disabled={loadingUnits}>
            <option value="">Select your unit</option>
            {units.map((l) => (
              <option key={l.id} value={l.unit?.id}>
                {l.unit?.property?.name} – Unit {l.unit?.unit_number}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Send to *</label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required className={inputBase} disabled={loadingRecipients || !propertyId}>
            <option value="">Select recipient (Property Owner / Caretaker / Manager)</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email} ({r.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputBase} placeholder="e.g. Leaking tap in bathroom" />
        </div>
        <div>
          <label className={labelClass}>Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className={inputBase} placeholder="Describe the issue..." />
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputBase}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </form>
    </SlideOverForm>
  );
}
