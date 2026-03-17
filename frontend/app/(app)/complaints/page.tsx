"use client";

import { useState, useEffect } from "react";
import { api, User, getDisplayName } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import FileComplaintModal from "@/components/FileComplaintModal";
import ComplaintDetailModal, { type ComplaintDetail } from "@/components/ComplaintDetailModal";
import { clsx } from "clsx";

interface Complaint extends ComplaintDetail {}

export default function ComplaintsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const { items: list, loading, loadingMore, hasMore, error, sentinelRef, refresh } = useInfiniteScroll<Complaint>({
    endpoint: "/complaints/",
    pageSize: 20,
    enabled: true,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const isTenant = user?.role_names?.includes("tenant");
  const canManageComplaints = user?.role_names?.includes("property_owner") || user?.role_names?.includes("manager") || user?.role_names?.includes("caretaker");

  async function closeComplaint(id: string) {
    try {
      await api.patch(`/complaints/${id}/`, { status: "closed" });
      setDetailComplaint(null);
      refresh();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("complaints-updated"));
    } catch {
      alert("Failed to close complaint.");
    }
  }

  return (
    <div className="space-y-6 pt-0">
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
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading complaints…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-600 dark:text-surface-400 font-medium">No complaints available.</p>
          {isTenant && <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">Use &quot;File complaint&quot; to submit an issue for your unit.</p>}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                <tr>
                  {canManageComplaints && <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Submitted by</th>}
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Title</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Priority</th>
                  {canManageComplaints && <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Assigned to</th>}
                  <th className="text-left px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Created</th>
                  {canManageComplaints && <th className="text-right px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {list.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetailComplaint(c)}
                    className={clsx(
                      "hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer",
                      c.status === "closed" && "opacity-70 bg-surface-50/50 dark:bg-surface-800/50"
                    )}
                  >
                    {canManageComplaints && (
                      <td className="px-6 py-4 text-surface-700 dark:text-surface-300">
                        <span className="font-medium">{c.tenant ? getDisplayName(c.tenant) : "—"}</span>
                        {c.unit_display && (
                          <span className="text-surface-500 dark:text-surface-400 text-sm block">
                            {c.unit_display.property_name ? `${c.unit_display.property_name} – ` : ""}Unit {c.unit_display.unit_number}
                          </span>
                        )}
                      </td>
                    )}
                    <td className={clsx("px-6 py-4 font-medium", c.status === "closed" ? "text-surface-500 dark:text-surface-400" : "text-surface-900 dark:text-surface-100")}>{c.title}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                        c.status === "closed" && "bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400",
                        c.status !== "closed" && (c.status === "open" || c.status === "in_progress") && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ring-1 ring-red-600/20 dark:ring-red-500/30",
                        c.status !== "closed" && c.status !== "open" && c.status !== "in_progress" && "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      )}>
                        {c.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize text-surface-600 dark:text-surface-400">{c.priority ?? "—"}</td>
                    {canManageComplaints && (
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {c.assigned_to ? getDisplayName(c.assigned_to) || c.assigned_to.email : "—"}
                      </td>
                    )}
                    <td className="px-6 py-4 text-surface-600 dark:text-surface-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    {canManageComplaints && (
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {c.status !== "closed" && (
                          <button type="button" onClick={() => closeComplaint(c.id)} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                            Close
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {list.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetailComplaint(c)}
                onKeyDown={(e) => e.key === "Enter" && setDetailComplaint(c)}
                className={clsx(
                  "bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/30",
                  c.status === "closed" && "opacity-75"
                )}
              >
                {canManageComplaints && c.tenant && (
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {getDisplayName(c.tenant)}
                    {c.unit_display && (
                      <span className="text-surface-500 dark:text-surface-400 font-normal">
                        {" "}· {c.unit_display.property_name ? `${c.unit_display.property_name} – ` : ""}Unit {c.unit_display.unit_number}
                      </span>
                    )}
                  </p>
                )}
                <p className={clsx("font-medium mt-1", c.status === "closed" ? "text-surface-500 dark:text-surface-400" : "text-surface-900 dark:text-surface-100")}>{c.title}</p>
                <p className="text-sm mt-1">
                  <span className={clsx(
                    "capitalize font-medium",
                    c.status === "closed" && "text-surface-500 dark:text-surface-400",
                    c.status !== "closed" && (c.status === "open" || c.status === "in_progress") && "text-red-700 dark:text-red-400",
                    c.status !== "closed" && c.status !== "open" && c.status !== "in_progress" && "text-amber-700 dark:text-amber-400"
                  )}>
                    {c.status?.replace("_", " ")}
                  </span>
                  <span className="text-surface-600 dark:text-surface-400"> · {c.priority ?? "—"}</span>
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-500 mt-2">
                  {c.assigned_to ? getDisplayName(c.assigned_to) || c.assigned_to.email : "Unassigned"} · {new Date(c.created_at).toLocaleDateString()}
                </p>
                {canManageComplaints && c.status !== "closed" && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); closeComplaint(c.id); }} className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                    Close complaint
                  </button>
                )}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="min-h-[24px] flex justify-center py-4">
            {loadingMore && <p className="text-surface-500 text-sm">Loading more…</p>}
          </div>
          {!hasMore && list.length > 0 && <p className="text-center text-surface-500 dark:text-surface-400 text-sm">No more complaints</p>}
        </>
      )}

      <FileComplaintModal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        onSuccess={() => {
          setFileModalOpen(false);
          refresh();
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("complaints-updated"));
        }}
      />
      <ComplaintDetailModal
        complaint={detailComplaint}
        onClose={() => setDetailComplaint(null)}
        onCloseComplaint={canManageComplaints ? closeComplaint : undefined}
        canManage={canManageComplaints}
      />
    </div>
  );
}
