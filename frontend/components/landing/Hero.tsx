"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-50 via-white to-surface-50 pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary-50/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              Smarter Renting &{" "}
              <span className="text-primary-600">Property Management</span>{" "}
              in One Platform
            </h1>
            <p className="mt-6 max-w-xl text-lg text-surface-600 leading-relaxed">
              Simplify renting, property management, and financial tracking. Verified listings for tenants. Powerful tools for landlords and property managers.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/find-units"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition"
              >
                Find a Home
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border-2 border-surface-300 bg-white px-6 py-3.5 text-base font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
              >
                List Your Property
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-surface-200/80 bg-white p-2 shadow-2xl shadow-surface-900/5 ring-1 ring-surface-900/5">
              <div className="rounded-xl bg-surface-50 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-surface-200 bg-white px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                  </div>
                  <span className="ml-4 text-xs font-medium text-surface-500">Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-surface-200">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4">
                      <div className="h-2 w-16 rounded bg-surface-200 mb-3" />
                      <div className="h-8 w-full rounded bg-surface-100 mb-2" />
                      <div className="h-8 w-full rounded bg-surface-100 w-3/4" />
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-200 bg-white p-4">
                  <div className="flex gap-2 mb-2">
                    <div className="h-6 flex-1 rounded bg-primary-100" />
                    <div className="h-6 w-20 rounded bg-surface-200" />
                  </div>
                  <div className="h-12 rounded-lg bg-surface-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
