"use client";

const pillars = [
  {
    title: "Property Owners",
    description: "Property operations: portfolio management, rent collection, tenant screening, and reporting.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: "primary",
  },
  {
    title: "Tenants",
    description: "Tenant financial identity: rent wallet, credit building, portable rental history, and discovery.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: "emerald",
  },
  {
    title: "Financial Services",
    description: "Embedded housing finance: rent financing, deposit insurance, and property owner loans.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: "violet",
  },
];

const colorClasses = {
  primary: "bg-primary-50 text-primary-700 border-primary-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
} as const;

const colorClassesDark = {
  primary: "dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800",
  emerald: "dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  violet: "dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
} as const;

export default function PlatformOverview() {
  return (
    <section id="overview" className="py-20 sm:py-28 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            One Platform Powering the Rental Economy
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            The system connects three layers: property operations, tenant financial identity, and embedded housing finance — in one financial operating system.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-8 shadow-sm hover:shadow-lg transition text-center"
            >
              <div className={`inline-flex items-center justify-center rounded-xl border p-4 ${colorClasses[pillar.color as keyof typeof colorClasses]} ${colorClassesDark[pillar.color as keyof typeof colorClassesDark]}`}>
                {pillar.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-surface-900 dark:text-surface-100">{pillar.title}</h3>
              <p className="mt-3 text-surface-600 dark:text-surface-400">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
