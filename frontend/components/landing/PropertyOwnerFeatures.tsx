"use client";

const benefits = [
  {
    title: "Automation that scales",
    description: "Rent collection, reminders, and occupancy tracking run in one place. Fewer missed payments and less admin.",
  },
  {
    title: "Cash flow visibility",
    description: "See what's collected, what's due, and what's at risk. No more spreadsheets or end-of-month surprises.",
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
    <section id="property-owners" className="py-24 sm:py-32 bg-[#fafafa] dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            For property owners
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Run your portfolio on a financial operating system. Automate collection, see cash flow in real time, and reduce default risk.
          </p>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-800/50 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{b.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
