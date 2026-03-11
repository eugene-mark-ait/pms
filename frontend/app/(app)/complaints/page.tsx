"use client";

import { useState, useEffect } from "react";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import FileComplaintModal from "@/components/FileComplaintModal";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  assigned_to?: { id: string; email: string; first_name?: string; last_name?: string } | null;
  created_at: string;
}

export default function ComplaintsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const { items: list, loading, loadingMore, hasMore, error, sentinelRef, refresh } = useInfiniteScroll<Complaint>({
    endpoint: "/complaints/",
    pageSize: 20,
    enabled: true,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const isTenant = user?.role_names?.includes("tenant");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Complaints</h1>
        {isTenant && (
          <button
            type="button"
            onClick={() => setFileModalOpen(true)}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium"
          >
            File complaint
          </button>
        )}
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {loading ? (
        <p className="text-surface-500 dark:text-surface-400">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600 dark:text-surface-400">No complaints.{isTenant && " Use \"File complaint\" to submit an issue for your unit."}</p>
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
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more complaints</p>}
        </>
      )}

      {fileModalOpen && (
        <FileComplaintModal
          onClose={() => setFileModalOpen(false)}
          onSuccess={() => { setFileModalOpen(false); refresh(); }}
        />
      )}
    </div>
  );
}
