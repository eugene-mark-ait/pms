"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] min-h-[100dvh] flex-col justify-center overflow-hidden bg-gradient-to-b from-surface-50 via-white to-surface-50 pt-24 pb-20 sm:pt-28 sm:pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-[32rem] w-[32rem] rounded-full bg-primary-100/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-100/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-violet-100/20 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              The infrastructure for modern renting
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              The Financial Operating System for Rental Housing
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-surface-600 leading-relaxed lg:mx-0">
              A unified platform where property owners manage rentals, tenants build financial identity, and housing financial services are embedded into every transaction.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition"
              >
                Get Started
              </Link>
              <Link
                href="/#overview"
                className="inline-flex items-center justify-center rounded-xl border-2 border-surface-300 bg-white px-6 py-3.5 text-base font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
              >
                Explore the Platform
              </Link>
            </div>
            <p className="mt-6 text-sm text-surface-500">
              Connects property owners, tenants, and financial services in one ecosystem.
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg rounded-2xl border border-surface-200/80 bg-white p-2 shadow-2xl shadow-surface-900/5 ring-1 ring-surface-900/5">
              <div className="rounded-xl bg-surface-50 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-surface-200 bg-white px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-300" />
                  </div>
                  <span className="ml-4 text-xs font-medium text-surface-500">Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-surface-200">
                  {["Portfolio", "Rent", "Tenants", "Analytics"].map((label, i) => (
                    <div key={label} className="bg-white p-4">
                      <div className="h-2 w-14 rounded bg-surface-200 mb-2" />
                      <div className="text-xs font-medium text-surface-500 mb-2">{label}</div>
                      <div className="h-8 w-full rounded bg-surface-100 mb-1" />
                      <div className="h-6 w-3/4 rounded bg-surface-100" />
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-200 bg-white p-4 flex gap-2">
                  <div className="h-9 flex-1 rounded-lg bg-primary-100" />
                  <div className="h-9 w-24 rounded-lg bg-surface-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
