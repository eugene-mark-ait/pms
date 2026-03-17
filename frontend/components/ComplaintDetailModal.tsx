"use client";

import { clsx } from "clsx";
import { getDisplayName } from "@/lib/api";
import SlideOverForm from "@/components/SlideOverForm";

/** Submitter/contact info: only name, email, phone (no other user data). */
export interface ComplaintContactInfo {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ComplaintDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  tenant?: ComplaintContactInfo | null;
  unit?: string;
  unit_display?: { id: string; unit_number: string; property_name?: string } | null;
  assigned_to?: ComplaintContactInfo | null;
}

export default function ComplaintDetailModal({
  complaint,
  onClose,
  onCloseComplaint,
  canManage,
}: {
  complaint: ComplaintDetail | null;
  onClose: () => void;
  onCloseComplaint?: (id: string) => void;
  canManage?: boolean;
}) {
  const tenantName = complaint?.tenant ? getDisplayName(complaint.tenant) : "—";
  const tenantPhone = complaint?.tenant?.phone ?? "";
  const assignedName = complaint?.assigned_to ? getDisplayName(complaint.assigned_to) : "—";
  const assignedEmail = complaint?.assigned_to?.email ?? "";
  const assignedPhone = complaint?.assigned_to?.phone ?? "";
  const unitLabel = complaint?.unit_display
    ? complaint.unit_display.property_name
      ? `${complaint.unit_display.property_name} – Unit ${complaint.unit_display.unit_number}`
      : `Unit ${complaint.unit_display.unit_number}`
    : "—";

  const footer =
    canManage && complaint != null && complaint.status !== "closed" && onCloseComplaint ? (
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
          Cancel
        </button>
        <button type="button" onClick={() => complaint && onCloseComplaint(complaint.id)} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Close complaint
        </button>
      </div>
    ) : undefined;

  return (
    <SlideOverForm isOpen={!!complaint} onClose={onClose} title={complaint?.title ?? "Complaint"} width="md" footer={footer}>
      {complaint && (
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-surface-500 dark:text-surface-400 font-medium">Status</dt>
          <dd>
            <span
              className={clsx(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                complaint.status === "closed" && "bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400",
                complaint.status !== "closed" &&
                  (complaint.status === "open" || complaint.status === "in_progress") &&
                  "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
                complaint.status !== "closed" &&
                  complaint.status !== "open" &&
                  complaint.status !== "in_progress" &&
                  "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
              )}
            >
              {complaint.status?.replace("_", " ")}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-surface-500 dark:text-surface-400 font-medium">Description</dt>
          <dd className="text-surface-900 dark:text-surface-100 mt-0.5 whitespace-pre-wrap">{complaint.description || "—"}</dd>
        </div>
        {canManage && complaint.tenant && (
          <div>
            <dt className="text-surface-500 dark:text-surface-400 font-medium">Submitted by</dt>
            <dd className="text-surface-900 dark:text-surface-100 mt-0.5 space-y-0.5">
              <span className="block font-medium">{tenantName}</span>
              {complaint.tenant.email && <span className="block text-sm text-surface-600 dark:text-surface-400">{complaint.tenant.email}</span>}
              {tenantPhone && <span className="block text-sm text-surface-600 dark:text-surface-400">{tenantPhone}</span>}
            </dd>
          </div>
        )}
        {!canManage && complaint.assigned_to && (
          <div>
            <dt className="text-surface-500 dark:text-surface-400 font-medium">Assigned to</dt>
            <dd className="text-surface-900 dark:text-surface-100 mt-0.5 space-y-0.5">
              <span className="block font-medium">{assignedName}</span>
              {assignedEmail && <span className="block text-sm text-surface-600 dark:text-surface-400">{assignedEmail}</span>}
              {assignedPhone && <span className="block text-sm text-surface-600 dark:text-surface-400">{assignedPhone}</span>}
            </dd>
          </div>
        )}
        {canManage && !complaint.tenant && (
          <div>
            <dt className="text-surface-500 dark:text-surface-400 font-medium">Submitted by</dt>
            <dd className="text-surface-900 dark:text-surface-100">—</dd>
          </div>
        )}
        <div>
          <dt className="text-surface-500 dark:text-surface-400 font-medium">Apartment / Unit</dt>
          <dd className="text-surface-900 dark:text-surface-100">{unitLabel}</dd>
        </div>
        <div>
          <dt className="text-surface-500 dark:text-surface-400 font-medium">Date submitted</dt>
          <dd className="text-surface-900 dark:text-surface-100">
            {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
          </dd>
        </div>
        {complaint.priority && (
          <div>
            <dt className="text-surface-500 dark:text-surface-400 font-medium">Priority</dt>
            <dd className="text-surface-900 dark:text-surface-100 capitalize">{complaint.priority}</dd>
          </div>
        )}
        {canManage && complaint.assigned_to && (
          <div>
            <dt className="text-surface-500 dark:text-surface-400 font-medium">Assigned to</dt>
            <dd className="text-surface-900 dark:text-surface-100 mt-0.5 space-y-0.5">
              <span className="block font-medium">{assignedName}</span>
              {assignedEmail && <span className="block text-sm text-surface-600 dark:text-surface-400">{assignedEmail}</span>}
              {assignedPhone && <span className="block text-sm text-surface-600 dark:text-surface-400">{assignedPhone}</span>}
            </dd>
          </div>
        )}
      </dl>
      )}
    </SlideOverForm>
  );
}
