"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

export const SERVICE_REQUEST_FORM_ID = "service-request-form";

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

function getErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ message?: string[]; preferred_date?: string[]; detail?: string }>;
  const data = ax.response?.data;
  if (!data) return "Failed to send request. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.message) && data.message.length) return data.message[0];
  if (Array.isArray(data.preferred_date) && data.preferred_date.length) return `Date: ${data.preferred_date[0]}`;
  return "Failed to send request. Please try again.";
}

interface ServiceRequestFormProps {
  serviceId: string;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default function ServiceRequestForm({
  serviceId,
  onSuccess,
  onSubmittingChange,
}: ServiceRequestFormProps) {
  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Please describe what you need.");
      return;
    }
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await api.post(`/marketplace/services/${serviceId}/request/`, {
        message: trimmedMessage,
        preferred_date: preferredDate.trim() || null,
      });
      setMessage("");
      setPreferredDate("");
      onSuccess();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("marketplace-request-created"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <form id={SERVICE_REQUEST_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>Message / description of need *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputBase}
          rows={4}
          placeholder="Describe what you need (e.g. pipe repair, electrical fix)"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Preferred date (optional)</label>
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className={inputBase}
        />
      </div>
    </form>
  );
}
