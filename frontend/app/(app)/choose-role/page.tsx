"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import { clsx } from "clsx";

type Role = "tenant" | "landlord" | "manager" | "caretaker";

const ROLES: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "tenant", label: "Tenant", description: "Rent and manage my lease", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
  { value: "landlord", label: "Property Owner", description: "Own and list properties", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
  { value: "manager", label: "Manager", description: "Manage properties for landlords", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.379-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /></svg> },
  { value: "caretaker", label: "Caretaker", description: "On-site support for a property", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.47-.572.47-1.433 0-2.005L11.42 15.17zM15 10.5l-3-3M3 21v-3m0-3v3m0-3h3m-3 0H3" /></svg> },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("tenant");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout to avoid infinite loading
    try {
      const res = await api.get<User>("/auth/me/", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = res.data;
      const roleNames = Array.isArray(data?.role_names) ? data.role_names : [];
      setUser({ ...data, role_names: roleNames });
      if (roleNames.length > 0) {
        router.replace("/dashboard");
        return;
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const ax = err as { response?: { status?: number }; name?: string };
      if (ax.response?.status === 401) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      const isAbort = (ax as { code?: string }).code === "ERR_CANCELED" || ax.name === "AbortError" || ax.name === "CanceledError";
      if (isAbort) {
        setLoadError("Request timed out. Check your connection and retry.");
      } else {
        setLoadError("Failed to load roles. Retry.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Prevent full page refresh
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/choose-role/", { role });
      // Only redirect on success; do not call router.refresh() here as it can
      // revalidate the current route and cause the page to re-render or stay on choose-role
      router.push("/dashboard");
      return;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax.response?.data?.detail || "Failed to set role.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !loadError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
          <span className="text-sm text-surface-500 dark:text-surface-400">Loading…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto py-6">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-medium">{loadError}</p>
          <button
            type="button"
            onClick={() => fetchUser()}
            className="mt-4 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (user?.role_names?.length) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto py-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">Choose your role</h1>
      <p className="text-surface-600 dark:text-surface-400 mb-6">
        Select how you will use the platform. You can be assigned additional roles later by an administrator.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={clsx(
                "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-left transition",
                role === r.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300"
              )}
            >
              <span className="text-surface-500 dark:text-surface-400">{r.icon}</span>
              <span className="font-medium text-sm">{r.label}</span>
              <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">{r.description}</span>
            </button>
          ))}
        </div>
        <button type="submit" disabled={submitting} className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition">
          {submitting ? "Continuing…" : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}
