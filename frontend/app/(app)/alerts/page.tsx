"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import SlideOverForm from "@/components/SlideOverForm";
import UnitAlertForm, {
  UNIT_ALERT_FORM_ID,
  UNIT_TYPES_ALERT,
  type TenantUnitAlertType,
} from "@/components/forms/UnitAlertForm";

function parseAlertsResponse(data: unknown): { results: TenantUnitAlertType[]; next: string | null; count?: number } {
  const d = data as { results?: TenantUnitAlertType[]; next?: string | null; count?: number };
  return {
    results: Array.isArray(d?.results) ? d.results : [],
    next: d?.next ?? null,
    count: d?.count,
  };
}

export default function AlertsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editAlert, setEditAlert] = useState<TenantUnitAlertType | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const isTenant = user?.role_names?.includes("tenant");

  const {
    items: alerts,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    sentinelRef,
  } = useInfiniteScroll<TenantUnitAlertType>({
    endpoint: "/vacancies/alerts/",
    pageSize: 20,
    enabled: isTenant ?? false,
    parseResponse: parseAlertsResponse,
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  async function handleToggleActive(alert: TenantUnitAlertType) {
    try {
      await api.patch(`/vacancies/alerts/${alert.id}/`, {
        is_active: !alert.is_active,
      });
      refresh();
    } catch {
      alert("Failed to update alert.");
    }
  }

  async function handleDelete(alert: TenantUnitAlertType) {
    if (!confirm("Delete this alert? You will no longer get notifications for it.")) return;
    try {
      await api.delete(`/vacancies/alerts/${alert.id}/`);
      setEditAlert(null);
      refresh();
    } catch {
      alert("Failed to delete alert.");
    }
  }

  function getUnitTypeLabel(value: string) {
    if (!value) return "Any";
    return UNIT_TYPES_ALERT.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
  }

  if (user === null) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
        <p className="text-surface-500 dark:text-surface-400">Loading…</p>
      </div>
    );
  }

  if (user && !isTenant) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Vacancy Alerts</h1>
        <p className="text-surface-600 dark:text-surface-400">Only tenants can create and manage vacancy alerts.</p>
        <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Vacancy Alerts</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Get notified when units matching your criteria become available.
          </p>
        </div>
        {isTenant && (
          <button
            type="button"
            onClick={() => setAddDrawerOpen(true)}
            className="rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium min-h-[44px] inline-flex items-center"
          >
            Create alert
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400" role="status" aria-live="polite">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading alerts…</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-600 dark:text-surface-400">
            No alerts yet. Create one to get notified when matching units are available.
          </p>
          {isTenant && (
            <button
              type="button"
              onClick={() => setAddDrawerOpen(true)}
              className="mt-4 rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700 text-sm font-medium"
            >
              Create alert
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border bg-white dark:bg-surface-800 p-4 shadow-sm transition ${
                alert.is_active
                  ? "border-surface-200 dark:border-surface-700"
                  : "border-surface-200 dark:border-surface-700 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {getUnitTypeLabel(alert.unit_type)}
                  </p>
                  {(alert.min_rent != null || alert.max_rent != null) && (
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">
                      KSh {alert.min_rent != null ? Number(alert.min_rent).toLocaleString("en-KE") : "0"} –{" "}
                      {alert.max_rent != null ? Number(alert.max_rent).toLocaleString("en-KE") : "∞"}
                    </p>
                  )}
                  {alert.location && (
                    <p className="text-sm text-surface-600 dark:text-surface-400 truncate" title={alert.location}>
                      {alert.location}
                    </p>
                  )}
                  {alert.property_name && (
                    <p className="text-sm text-surface-500 dark:text-surface-500 truncate" title={alert.property_name}>
                      {alert.property_name}
                    </p>
                  )}
                  {((alert as { email?: string }).email || (alert as { phone?: string }).phone) && (
                    <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                      Contact: {[(alert as { email?: string }).email, (alert as { phone?: string }).phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-surface-500 dark:text-surface-500 mt-2">
                    Created {new Date(alert.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    alert.is_active
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400"
                  }`}
                >
                  {alert.is_active ? "Active" : "Paused"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditAlert(alert)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(alert)}
                  className="text-sm text-surface-600 dark:text-surface-400 hover:underline"
                >
                  {alert.is_active ? "Pause" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(alert)}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {alerts.length > 0 && (
        <>
          <div ref={sentinelRef} className="min-h-[24px]" aria-hidden />
          {loadingMore && (
            <div className="flex justify-center py-6" role="status" aria-live="polite">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
              <span className="sr-only">Loading more…</span>
            </div>
          )}
          {!loadingMore && !hasMore && alerts.length > 0 && (
            <p className="text-center text-sm text-surface-500 dark:text-surface-400 py-2">No more results</p>
          )}
        </>
      )}

      <SlideOverForm
        isOpen={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title="Create alert"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRequestClose}
              className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
            >
              Cancel
            </button>
            <button
              form={UNIT_ALERT_FORM_ID}
              type="submit"
              disabled={formSubmitting}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {formSubmitting ? "Creating…" : "Create alert"}
            </button>
          </div>
        )}
      >
        <UnitAlertForm
          mode="create"
          onSuccess={() => {
            setAddDrawerOpen(false);
            refresh();
          }}
          onSubmittingChange={setFormSubmitting}
        />
      </SlideOverForm>

      <SlideOverForm
        isOpen={editAlert !== null}
        onClose={() => setEditAlert(null)}
        title="Edit alert"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRequestClose}
              className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
            >
              Cancel
            </button>
            <button
              form={UNIT_ALERT_FORM_ID}
              type="submit"
              disabled={formSubmitting}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {formSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      >
        {editAlert && (
          <UnitAlertForm
            mode="edit"
            alertId={editAlert.id}
            initialData={editAlert}
            onSuccess={() => {
              setEditAlert(null);
              refresh();
            }}
            onSubmittingChange={setFormSubmitting}
          />
        )}
      </SlideOverForm>
    </div>
  );
}
