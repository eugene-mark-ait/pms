"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function ComplaintsPage() {
  const [list, setList] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Complaint[] | { results: Complaint[] }>("/complaints/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Complaints</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No complaints.</p>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4 font-medium">{c.title}</td>
                  <td className="px-6 py-4 capitalize">{c.status?.replace("_", " ")}</td>
                  <td className="px-6 py-4 text-surface-600">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
