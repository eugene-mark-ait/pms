"use client";

import { IconCog, IconChart, IconShield, IconGrid } from "./LandingIcons";

const benefits = [
  { title: "Automation that scales", description: "Rent collection, reminders, and occupancy tracking run in one place. Fewer missed payments and less admin.", icon: IconCog },
  { title: "Cash flow visibility", description: "See what's collected, what's due, and what's at risk. No more spreadsheets or end-of-month surprises.", icon: IconChart },
  { title: "Lower defaults", description: "Early signals when payments slip. Consistent ledger and history make it easier to act before arrears stack up.", icon: IconShield },
  { title: "One system for operations", description: "Properties, units, leases, and tenants in a single dashboard. Report and operate without switching tools.", icon: IconGrid },
];

export default function PropertyOwnerFeatures() {
  return (
    <section id="property-owners" className="py-24 sm:py-32 bg-[#fafafa]/80 dark:bg-surface-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-3 mb-6">
            <IconGrid />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            For property owners
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Run your portfolio on a financial operating system. Automate collection, see cash flow in real time, and reduce default risk.
          </p>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="group rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-surface-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-surface-100/80 dark:bg-surface-700/50 p-2.5">
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{b.title}</h3>
                    <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{b.description}</p>
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
