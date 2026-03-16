"use client";

const points = [
  "Lenders use verified rent and occupancy data to underwrite tenant and property financing.",
  "Insurers offer deposit replacement and rent guarantee products on top of the same ledger.",
  "Fintech products — rent smoothing, savings, and credit — plug in via APIs and shared identity.",
  "One data layer means less duplication, fewer fraud vectors, and better outcomes for everyone.",
];

export default function EmbeddedFinancialServices() {
  return (
    <section id="financial-services" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            For the ecosystem
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Lenders, insurers, and fintech products don’t need to rebuild rental data. They plug into the platform and offer better products on top of verified housing and payment data.
          </p>
        </div>

        <ul className="mt-12 max-w-2xl mx-auto space-y-4">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-surface-700 dark:text-surface-300">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
