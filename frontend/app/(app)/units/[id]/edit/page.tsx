"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface UnitDetail {
  id: string;
  property: string;
  unit_number: string;
}

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [unitNumber, setUnitNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<UnitDetail>(`/units/${id}/`).then((res) => {
      setUnitNumber(res.data.unit_number);
    }).catch(() => setError("Unit not found.")).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/units/${id}/`, { unit_number: unitNumber });
      router.push("/units");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update unit.";
      setError(typeof msg === "string" ? msg : "Failed to update unit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-surface-500 dark:text-surface-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/units" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300">← Units</Link>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Edit Unit</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit number</label>
          <input
            type="text"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            required
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">
            {submitting ? "Saving…" : "Save"}
          </button>
          <Link href="/units" className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
