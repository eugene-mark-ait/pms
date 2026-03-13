"use client";

import Link from "next/link";

const baseTierFeatures = [
  "List and manage properties and units",
  "Track tenants and leases",
  "Rent payment tracking and M-Pesa integration",
  "Basic financial overview",
  "Tenant and property owner messaging",
];

const advancedTierFeatures = [
  "Everything in Base",
  "Financial reports and revenue insights",
  "Asset and maintenance tracking",
  "Vacancy and notice management",
  "Complaint and issue tracking",
  "Manager and caretaker assignments",
  "Priority support",
];

function PricingCard({
  title,
  description,
  rate,
  subtext,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
}: {
  title: string;
  description: string;
  rate: string;
  subtext: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-2xl border-2 border-primary-200 bg-white p-6 shadow-lg ring-2 ring-primary-500/10 sm:p-8"
          : "rounded-2xl border border-surface-200 bg-white p-6 shadow-sm sm:p-8"
      }
    >
      {highlighted && (
        <span className="inline-block rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-medium text-white mb-2">
          Popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
      <p className="mt-1 text-sm text-surface-500">{description}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-surface-900">{rate}</span>
        <span className="text-surface-500 text-sm">{subtext}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
            <svg className="h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={
          highlighted
            ? "mt-8 block w-full rounded-xl bg-primary-600 py-3 text-center font-semibold text-white hover:bg-primary-700 transition"
            : "mt-8 block w-full rounded-xl border-2 border-surface-300 bg-white py-3 text-center font-semibold text-surface-900 hover:border-surface-400 hover:bg-surface-50 transition"
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function PricingContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-surface-600">
          Property owners pay a small percentage per unit. Tenants and property managers use the platform for free.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-surface-200 bg-surface-50/50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-surface-900">Who pays</h2>
        <ul className="mt-4 space-y-3 text-surface-600">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Property owners</strong> pay a platform fee per unit (see tiers below).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Tenants</strong> use the platform for free.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span><strong className="text-surface-900">Managers & caretakers</strong> use the platform for free when assigned.</span>
          </li>
        </ul>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
        <PricingCard
          title="Base platform"
          description="Core tools to list properties and collect rent"
          rate="1–3%"
          subtext="per unit (of monthly rent)"
          features={baseTierFeatures}
          ctaLabel="Get started"
          ctaHref="/register"
        />
        <PricingCard
          title="Advanced management"
          description="Full control with reports, maintenance, and team roles"
          rate="3–5%"
          subtext="per unit (of monthly rent)"
          features={advancedTierFeatures}
          ctaLabel="Start with Advanced"
          ctaHref="/register"
          highlighted
        />
      </div>

      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Ready to get started?</h2>
        <p className="mt-2 text-surface-600">Create your property and invite tenants. No long-term commitment.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-primary-700 transition"
          >
            Create Property
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border-2 border-surface-300 px-8 py-3.5 text-base font-semibold text-surface-900 hover:bg-surface-50 transition"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
