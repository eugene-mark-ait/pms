"use client";

const points = [
  "One system for leases, payments, and occupancy — not a patchwork of tools.",
  "Rent flows into a verifiable ledger so every payment can support identity and credit.",
  "Financial products (financing, deposits, insurance) plug into the same data layer.",
  "Property owners get real-time visibility; tenants get a portable rental record.",
];

export default function Solution() {
  return (
    <section id="solution" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            One operating system for rental housing
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            We don’t replace your bank or your lease. We’re the layer that connects property operations, tenant identity, and housing finance so they work together.
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
