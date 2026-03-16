"use client";

import { IconPlug } from "./LandingIcons";

const points = [
  "Lenders use verified rent and occupancy data to underwrite tenant and property financing.",
  "Insurers offer deposit replacement and rent guarantee products on top of the same ledger.",
  "Fintech products — rent smoothing, savings, and credit — plug in via APIs and shared identity.",
  "One data layer means less duplication, fewer fraud vectors, and better outcomes for everyone.",
];

export default function EmbeddedFinancialServices() {
  return (
    <section id="financial-services" className="py-24 sm:py-32 bg-[#fafafa]/80 dark:bg-surface-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-3 mb-6">
            <IconPlug />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            For the ecosystem
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Lenders, insurers, and fintech products don't need to rebuild rental data. They plug into the platform and offer better products on top of verified housing and payment data.
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
