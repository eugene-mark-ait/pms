"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, Lease, formatKSH } from "@/lib/api";
import { format } from "date-fns";

const DRAWER_OVERLAY_CLASS =
  "fixed inset-0 top-0 left-0 w-[100vw] min-w-full h-[100vh] min-h-screen overflow-hidden flex justify-end bg-surface-900/40 dark:bg-surface-950/50 backdrop-blur-sm z-[100] transition-opacity";

export default function PayRentModal({
  lease,
  onClose,
  onSuccess,
}: {
  lease: Lease;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [months, setMonths] = useState<1 | 2 | 3>(1);
  const [paymentMethod] = useState("mpesa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthlyRent = parseFloat(lease.monthly_rent || "0");
  const depositAmount = parseFloat(lease.deposit_amount || "0");
  const isFirstPayment = lease.last_payment_date == null || lease.last_payment_date === "";
  const depositToAdd = !lease.deposit_paid && depositAmount > 0 && isFirstPayment ? depositAmount : 0;
  const total = monthlyRent * months + depositToAdd;
  const canPay = lease.payment_status !== "paid";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/payments/pay-rent/", {
        lease_id: lease.id,
        months,
        payment_method: paymentMethod,
      });
      onSuccess();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; detail?: string } } };
      setError(ax.response?.data?.error || ax.response?.data?.detail || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div
      className={DRAWER_OVERLAY_CLASS}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-rent-title"
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div className="p-6 pt-4">
          <h2 id="pay-rent-title" className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">Pay Rent</h2>
          <p className="text-surface-600 dark:text-surface-400 text-sm mb-2">
            {lease.unit?.property?.name} – Unit {lease.unit?.unit_number}
          </p>
          <dl className="space-y-1 text-sm mb-6 text-surface-700 dark:text-surface-300">
            <div className="flex justify-between">
              <dt className="text-surface-500 dark:text-surface-400">Monthly rent</dt>
              <dd>{formatKSH(lease.monthly_rent)}</dd>
            </div>
            {depositToAdd > 0 && (
              <div className="flex justify-between text-amber-700 dark:text-amber-400">
                <dt className="text-surface-500 dark:text-surface-400">Deposit (included in first payment)</dt>
                <dd>{formatKSH(depositToAdd)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-surface-500 dark:text-surface-400">Last payment</dt>
              <dd>{lease.last_payment_date ? format(new Date(lease.last_payment_date), "MMM d, yyyy") : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-500 dark:text-surface-400">Outstanding balance</dt>
              <dd>{formatKSH(lease.outstanding_balance ?? "0")}</dd>
            </div>
          </dl>

          {!canPay && (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              Current period is already paid.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Months to pay</label>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMonths(n)}
                    className={`flex-1 py-2 rounded-lg border font-medium transition ${
                      months === n
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-surface-300 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-200"
                    }`}
                  >
                    {n} {n === 1 ? "month" : "months"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Payment method: M-Pesa</p>
            <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">Total: {formatKSH(total)}</p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 min-h-[44px]">
                Cancel
              </button>
              <button type="submit" disabled={loading || !canPay} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 min-h-[44px]">
                {loading ? "Processing…" : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
