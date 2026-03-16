"use client";

import { IconInvisible, IconSpreadsheet, IconPuzzle, IconId } from "./LandingIcons";

const problems = [
  {
    title: "Rent is invisible to the financial system",
    description: "Payments happen in cash or bank transfer. No ledger, no proof, no way for tenants to turn rent into a financial asset.",
    icon: IconInvisible,
  },
  {
    title: "Property owners run on spreadsheets and guesswork",
    description: "Collections, occupancy, and cash flow are manual. One missed payment can break the month with no early signal.",
    icon: IconSpreadsheet,
  },
  {
    title: "Housing finance is bolted on, not built in",
    description: "Deposits, rent financing, and insurance are separate products. They don't share data or integrate with the lease.",
    icon: IconPuzzle,
  },
  {
    title: "Tenants have no portable identity",
    description: "Rental history lives in a landlord's inbox. Moving means starting from zero with the next landlord or lender.",
    icon: IconId,
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 sm:py-32 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm">
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
          {problems.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-surface-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-surface-100/80 dark:bg-surface-700/50 p-2.5">
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{p.title}</h3>
                    <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{p.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
