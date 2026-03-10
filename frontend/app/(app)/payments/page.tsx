"use client";

import { useEffect, useState } from "react";
import { api, Payment, User } from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";

export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const isTenant =
    user != null
    && user.role_names?.includes("tenant")
    && !user.role_names?.includes("landlord")
    && !user.role_names?.includes("manager");

  useEffect(() => {
    let cancelled = false;
    api.get<User>("/auth/me/")
      .then((res) => { if (!cancelled) setUser(res.data); })
      .catch(() => { if (!cancelled) { setUser(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user == null) return;
    setLoading(true);
    const endpoint = isTenant ? "/payments/history/" : "/payments/";
    api.get<Payment[] | { results: Payment[] }>(endpoint).then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : (data as { results?: Payment[] })?.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, [user, isTenant]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">{isTenant ? "Payment History" : "Payments"}</h1>
      <p className="text-surface-600 text-sm">
        {isTenant ? "Your rent payments." : "All payments for your properties."}
      </p>
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
                {!isTenant && (
                  <>
                    <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Tenant</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Unit</th>
                  </>
                )}
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Months</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4">{format(new Date(p.payment_date), "MMM d, yyyy")}</td>
                  {!isTenant && p.lease && (
                    <>
                      <td className="px-6 py-4 text-surface-700">
                        {p.lease.tenant?.first_name} {p.lease.tenant?.last_name} ({p.lease.tenant?.email})
                      </td>
                      <td className="px-6 py-4 text-surface-600">
                        {p.lease.unit?.unit_number} {p.lease.unit?.property?.name ? `– ${p.lease.unit.property.name}` : ""}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 font-medium">${p.amount}</td>
                  <td className="px-6 py-4">{p.months_paid_for ?? 1}</td>
                  <td className="px-6 py-4 capitalize">{p.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isTenant && <Link href="/dashboard/my-units" className="inline-block text-primary-600 hover:underline">← My units</Link>}
    </div>
  );
}
