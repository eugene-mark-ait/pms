"use client";

import { useEffect, useState, useCallback } from "react";
import { api, PaginatedResponse } from "@/lib/api";
import { PaginationControls } from "@/components/PaginationControls";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  assigned_to?: { id: string; email: string; first_name?: string; last_name?: string } | null;
  created_at: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ComplaintsPage() {
  const [list, setList] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    api.get<PaginatedResponse<Complaint>>("/complaints/", { params: { page, page_size: pageSize } })
      .then((res) => {
        const d = res.data;
        setList(d.results ?? []);
        setCount(d.count ?? 0);
        setNext(d.next ?? null);
        setPrevious(d.previous ?? null);
      })
      .catch(() => { setList([]); setCount(0); setNext(null); setPrevious(null); })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Complaints</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No complaints.</p>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-surface-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Priority</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Assigned to</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4 font-medium">{c.title}</td>
                    <td className="px-6 py-4 capitalize">{c.status?.replace("_", " ")}</td>
                    <td className="px-6 py-4 capitalize">{c.priority ?? "—"}</td>
                    <td className="px-6 py-4 text-surface-600">
                      {c.assigned_to ? `${c.assigned_to.first_name || ""} ${c.assigned_to.last_name || ""}`.trim() || c.assigned_to.email : "—"}
                    </td>
                    <td className="px-6 py-4 text-surface-600">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
                <p className="font-medium text-surface-900">{c.title}</p>
                <p className="text-sm text-surface-600 mt-1 capitalize">{c.status?.replace("_", " ")} · {c.priority ?? "—"}</p>
                <p className="text-sm text-surface-500 mt-2">
                  {c.assigned_to ? `${c.assigned_to.first_name || ""} ${c.assigned_to.last_name || ""}`.trim() || c.assigned_to.email : "Unassigned"} · {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-b-xl border border-surface-200 border-t-0 px-4">
            <PaginationControls
              count={count}
              page={page}
              next={next}
              previous={previous}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              onNext={() => setPage((p) => p + 1)}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              loading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
}
