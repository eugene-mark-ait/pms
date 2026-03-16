"use client";

const benefits = [
  {
    title: "Automation that scales",
    description: "Rent collection, reminders, and occupancy tracking run in one place. Fewer missed payments and less admin.",
  },
  {
    title: "Cash flow visibility",
    description: "See what’s collected, what’s due, and what’s at risk. No more spreadsheets or end-of-month surprises.",
  },
  {
    title: "Lower defaults",
    description: "Early signals when payments slip. Consistent ledger and history make it easier to act before arrears stack up.",
  },
  {
    title: "One system for operations",
    description: "Properties, units, leases, and tenants in a single dashboard. Report and operate without switching tools.",
  },
];

export default function PropertyOwnerFeatures() {
  return (
    <section id="property-owners" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            For property owners
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Run your portfolio on a financial operating system. Automate collection, see cash flow in real time, and reduce default risk.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{b.title}</h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
