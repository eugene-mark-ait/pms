"use client";

const capabilities = [
  {
    title: "Rent payments and ledger",
    description: "Every payment is recorded on a single ledger. Property owners see cash flow in real time; tenants have a verifiable payment history.",
  },
  {
    title: "Tenant financial identity",
    description: "Rental history and payment behavior form a portable profile. Tenants can use it to qualify for better units and financial products.",
  },
  {
    title: "Embedded financial services",
    description: "Rent financing, deposit alternatives, and property loans sit inside the platform. Same data, one experience.",
  },
  {
    title: "Property management automation",
    description: "Leases, occupancy, and collections run through one system. Less manual work, fewer gaps.",
  },
  {
    title: "Credit building through rent",
    description: "Rent payments can be reported to bureaus or used to build a housing-specific score. Paying rent becomes an asset.",
  },
];

export default function PlatformCapabilities() {
  return (
    <section id="platform-capabilities" className="py-20 sm:py-28 bg-white dark:bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            What the platform does
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            The core capabilities that make rental housing a connected, financial layer — not just a list of units and due dates.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.slice(0, 3).map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{c.title}</h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">{c.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {capabilities.slice(3, 5).map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm"
            >
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{c.title}</h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
