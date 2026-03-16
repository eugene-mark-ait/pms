"use client";

const benefits = [
  {
    title: "Financial identity that travels",
    description: "Your rental and payment history lives in one place. Use it to qualify for the next lease or financial products.",
  },
  {
    title: "Credit history from rent",
    description: "Rent payments can count. Build a housing-specific record that lenders and landlords can trust.",
  },
  {
    title: "Easier renting",
    description: "Apply, pay, and manage your lease in one flow. Less paperwork, fewer surprises.",
  },
  {
    title: "Transparent ledger",
    description: "See what you’ve paid and when. Disputes are easier when the data is shared and verifiable.",
  },
];

export default function TenantExperience() {
  return (
    <section id="tenants" className="py-20 sm:py-28 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            For tenants
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Renting shouldn’t leave you with nothing to show. Build financial identity, turn rent into credit, and move with a record that follows you.
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
