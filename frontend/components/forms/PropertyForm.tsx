"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";


interface PropertyImageType {
  id: string;
  image: string;
  caption?: string;
}

const inputBase =
  "w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1";

export const PROPERTY_FORM_ID = "property-form";

interface PropertyFormProps {
  mode: "create" | "edit";
  propertyId?: string;
  onSuccess: () => void;
  initialData?: { name: string; address: string; location?: string };
  onSubmittingChange?: (submitting: boolean) => void;
}

export default function PropertyForm({
  mode,
  propertyId,
  onSuccess,
  initialData,
  onSubmittingChange,
}: PropertyFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [images, setImages] = useState<PropertyImageType[]>([]);
  const [loading, setLoading] = useState(mode === "edit" && !!propertyId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getImageUrl(img: PropertyImageType) {
    if (img.image.startsWith("http")) return img.image;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");
    return base + img.image;
  }

  function loadProperty() {
    if (!propertyId) return;
    setLoading(true);
    api
      .get<{ name: string; address: string; location?: string; images?: PropertyImageType[] }>(`/properties/${propertyId}/`)
      .then((res) => {
        setName(res.data.name);
        setAddress(res.data.address);
        setLocation(res.data.location ?? "");
        setImages(res.data.images ?? []);
      })
      .catch(() => setError("Property not found."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (mode === "edit" && propertyId) loadProperty();
    if (initialData) {
      setName(initialData.name);
      setAddress(initialData.address);
      setLocation(initialData.location ?? "");
    }
  }, [mode, propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      if (mode === "create") {
        await api.post("/properties/", {
          name,
          address,
          location: location.trim() || undefined,
        });
        onSuccess();
      } else if (propertyId) {
        await api.patch(`/properties/${propertyId}/`, {
          name,
          address,
          location: location.trim() || undefined,
        });
        onSuccess();
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : mode === "create"
            ? "Failed to create property."
            : "Failed to update property.";
      setError(typeof msg === "string" ? msg : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !propertyId) return;
    const ACCEPT = "image/jpeg,image/png,image/webp";
    setUploading(true);
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ACCEPT.split(",").some((t) => file.type === t.trim())) continue;
      const form = new FormData();
      form.append("image", file);
      try {
        await api.post(`/properties/${propertyId}/images/`, form);
        loadProperty();
      } catch (err) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : "Upload failed.";
        setError(typeof msg === "string" ? msg : "Upload failed.");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteImage(imageId: string) {
    if (!propertyId || !confirm("Remove this image?")) return;
    try {
      await api.delete(`/properties/${propertyId}/images/${imageId}/`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Failed to remove image.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading property…</span>
      </div>
    );
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputBase}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Location (short label for search)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Downtown, North Side"
          className={inputBase}
        />
      </div>
      <div>
        <label className={labelClass}>Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputBase}
          rows={3}
          required
        />
      </div>

      {mode === "edit" && propertyId && (
        <section>
          <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Images</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">JPG, PNG, or WebP. Multiple allowed.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-sm text-surface-600 dark:text-surface-400 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/40 file:px-4 file:py-2 file:text-primary-700 dark:file:text-primary-300"
          />
          {uploading && <p className="text-surface-500 dark:text-surface-400 text-xs mt-1">Uploading…</p>}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative rounded-lg border border-surface-200 dark:border-surface-600 overflow-hidden bg-surface-50 dark:bg-surface-700/50 aspect-[4/3]"
              >
                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1.5 right-1.5 rounded bg-red-600 text-white text-xs px-2 py-1 hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

    </form>
  );
}
