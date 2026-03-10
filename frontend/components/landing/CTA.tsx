"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-primary-600 to-primary-700">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-primary-100">
          Join landlords, property managers, and tenants who use PMS every day.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition"
          >
            Get Started
          </Link>
          <Link
            href="/find-units"
            className="inline-flex items-center justify-center rounded-xl border-2 border-white/50 bg-white/10 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition backdrop-blur"
          >
            Find a Home
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl border-2 border-white/50 bg-white/10 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition backdrop-blur"
          >
            List Your Property
          </Link>
        </div>
      </div>
    </section>
  );
}
