"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Redirect to units list with edit drawer open for this unit (slide-in form). */
export default function EditUnitRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  useEffect(() => {
    if (id) router.replace(`/units?edit=${encodeURIComponent(id)}`);
    else router.replace("/units");
  }, [id, router]);
  return (
    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-4">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
      <span>Redirecting…</span>
    </div>
  );
}
