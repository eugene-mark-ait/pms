"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export const SERVICE_FORM_ID = "service-form";

export const SERVICE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "landscaping", label: "Landscaping" },
  { value: "appliance_repair", label: "Appliance Repair" },
  { value: "pest_control", label: "Pest Control" },
  { value: "moving", label: "Moving / Relocation" },
  { value: "other", label: "Other" },
];

export interface MarketplaceService {
  id: string;
  provider: string;
  title: string;
  category: string;
  description: string;
  price_range?: string;
  service_area: string;
  availability?: string;
  contact_info?: string;
  created_at?: string;
  updated_at?: string;
}

interface ServiceFormProps {
  mode: "create" | "edit";
  serviceId?: string;
  initialData?: Partial<MarketplaceService>;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Pre-fill contact from user profile (e.g. email or phone) */
  defaultContact?: string;
}

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export default function ServiceForm({
  mode,
  serviceId,
  initialData,
  onSuccess,
  onSubmittingChange,
  defaultContact = "",
}: ServiceFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "other");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priceRange, setPriceRange] = useState(initialData?.price_range ?? "");
  const [serviceArea, setServiceArea] = useState(initialData?.service_area ?? "");
  const [availability, setAvailability] = useState(initialData?.availability ?? "");
  const [contactInfo, setContactInfo] = useState(initialData?.contact_info ?? defaultContact);
  const [loading, setLoading] = useState(mode === "edit" && !!serviceId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function loadService() {
    if (!serviceId) return;
    setLoading(true);
    api
      .get<MarketplaceService>(`/marketplace/services/${serviceId}/`)
      .then((res) => {
        const d = res.data;
        setTitle(d.title);
        setCategory(d.category || "other");
        setDescription(d.description);
        setPriceRange(d.price_range ?? "");
        setServiceArea(d.service_area);
        setAvailability(d.availability ?? "");
        setContactInfo(d.contact_info ?? defaultContact);
      })
      .catch(() => setError("Service not found."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (mode === "edit" && serviceId) loadService();
    if (initialData) {
      setTitle(initialData.title ?? "");
      setCategory(initialData.category ?? "other");
      setDescription(initialData.description ?? "");
      setPriceRange(initialData.price_range ?? "");
      setServiceArea(initialData.service_area ?? "");
      setAvailability(initialData.availability ?? "");
      setContactInfo(initialData.contact_info ?? defaultContact);
    }
  }, [mode, serviceId]);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [submitting, onSubmittingChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Service title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!serviceArea.trim()) {
      setError("Service area / location is required.");
      return;
    }
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      if (mode === "create") {
        await api.post("/marketplace/services/", {
          title: title.trim(),
          category: category || "other",
          description: description.trim(),
          price_range: priceRange.trim() || undefined,
          service_area: serviceArea.trim(),
          availability: availability.trim() || undefined,
          contact_info: contactInfo.trim() || undefined,
        });
        onSuccess();
      } else if (serviceId) {
        await api.put(`/marketplace/services/${serviceId}/`, {
          title: title.trim(),
          category: category || "other",
          description: description.trim(),
          price_range: priceRange.trim() || undefined,
          service_area: serviceArea.trim(),
          availability: availability.trim() || undefined,
          contact_info: contactInfo.trim() || undefined,
        });
        onSuccess();
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : mode === "create"
            ? "Failed to create service."
            : "Failed to update service.";
      setError(typeof msg === "string" ? msg : "Failed to save.");
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading service…</span>
      </div>
    );
  }

  return (
    <form id={SERVICE_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <div>
        <label className={labelClass}>Service Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputBase}
          placeholder="e.g. Pipe repair, Electrical installation"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Category *</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputBase} required>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputBase}
          rows={4}
          placeholder="Describe the service you offer"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Price Range (optional)</label>
        <input
          type="text"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className={inputBase}
          placeholder="e.g. KSh 500–2000, Quote on request"
        />
      </div>
      <div>
        <label className={labelClass}>Service Area / Location *</label>
        <input
          type="text"
          value={serviceArea}
          onChange={(e) => setServiceArea(e.target.value)}
          className={inputBase}
          placeholder="e.g. Nairobi CBD, Mombasa"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Availability (optional)</label>
        <input
          type="text"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className={inputBase}
          placeholder="e.g. Mon–Fri 8am–6pm, Weekends"
        />
      </div>
      <div>
        <label className={labelClass}>Contact Info (optional)</label>
        <input
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className={inputBase}
          placeholder="Phone or email (can be auto-filled from profile)"
        />
      </div>
    </form>
  );
}
