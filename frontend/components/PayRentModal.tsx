"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Lease, formatKSH } from "@/lib/api";
import { format } from "date-fns";
import SlideOverForm from "@/components/SlideOverForm";

type PayPhase = "form" | "waiting" | "success" | "failed";

interface StkInitResponse {
  id: string;
  checkout_request_id: string;
  status: string;
  message?: string;
}

interface StkStatusResponse {
  id: string;
  status: "pending" | "success" | "failed";
  user_message?: string | null;
  mpesa_receipt_number?: string;
  payment_id?: string | null;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 90_000;

/** Normalize to 2547XXXXXXXX / 2541XXXXXXXX */
function normalizeMpesaPhone(input: string): string | null {
  let p = input.trim().replace(/[\s+-]/g, "");
  if (p.startsWith("0") && p.length === 10) p = "254" + p.slice(1);
  if (p.length === 9 && p.startsWith("7")) p = "254" + p;
  if (/^254[17]\d{8}$/.test(p)) return p;
  return null;
}

export default function PayRentModal({
  lease,
  onClose,
  onSuccess,
}: {
  lease: Lease | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [months, setMonths] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<PayPhase>("form");
  const [stkId, setStkId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const pollStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetFlow = useCallback(() => {
    setPhase("form");
    setStkId(null);
    setResultMessage("");
    setError("");
    setPhoneError("");
    setLoading(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!lease) {
      resetFlow();
      setPhone("");
      setMonths(1);
    }
  }, [lease, resetFlow]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const monthlyRent = lease ? parseFloat(lease.monthly_rent || "0") : 0;
  const depositAmount = lease ? parseFloat(lease.deposit_amount || "0") : 0;
  const isFirstPayment = !lease || lease.last_payment_date == null || lease.last_payment_date === "";
  const depositToAdd =
    lease && !lease.deposit_paid && depositAmount > 0 && isFirstPayment ? depositAmount : 0;
  const total = monthlyRent * months + depositToAdd;
  const amountForApi = total.toFixed(2);
  const canPay = lease ? lease.payment_status !== "paid" : false;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const res = await api.get<StkStatusResponse>(`/payments/mpesa-stk/${id}/`);
        const data = res.data;
        if (data.status === "success") {
          stopPolling();
          setPhase("success");
          setResultMessage(data.user_message || "Payment successful.");
          setLoading(false);
          onSuccess(); // refresh lease list; user closes modal when ready
          return;
        }
        if (data.status === "failed") {
          stopPolling();
          setPhase("failed");
          setResultMessage(data.user_message || "Payment failed or was cancelled.");
          setLoading(false);
          return;
        }
        if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
          stopPolling();
          setPhase("failed");
          setResultMessage(
            "No response from M-PESA in time. If you completed payment, your balance will update shortly. Otherwise try again."
          );
          setLoading(false);
        }
      } catch {
        /* keep polling until timeout */
      }
    },
    [onSuccess, stopPolling]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lease) return;
    setError("");
    setPhoneError("");
    const normalized = normalizeMpesaPhone(phone);
    if (!normalized) {
      setPhoneError("Enter a valid M-PESA number: 2547XXXXXXXX or 2541XXXXXXXX (12 digits).");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<StkInitResponse>("/pay-rent/", {
        lease_id: lease.id,
        months,
        phone: normalized,
        amount: amountForApi,
      });
      setStkId(res.data.id);
      setPhase("waiting");
      pollStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        void pollStatus(res.data.id);
      }, POLL_INTERVAL_MS);
      void pollStatus(res.data.id);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; detail?: string } } };
      setError(ax.response?.data?.error || ax.response?.data?.detail || "Could not start M-PESA payment.");
      setLoading(false);
    }
  }

  function handleClose() {
    stopPolling();
    resetFlow();
    onClose();
  }

  return (
    <SlideOverForm
      isOpen={!!lease}
      onClose={handleClose}
      title="Pay Rent"
      width="md"
      footer={
        phase === "form" ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              form="pay-rent-form"
              type="submit"
              disabled={loading || !canPay}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? "Starting…" : "Pay with M-PESA"}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 min-h-[44px]"
            >
              Close
            </button>
          </div>
        )
      }
    >
      {lease && (
        <>
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
                <dt className="text-surface-500 dark:text-surface-400">Deposit (first payment)</dt>
                <dd>{formatKSH(depositToAdd)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-surface-500 dark:text-surface-400">Last payment</dt>
              <dd>
                {lease.last_payment_date ? format(new Date(lease.last_payment_date), "MMM d, yyyy") : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-surface-500 dark:text-surface-400">Outstanding balance</dt>
              <dd>{formatKSH(lease.outstanding_balance ?? "0")}</dd>
            </div>
          </dl>

          {!canPay && phase === "form" && (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              Current period is already paid.
            </p>
          )}

          {phase === "waiting" && (
            <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-900/20 p-4 mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">Waiting for M-PESA</p>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    Check your phone and enter your M-PESA PIN to approve KSh {Number(amountForApi).toLocaleString("en-KE")}.
                  </p>
                </div>
              </div>
              {stkId && (
                <p className="text-xs text-surface-500 dark:text-surface-400">Reference: {stkId.slice(0, 8)}…</p>
              )}
            </div>
          )}

          {phase === "success" && (
            <div
              className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20 p-4 mb-4 text-emerald-800 dark:text-emerald-200 text-sm"
              role="status"
            >
              <p className="font-semibold">Payment successful</p>
              <p className="mt-1">{resultMessage}</p>
            </div>
          )}

          {phase === "failed" && (
            <div
              className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-4 mb-4 text-red-800 dark:text-red-200 text-sm"
              role="alert"
            >
              <p className="font-semibold">Payment not completed</p>
              <p className="mt-1">{resultMessage}</p>
            </div>
          )}

          {phase === "form" && (
            <form id="pay-rent-form" onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Months to pay
                </label>
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
              <div>
                <label
                  htmlFor="mpesa-phone"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >
                  M-PESA phone number
                </label>
                <input
                  id="mpesa-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-100"
                />
                {phoneError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{phoneError}</p>}
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Use format 2547XXXXXXXX (Safaricom / Airtel Kenya).
                </p>
              </div>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Total: {formatKSH(amountForApi)}
              </p>
            </form>
          )}
        </>
      )}
    </SlideOverForm>
  );
}
