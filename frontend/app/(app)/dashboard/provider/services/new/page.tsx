"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { useState } from "react";

/** Redirect to My Services page; use "Add a New Service You Offer" button there to open the create drawer. */
export default function NewServiceRedirectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const isProvider = user?.role_names?.includes("service_provider");

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user === null) return;
    if (isProvider) {
      router.replace("/dashboard/provider/services?open=add");
    } else {
      router.replace("/dashboard/provider");
    }
  }, [user, isProvider, router]);

  if (!isProvider && user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Add service</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
      <span>Redirecting…</span>
    </div>
  );
}
