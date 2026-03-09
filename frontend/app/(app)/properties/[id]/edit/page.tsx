"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<{ name: string; address: string }>(`/properties/${id}/`).then((res) => {
      setName(res.data.name);
      setAddress(res.data.address);
    }).catch(() => setError("Property not found.")).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/properties/${id}/`, { name, address });
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

  if (loading) return <p className="text-surface-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}`} className="text-surface-500 hover:text-surface-700">← Property</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900">Edit Property</h1>
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
            {submitting ? "Saving…" : "Save"}
          </button>
          <Link href={`/properties/${id}`} className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
