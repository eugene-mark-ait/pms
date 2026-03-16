"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] min-h-[100dvh] flex-col justify-center overflow-hidden bg-[#fafafa] dark:bg-surface-950 pt-24 pb-20 sm:pt-28 sm:pb-24">
      {/* Stripe-style gradient mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] h-[80vh] w-[80vh] rounded-full bg-primary-200/40 dark:bg-primary-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-violet-200/30 dark:bg-violet-500/10 blur-[100px]" />
        <div className="absolute top-[20%] left-[30%] h-[40vh] w-[40vh] rounded-full bg-emerald-100/40 dark:bg-emerald-500/5 blur-[80px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              The infrastructure for modern renting
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl lg:text-6xl xl:text-display-lg [letter-spacing:-0.03em]">
              The Financial Operating System for Rental Housing
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-surface-600 dark:text-surface-400 leading-[1.7] lg:mx-0">
              A unified platform where property owners manage rentals, tenants build financial identity, and housing financial services are embedded into every transaction.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-surface-900 dark:bg-white px-6 py-3.5 text-base font-medium text-white dark:text-surface-900 shadow-lg shadow-surface-900/10 hover:opacity-90 transition-opacity duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/#problem"
                className="inline-flex items-center justify-center rounded-full border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800/80 px-6 py-3.5 text-base font-medium text-surface-900 dark:text-surface-100 hover:bg-surface-50 dark:hover:bg-surface-700/80 transition-colors duration-200"
              >
                Explore the Platform
              </Link>
            </div>
            <p className="mt-6 text-sm text-surface-500 dark:text-surface-400">
              Connects property owners, tenants, and financial services in one ecosystem.
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] rounded-2xl border border-surface-200/60 dark:border-surface-700/60 bg-white dark:bg-surface-800/90 p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_12px_24px_rgba(0,0,0,0.4)]">
              <div className="rounded-xl bg-surface-50/80 dark:bg-surface-800 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-800 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-surface-300 dark:bg-surface-600" />
                    <span className="h-2 w-2 rounded-full bg-surface-300 dark:bg-surface-600" />
                    <span className="h-2 w-2 rounded-full bg-surface-300 dark:bg-surface-600" />
                  </div>
                  <span className="ml-3 text-xs font-medium text-surface-500 dark:text-surface-400">Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-surface-200/60 dark:bg-surface-700/60">
                  {["Portfolio", "Rent", "Tenants", "Analytics"].map((label) => (
                    <div key={label} className="bg-white dark:bg-surface-800 p-4">
                      <div className="h-2 w-12 rounded bg-surface-200/80 dark:bg-surface-600/80 mb-2" />
                      <div className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">{label}</div>
                      <div className="h-7 w-full rounded bg-surface-100/80 dark:bg-surface-700/80 mb-1" />
                      <div className="h-5 w-3/4 rounded bg-surface-100/80 dark:bg-surface-700/80" />
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-800 p-4 flex gap-2">
                  <div className="h-9 flex-1 rounded-lg bg-primary-500/10 dark:bg-primary-500/20" />
                  <div className="h-9 w-24 rounded-lg bg-surface-200/80 dark:bg-surface-600/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
