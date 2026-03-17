"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getDisplayName } from "@/lib/api";
import GiveEvictionNoticeDrawer from "@/components/GiveEvictionNoticeDrawer";
import { format } from "date-fns";

interface LeaseDetail {
  id: string;
  unit: { id: string; unit_number: string; property: { id: string; name: string } };
  tenant: { id: string; email: string; first_name?: string; last_name?: string; phone?: string };
  monthly_rent: string;
  deposit_amount: string;
  deposit_paid: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  eviction_active?: boolean;
  eviction_reason?: string | null;
  eviction_deadline?: string | null;
  eviction_created_at?: string | null;
  eviction_id?: string | null;
  eviction_optional_notes?: string | null;
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
  const [evictionDrawerOpen, setEvictionDrawerOpen] = useState(false);
  const [cancellingEviction, setCancellingEviction] = useState(false);

  function loadLease() {
    if (!id) return;
    setLoading(true);
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
  }

  useEffect(() => {
    loadLease();
  }, [id]);

  async function handleCancelEviction() {
    if (!id || !lease?.eviction_active) return;
    setCancellingEviction(true);
    try {
      await api.post(`/leases/${id}/eviction/cancel/`);
      loadLease();
    } catch {
      setError("Failed to cancel eviction.");
    } finally {
      setCancellingEviction(false);
    }
  }

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
      <Link href="/tenants" className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200">← Tenants</Link>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Edit Lease</h1>
      <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 text-sm">
        <p className="text-surface-900 dark:text-surface-100"><span className="font-medium">Unit:</span> {lease.unit?.unit_number} – {lease.unit?.property?.name}</p>
        <p className="mt-1 text-surface-700 dark:text-surface-300"><span className="font-medium">Tenant:</span> {getDisplayName(lease.tenant)}</p>
        {lease.tenant?.email && <p className="text-surface-600 dark:text-surface-400">{lease.tenant.email}</p>}
        {lease.tenant?.phone && <p className="text-surface-600 dark:text-surface-400">Phone: {lease.tenant.phone}</p>}
        {lease.eviction_active && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="font-medium text-red-800 dark:text-red-200">Eviction notice active</p>
            {lease.eviction_deadline && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                Move-out deadline: {format(new Date(lease.eviction_deadline), "MMM d, yyyy")}
              </p>
            )}
            {lease.eviction_reason && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{lease.eviction_reason}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        {!lease.eviction_active && lease.is_active && (
          <button
            type="button"
            onClick={() => setEvictionDrawerOpen(true)}
            className="rounded-lg border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2.5 font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition"
          >
            Give Eviction Notice
          </button>
        )}
        {lease.eviction_active && (
          <button
            type="button"
            onClick={handleCancelEviction}
            disabled={cancellingEviction}
            className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
          >
            {cancellingEviction ? "Cancelling…" : "Cancel Eviction"}
          </button>
        )}
      </div>
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
        <div className="flex flex-wrap gap-3 items-center">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 disabled:opacity-50">{submitting ? "Saving…" : "Save"}</button>
          <Link href="/tenants" className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">Cancel</Link>
        </div>
      </form>
      <GiveEvictionNoticeDrawer
        lease={evictionDrawerOpen ? lease : null}
        onClose={() => setEvictionDrawerOpen(false)}
        onSuccess={() => { setEvictionDrawerOpen(false); loadLease(); }}
      />
    </div>
  );
}
