"use client";

import { useState } from "react";
import { api, Lease } from "@/lib/api";
import { format } from "date-fns";

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
  const [paymentMethod, setPaymentMethod] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthlyRent = parseFloat(lease.monthly_rent || "0");
  const total = monthlyRent * months;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-surface-900 mb-4">Pay Rent</h2>
        <p className="text-surface-600 text-sm mb-2">
          {lease.unit?.property?.name} – Unit {lease.unit?.unit_number}
        </p>
        <dl className="space-y-1 text-sm mb-6">
          <div className="flex justify-between">
            <dt className="text-surface-500">Monthly rent</dt>
            <dd>${lease.monthly_rent}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-surface-500">Last payment</dt>
            <dd>{lease.last_payment_date ? format(new Date(lease.last_payment_date), "MMM d, yyyy") : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-surface-500">Outstanding balance</dt>
            <dd>${lease.outstanding_balance ?? "0"}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Months to pay</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMonths(n)}
                  className={`flex-1 py-2 rounded-lg border font-medium transition ${
                    months === n
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-surface-300 hover:bg-surface-50"
                  }`}
                >
                  {n} {n === 1 ? "month" : "months"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-surface-300"
            >
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>
          <p className="text-lg font-semibold text-surface-900">Total: ${total.toFixed(2)}</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 rounded-lg hover:bg-surface-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? "Processing…" : "Confirm payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
