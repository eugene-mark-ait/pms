"use client";

import { IconLedger, IconId, IconPlug, IconCog, IconCredit } from "./LandingIcons";

const capabilities = [
  { title: "Rent payments and ledger", description: "Every payment is recorded on a single ledger. Property owners see cash flow in real time; tenants have a verifiable payment history.", icon: IconLedger },
  { title: "Tenant financial identity", description: "Rental history and payment behavior form a portable profile. Tenants can use it to qualify for better units and financial products.", icon: IconId },
  { title: "Embedded financial services", description: "Rent financing, deposit alternatives, and property loans sit inside the platform. Same data, one experience.", icon: IconPlug },
  { title: "Property management automation", description: "Leases, occupancy, and collections run through one system. Less manual work, fewer gaps.", icon: IconCog },
  { title: "Credit building through rent", description: "Rent payments can be reported to bureaus or used to build a housing-specific score. Paying rent becomes an asset.", icon: IconCredit },
];

export default function PlatformCapabilities() {
  return (
    <section id="platform-capabilities" className="py-24 sm:py-32 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            What the platform does
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            The core capabilities that make rental housing a connected, financial layer — not just a list of units and due dates.
          </p>
        </div>

        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.slice(0, 3).map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="group rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-surface-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="rounded-xl bg-surface-100/80 dark:bg-surface-700/50 p-2.5 w-fit">
                  <Icon />
                </div>
                <h3 className="mt-4 font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{c.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{c.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {capabilities.slice(3, 5).map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="group rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/70 dark:bg-surface-800/70 backdrop-blur-xl p-6 sm:p-7 shadow-lg shadow-surface-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="rounded-xl bg-surface-100/80 dark:bg-surface-700/50 p-2.5 w-fit">
                  <Icon />
                </div>
                <h3 className="mt-4 font-semibold text-surface-900 dark:text-surface-100 text-[1.0625rem]">{c.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] text-surface-600 dark:text-surface-400 leading-[1.6]">{c.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
