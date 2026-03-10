"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function NewPropertyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post<{ id: string }>("/properties/", { name, address, location: location.trim() || undefined });
      router.push(`/properties/${data.id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to create property.";
      setError(typeof msg === "string" ? msg : "Failed to create property.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="text-surface-500 hover:text-surface-700">← Properties</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900">Add Property</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Location (short label for search)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Downtown, North Side"
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create Property"}
          </button>
          <Link href="/properties" className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
