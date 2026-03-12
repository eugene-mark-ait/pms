"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { getDisplayName } from "@/lib/api";

/** Full-viewport overlay; drawer slides in from the right (same as Give Notice / File complaint). */
const MODAL_OVERLAY_CLASS =
  "fixed inset-0 top-0 left-0 w-[100vw] min-w-full h-[100vh] min-h-screen overflow-hidden flex justify-end bg-surface-950/40 dark:bg-surface-950/60 backdrop-blur-sm z-[100] transition-opacity";

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
  complaint: ComplaintDetail;
  onClose: () => void;
  onCloseComplaint?: (id: string) => void;
  canManage?: boolean;
}) {
  const tenantName = complaint.tenant ? getDisplayName(complaint.tenant) : "—";
  const tenantPhone = complaint.tenant?.phone ?? "";
  const assignedName = complaint.assigned_to ? getDisplayName(complaint.assigned_to) : "—";
  const assignedEmail = complaint.assigned_to?.email ?? "";
  const assignedPhone = complaint.assigned_to?.phone ?? "";
  const unitLabel = complaint.unit_display
    ? complaint.unit_display.property_name
      ? `${complaint.unit_display.property_name} – Unit ${complaint.unit_display.unit_number}`
      : `Unit ${complaint.unit_display.unit_number}`
    : "—";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div
      className={MODAL_OVERLAY_CLASS}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-detail-title"
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div className="p-6 pt-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id="complaint-detail-title" className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {complaint.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
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
            {/* Submitted by (tenant): name, email, phone — visible to landlords/managers/caretakers */}
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
            {/* For tenants: show who the complaint is assigned to (name, email, phone) */}
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
          {canManage && complaint.status !== "closed" && onCloseComplaint && (
            <div className="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
              <button
                type="button"
                onClick={() => onCloseComplaint(complaint.id)}
                className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
              >
                Close complaint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
