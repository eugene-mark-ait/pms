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
    description: "See what you've paid and when. Disputes are easier when the data is shared and verifiable.",
  },
];

export default function TenantExperience() {
  return (
    <section id="tenants" className="py-24 sm:py-32 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            For tenants
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Renting shouldn't leave you with nothing to show. Build financial identity, turn rent into credit, and move with a record that follows you.
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
