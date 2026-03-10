"use client";

import Link from "next/link";

const starterFeatures = [
  "Manage properties and units",
  "Track tenants and leases",
  "Basic financial tracking",
  "Rent payment notifications",
];

const professionalFeatures = [
  "Everything in Starter",
  "Financial reports and insights",
  "Asset tracking",
  "Maintenance tracking",
  "Vacancy management",
];

export default function PricingContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Headline */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-surface-600">
          Only landlords pay to use the platform. Tenants and property managers use PMS for free.
        </p>
      </div>

      {/* Who pays / who doesn't */}
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-surface-200 bg-surface-50/50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-surface-900">How pricing works</h2>
        <ul className="mt-4 space-y-3 text-surface-600">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Landlords</strong> pay per unit per month to list and manage properties.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Tenants</strong> use the platform for free to search and apply for homes.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Property managers / caretakers</strong> use the platform for free when assigned by a landlord.</span>
          </li>
        </ul>
      </div>

      {/* Per-unit explanation */}
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-surface-500">
        Landlord pricing is <strong className="text-surface-700">per unit per month</strong>. You only pay for the units you manage on the platform. No hidden fees.
      </p>

      {/* Pricing cards */}
      <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-surface-900">Starter</h3>
          <p className="mt-1 text-sm text-surface-500">For landlords getting started</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-surface-900">$9</span>
            <span className="text-surface-500">/ unit / month</span>
          </div>
          <ul className="mt-6 space-y-3">
            {starterFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                <svg className="h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 block w-full rounded-xl border-2 border-surface-300 bg-white py-3 text-center font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
          >
            Get started
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-primary-200 bg-white p-6 shadow-lg ring-2 ring-primary-500/10 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-medium text-white">Popular</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-surface-900">Professional</h3>
          <p className="mt-1 text-sm text-surface-500">For landlords who want full control</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-surface-900">$19</span>
            <span className="text-surface-500">/ unit / month</span>
          </div>
          <ul className="mt-6 space-y-3">
            {professionalFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                <svg className="h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 block w-full rounded-xl bg-primary-600 py-3 text-center font-semibold text-white hover:bg-primary-700 transition"
          >
            Start with Professional
          </Link>
        </div>
      </div>

      {/* Vacancy alerts add-on */}
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-surface-200 bg-surface-50/50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-surface-900">Vacancy Alerts add-on</h2>
        <p className="mt-2 text-surface-600">
          Landlords can send vacancy alerts to tenants who are actively searching for homes. Fill vacant units faster by reaching qualified renters on the platform.
        </p>
        <p className="mt-4 text-sm text-surface-500">
          Available as an add-on to any plan. Contact us for pricing.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Ready to list your property?</h2>
        <p className="mt-2 text-surface-600">Join landlords who manage smarter with PMS.</p>
        <Link
          href="/register"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-primary-700 transition"
        >
          Start listing your property
        </Link>
      </div>
    </div>
  );
}
