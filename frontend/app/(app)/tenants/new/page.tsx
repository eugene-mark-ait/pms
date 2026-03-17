"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect to tenants list with add-lease drawer open (slide-in form). */
export default function NewLeaseRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/tenants?open=add");
  }, [router]);
  return (
    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
      <span>Redirecting…</span>
    </div>
  );
}
