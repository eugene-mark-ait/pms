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
    description: "Deposits, rent financing, and insurance are separate products. They don't share data or integrate with the lease.",
  },
  {
    title: "Tenants have no portable identity",
    description: "Rental history lives in a landlord's inbox. Moving means starting from zero with the next landlord or lender.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 sm:py-32 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            Renting is fragmented
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Landlords, tenants, and financial services operate in silos. Rent doesn't flow into identity or credit. The system wasn't built for the way people live and pay today.
          </p>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2">
          {problems.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-800/50 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{p.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
