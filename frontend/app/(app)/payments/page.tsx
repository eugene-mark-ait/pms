"use client";

import { useEffect, useState } from "react";
import { api, Payment } from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";

export default function PaymentsPage() {
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Payment[] | { results: Payment[] }>("/payments/history/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : (data as { results?: Payment[] }).results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Payment History</h1>
      <p className="text-surface-600 text-sm">Your rent payments.</p>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No payments yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Date</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Months</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                  <td className="px-6 py-4 font-medium">${p.amount}</td>
                  <td className="px-6 py-4">{p.months_paid_for ?? 1}</td>
                  <td className="px-6 py-4 capitalize">{p.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/dashboard/my-units" className="inline-block text-primary-600 hover:underline">← My units</Link>
    </div>
  );
}
