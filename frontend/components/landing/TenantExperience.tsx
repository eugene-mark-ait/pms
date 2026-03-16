"use client";

import { IconUser, IconCredit, IconDocument, IconKey } from "./LandingIcons";

const benefits = [
  { title: "Financial identity that travels", description: "Your rental and payment history lives in one place. Use it to qualify for the next lease or financial products.", icon: IconUser },
  { title: "Credit history from rent", description: "Rent payments can count. Build a housing-specific record that lenders and landlords can trust.", icon: IconCredit },
  { title: "Easier renting", description: "Apply, pay, and manage your lease in one flow. Less paperwork, fewer surprises.", icon: IconDocument },
  { title: "Transparent ledger", description: "See what you've paid and when. Disputes are easier when the data is shared and verifiable.", icon: IconKey },
];

export default function TenantExperience() {
  return (
    <section id="tenants" className="py-24 sm:py-32 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-3 mb-6">
            <IconUser />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            For tenants
          </h2>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-400 leading-[1.7]">
            Renting shouldn't leave you with nothing to show. Build financial identity, turn rent into credit, and move with a record that follows you.
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
