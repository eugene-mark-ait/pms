"use client";

const problems = [
  {
    title: "Rent is invisible to the financial system",
    description: "Payments happen in cash or bank transfer. No ledger, no proof, no way for tenants to turn rent into a financial asset.",
  },
  {
    title: "Property owners run on spreadsheets and guesswork",
    description: "Collections, occupancy, and cash flow are manual. One missed payment can break the month with no early signal.",
  },
  {
    title: "Housing finance is bolted on, not built in",
    description: "Deposits, rent financing, and insurance are separate products. They don’t share data or integrate with the lease.",
  },
  {
    title: "Tenants have no portable identity",
    description: "Rental history lives in a landlord’s inbox. Moving means starting from zero with the next landlord or lender.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-20 sm:py-28 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            Renting is fragmented
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Landlords, tenants, and financial services operate in silos. Rent doesn’t flow into identity or credit. The system wasn’t built for the way people live and pay today.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 p-6"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{p.title}</h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
