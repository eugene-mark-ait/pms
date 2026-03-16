"use client";

import { IconPlug } from "./LandingIcons";

const points = [
  "One system for leases, payments, and occupancy — not a patchwork of tools.",
  "Rent flows into a verifiable ledger so every payment can support identity and credit.",
  "Financial products (financing, deposits, insurance) plug into the same data layer.",
  "Property owners get real-time visibility; tenants get a portable rental record.",
];

export default function Solution() {
  return (
    <section id="solution" className="py-24 sm:py-32 bg-[#fafafa]/80 dark:bg-surface-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-3 mb-6">
            <IconPlug />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            One operating system for rental housing
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            We don't replace your bank or your lease. We're the layer that connects property operations, tenant identity, and housing finance so they work together.
          </p>
        </div>

        <ul className="mt-16 max-w-2xl mx-auto space-y-4 rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-8 shadow-lg shadow-surface-900/5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-4 text-surface-700 dark:text-surface-300 text-[0.9375rem] leading-[1.65]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-900 dark:bg-surface-100" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
