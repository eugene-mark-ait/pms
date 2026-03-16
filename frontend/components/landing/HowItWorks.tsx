"use client";

const steps = [
  {
    step: 1,
    title: "Connect your properties and tenants",
    description: "Onboard properties, units, and leases. Rent and occupancy flow into one ledger.",
  },
  {
    step: 2,
    title: "Payments run through the platform",
    description: "Tenants pay; property owners see collections in real time. Every payment updates identity and history.",
  },
  {
    step: 3,
    title: "Financial services plug in",
    description: "Lenders, insurers, and fintech use the same data to offer rent financing, deposits, and credit.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Three steps to a connected rental and financial layer.
          </p>
        </div>

        <div className="mt-16 max-w-2xl mx-auto space-y-8">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white dark:bg-primary-500">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">{s.title}</h3>
                <p className="mt-1 text-surface-600 dark:text-surface-400">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
