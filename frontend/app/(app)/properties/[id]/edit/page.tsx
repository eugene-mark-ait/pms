"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface PropertyImageType {
  id: string;
  image: string;
  caption?: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [images, setImages] = useState<PropertyImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getImageUrl(img: PropertyImageType) {
    if (img.image.startsWith("http")) return img.image;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");
    return base + img.image;
  }

  function refresh() {
    if (!id) return;
    api
      .get<{ name: string; address: string; location?: string; payment_phone?: string; images?: PropertyImageType[] }>(
        `/properties/${id}/`
      )
      .then((res) => {
        setName(res.data.name);
        setAddress(res.data.address);
        setLocation(res.data.location ?? "");
        setPaymentPhone(res.data.payment_phone ?? "");
        setImages(res.data.images ?? []);
      })
      .catch(() => setError("Property not found."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/properties/${id}/`, {
        name,
        address,
        location: location.trim() || undefined,
        payment_phone: paymentPhone.trim(),
      });
      router.push(`/properties/${id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update property.";
      setError(typeof msg === "string" ? msg : "Failed to update property.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ACCEPT.split(",").some((t) => file.type === t.trim())) continue;
      const form = new FormData();
      form.append("image", file);
      try {
        await api.post(`/properties/${id}/images/`, form);
        refresh();
      } catch (err) {
        const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail : "Upload failed.";
        setError(typeof msg === "string" ? msg : "Upload failed.");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("Remove this image?")) return;
    try {
      await api.delete(`/properties/${id}/images/${imageId}/`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Failed to remove image.");
    }
  }

  if (loading) return <p className="text-surface-500 dark:text-surface-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}`} className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300">← Property</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Edit Property</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800" placeholder="e.g. Downtown" />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Payment phone (landlord M-Pesa)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="2547XXXXXXXX"
            value={paymentPhone}
            onChange={(e) => setPaymentPhone(e.target.value)}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
            required
          />
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Format 2547XXXXXXXX (Flutterwave payouts).</p>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <Link href={`/properties/${id}`} className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
            Cancel
          </Link>
        </div>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Images</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">JPG, PNG, or WebP. Multiple allowed.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleImageUpload}
          disabled={uploading}
          className="block w-full text-sm text-surface-600 dark:text-surface-400 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-900/40 file:px-4 file:py-2 file:text-primary-700 dark:file:text-primary-300"
        />
        {uploading && <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">Uploading…</p>}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative rounded-lg border border-surface-200 dark:border-surface-600 overflow-hidden bg-surface-50 dark:bg-surface-700/50 aspect-[4/3]">
              <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-2 right-2 rounded bg-red-600 text-white text-xs px-2 py-1 hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
