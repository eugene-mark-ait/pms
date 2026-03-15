"use client";

import Link from "next/link";
import { User } from "@/lib/api";
import { getDisplayName } from "@/lib/api";

export default function WelcomeBack({ user }: { user: User }) {
  const name = getDisplayName(user);
  return (
    <section className="relative flex min-h-[70vh] min-h-[70dvh] flex-col justify-center overflow-hidden bg-gradient-to-b from-surface-50 via-white to-surface-50 pt-24 pb-20 sm:pt-28 sm:pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-primary-100/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-100/20 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
          Welcome back, {name}
        </h1>
        <p className="mt-4 text-lg text-surface-600">
          Continue managing your properties and rentals.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/tenants"
            className="inline-flex items-center justify-center rounded-xl border-2 border-surface-300 bg-white px-6 py-3.5 text-base font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
          >
            Tenants
          </Link>
          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-xl border-2 border-surface-300 bg-white px-6 py-3.5 text-base font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
          >
            Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
