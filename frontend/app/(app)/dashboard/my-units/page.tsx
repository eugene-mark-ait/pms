"use client";

import { useEffect, useState } from "react";
import { api, Lease } from "@/lib/api";
import { format } from "date-fns";
import PayRentModal from "@/components/PayRentModal";
import GiveNoticeDrawer from "@/components/GiveNoticeDrawer";

export default function MyUnitsPage() {
  const [units, setUnits] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalLease, setPayModalLease] = useState<Lease | null>(null);
  const [noticeModalLease, setNoticeModalLease] = useState<Lease | null>(null);

  function load() {
    setLoading(true);
    api.get<Lease[]>("/tenant/my-units/").then((res) => {
      const data = res.data;
      setUnits(Array.isArray(data) ? data : (data as { results?: Lease[] })?.results ?? []);
    }).catch(() => setUnits([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-surface-500 dark:text-surface-400">Loading…</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My Units</h1>
      {units.length === 0 ? (
        <p className="text-surface-600 dark:text-surface-400">You have no active leases.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {units.map((lease) => (
            <div
              key={lease.id}
              className={`rounded-xl border p-6 shadow-sm flex flex-col ${
                lease.eviction_active
                  ? "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-700 ring-1 ring-red-200/50 dark:ring-red-600/30"
                  : lease.has_active_notice
                  ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 ring-1 ring-amber-200/50 dark:ring-amber-600/30"
                  : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700"
              }`}
            >
              <div className="font-semibold text-surface-900 dark:text-surface-100">
                {lease.unit?.property?.name ?? "Property"}
              </div>
              <div className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Unit {lease.unit?.unit_number ?? "—"}
              </div>
              {lease.eviction_active && (
                <div className="mt-2 inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/40 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200 ring-1 ring-red-200/50 dark:ring-red-600/30">
                  Eviction Notice
                </div>
              )}
              {lease.eviction_active && (
                <div className="mt-2 p-3 rounded-lg bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200">Your property owner has issued an eviction notice.</p>
                  {lease.eviction_reason && <p className="mt-1 text-red-700 dark:text-red-300">{lease.eviction_reason}</p>}
                  {lease.eviction_deadline && (
                    <p className="mt-1 text-red-700 dark:text-red-300">
                      Move-out deadline: {format(new Date(lease.eviction_deadline), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}
              {lease.has_active_notice && !lease.eviction_active && (
                <div className="mt-2 inline-flex items-center rounded-md bg-amber-100 dark:bg-amber-900/40 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                  Notice given · Moving out {lease.active_notice_move_out_date ? format(new Date(lease.active_notice_move_out_date), "MMM d, yyyy") : ""}
                </div>
              )}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Monthly rent</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-100">KSh {Number(lease.monthly_rent).toLocaleString("en-KE")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Deposit</dt>
                  <dd>
                    <span className={lease.deposit_paid ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                      {lease.deposit_paid ? "Paid" : "Not Paid"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Last payment</dt>
                  <dd className="text-surface-900 dark:text-surface-100">{lease.last_payment_date ? format(new Date(lease.last_payment_date), "MMM d, yyyy") : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Next due</dt>
                  <dd className="text-surface-900 dark:text-surface-100">{lease.next_rent_due ? format(new Date(lease.next_rent_due), "MMM d, yyyy") : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Current balance</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-100">KSh {Number(lease.outstanding_balance ?? "0").toLocaleString("en-KE")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-surface-500 dark:text-surface-400">Status</dt>
                  <dd>
                    <span className={lease.payment_status === "overdue" ? "text-red-600 dark:text-red-400" : lease.payment_status === "due" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                      {lease.payment_status?.charAt(0).toUpperCase() + (lease.payment_status?.slice(1) ?? "")}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex gap-3">
                {lease.payment_status === "paid" ? (
                  <span className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 font-medium">
                    Paid
                  </span>
                ) : (
                  <button
                    onClick={() => setPayModalLease(lease)}
                    disabled={lease.eviction_active === true}
                    title={lease.eviction_active ? "Disabled due to eviction notice" : undefined}
                    className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                  >
                    Pay Rent
                  </button>
                )}
                {lease.has_active_notice && lease.active_notice_id && !lease.eviction_active ? (
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/vacancies/notice/${lease.active_notice_id}/cancel/`);
                        load();
                      } catch {
                        alert("Failed to revoke notice.");
                      }
                    }}
                    className="flex-1 py-2.5 px-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium rounded-lg transition"
                  >
                    Revoke Notice
                  </button>
                ) : (
                  <button
                    onClick={() => setNoticeModalLease(lease)}
                    disabled={lease.eviction_active === true}
                    title={lease.eviction_active ? "Disabled due to eviction notice" : undefined}
                    className="flex-1 py-2.5 px-4 border border-surface-300 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed text-surface-700 dark:text-surface-200 font-medium rounded-lg transition"
                  >
                    Give Notice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PayRentModal
        lease={payModalLease}
        onClose={() => setPayModalLease(null)}
        onSuccess={() => { setPayModalLease(null); load(); }}
      />
      <GiveNoticeDrawer
        lease={noticeModalLease}
        onClose={() => setNoticeModalLease(null)}
        onSuccess={() => { setNoticeModalLease(null); load(); }}
      />
    </div>
  );
}
