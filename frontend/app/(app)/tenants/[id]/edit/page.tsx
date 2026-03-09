"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface LeaseDetail {
  id: string;
  unit: { id: string; unit_number: string; property: { id: string; name: string } };
  tenant: { id: string; email: string };
  monthly_rent: string;
  deposit_amount: string;
  deposit_paid: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function EditLeasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [depositPaid, setDepositPaid] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<LeaseDetail>(`/leases/${id}/`).then((res) => {
      const d = res.data;
      setLease(d);
      setMonthlyRent(d.monthly_rent);
      setDepositAmount(d.deposit_amount);
      setDepositPaid(d.deposit_paid);
      setStartDate(d.start_date);
      setEndDate(d.end_date);
      setIsActive(d.is_active);
    }).catch(() => setError("Lease not found.")).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.patch(`/leases/${id}/`, {
        monthly_rent: monthlyRent,
        deposit_amount: depositAmount,
        deposit_paid: depositPaid,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      });
      router.push("/tenants");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : "Failed to update lease.";
      setError(typeof msg === "string" ? msg : "Failed to update lease.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-surface-500">Loading…</p>;
  if (!lease) return <p className="text-surface-600">Lease not found.</p>;

  return (
    <div className="space-y-6">
      <Link href="/tenants" className="text-surface-500 hover:text-surface-700">← Tenants</Link>
      <h1 className="text-2xl font-bold text-surface-900">Edit Lease</h1>
      <p className="text-surface-600">
        Unit: {lease.unit?.unit_number} – {lease.unit?.property?.name}; Tenant: {lease.tenant?.email}
      </p>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Monthly rent</label>
            <input type="number" step="0.01" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Deposit amount</label>
            <input type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="depositPaid" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="rounded border-surface-300" />
          <label htmlFor="depositPaid" className="text-sm text-surface-700">Deposit paid</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-surface-300 px-3 py-2 text-surface-900" required />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-surface-300" />
          <label htmlFor="isActive" className="text-sm text-surface-700">Active</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">{submitting ? "Saving…" : "Save"}</button>
          <Link href="/tenants" className="rounded-lg border border-surface-300 px-4 py-2 text-surface-700 hover:bg-surface-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
