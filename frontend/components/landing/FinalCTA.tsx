"use client";

import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-surface-900/90 dark:bg-surface-950/90 backdrop-blur-xl border-t border-white/10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-800/60 to-surface-900 dark:from-surface-800/40 dark:to-surface-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary-500/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl [letter-spacing:-0.02em]">
          The infrastructure for modern renting
        </h2>
        <p className="mt-5 text-lg text-surface-300 leading-[1.7]">
          One platform for property owners, tenants, and housing financial services. Get started or see a demo.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-base font-medium text-surface-900 shadow-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-surface-500/50 bg-surface-800/50 px-6 py-3.5 text-base font-medium text-white hover:bg-surface-700/50 transition-colors"
          >
            Request a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
