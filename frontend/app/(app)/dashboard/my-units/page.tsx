"use client";

import { useEffect, useState } from "react";
import { api, Lease } from "@/lib/api";
import { format } from "date-fns";
import PayRentModal from "@/components/PayRentModal";
import GiveNoticeModal from "@/components/GiveNoticeModal";

export default function MyUnitsPage() {
  const [units, setUnits] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalLease, setPayModalLease] = useState<Lease | null>(null);
  const [noticeModalLease, setNoticeModalLease] = useState<Lease | null>(null);

  function load() {
    api.get<Lease[]>("/tenant/my-units/").then((res) => {
      const data = res.data;
      setUnits(Array.isArray(data) ? data : (data as { results?: Lease[] })?.results ?? []);
    }).catch(() => setUnits([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-surface-500">Loading…</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900">My Units</h1>
      {units.length === 0 ? (
        <p className="text-surface-600">You have no active leases.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {units.map((lease) => (
            <div
              key={lease.id}
              className={`rounded-xl border p-6 shadow-sm flex flex-col ${
                lease.has_active_notice
                  ? "bg-amber-50/80 border-amber-200 ring-1 ring-amber-200/50"
                  : "bg-white border-surface-200"
              }`}
            >
              <div className="font-semibold text-surface-900">
                {lease.unit?.property?.name ?? "Property"}
              </div>
              <div className="text-sm text-surface-500 mt-0.5">
                Unit {lease.unit?.unit_number ?? "—"}
              </div>
              {lease.has_active_notice && (
                <div className="mt-2 inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  Notice given · Moving out {lease.active_notice_move_out_date ? format(new Date(lease.active_notice_move_out_date), "MMM d, yyyy") : ""}
                </div>
              )}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-surface-500">Monthly rent</dt>
                  <dd className="font-medium">KSh {Number(lease.monthly_rent).toLocaleString("en-KE")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Deposit</dt>
                  <dd>
                    <span className={lease.deposit_paid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {lease.deposit_paid ? "Paid" : "Not Paid"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Last payment</dt>
                  <dd>{lease.last_payment_date ? format(new Date(lease.last_payment_date), "MMM d, yyyy") : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Next due</dt>
                  <dd>{lease.next_rent_due ? format(new Date(lease.next_rent_due), "MMM d, yyyy") : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Current balance</dt>
                  <dd className="font-medium">KSh {Number(lease.outstanding_balance ?? "0").toLocaleString("en-KE")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500">Status</dt>
                  <dd>
                    <span className={lease.payment_status === "overdue" ? "text-red-600" : lease.payment_status === "due" ? "text-amber-600" : "text-green-600"}>
                      {lease.payment_status?.charAt(0).toUpperCase() + (lease.payment_status?.slice(1) ?? "")}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex gap-3">
                {lease.payment_status === "paid" ? (
                  <span className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-emerald-100 text-emerald-800 font-medium">
                    Paid
                  </span>
                ) : (
                  <button
                    onClick={() => setPayModalLease(lease)}
                    disabled={lease.can_pay_rent === false}
                    className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                  >
                    Pay Rent
                  </button>
                )}
                {lease.has_active_notice && lease.active_notice_id ? (
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/vacancies/notice/${lease.active_notice_id}/cancel/`);
                        load();
                      } catch {
                        alert("Failed to revoke notice.");
                      }
                    }}
                    className="flex-1 py-2.5 px-4 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition"
                  >
                    Revoke Notice
                  </button>
                ) : (
                  <button
                    onClick={() => setNoticeModalLease(lease)}
                    className="flex-1 py-2.5 px-4 border border-surface-300 hover:bg-surface-50 font-medium rounded-lg transition"
                  >
                    Give Notice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {payModalLease && (
        <PayRentModal
          lease={payModalLease}
          onClose={() => setPayModalLease(null)}
          onSuccess={() => { setPayModalLease(null); load(); }}
        />
      )}
      {noticeModalLease && (
        <GiveNoticeModal
          lease={noticeModalLease}
          onClose={() => setNoticeModalLease(null)}
          onSuccess={() => { setNoticeModalLease(null); load(); }}
        />
      )}
    </div>
  );
}
