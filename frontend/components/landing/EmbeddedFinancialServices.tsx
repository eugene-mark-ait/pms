"use client";

const products = [
  {
    title: "Rent Financing",
    description: "Flexible options that allow tenants to smooth rent payments.",
    icon: "📅",
  },
  {
    title: "Deposit Insurance",
    description: "Replace large upfront deposits with insurance protection.",
    icon: "🛡️",
  },
  {
    title: "Property Owner Loans",
    description: "Access financing for renovations, expansion, and property improvements.",
    icon: "🏗️",
  },
];

export default function EmbeddedFinancialServices() {
  return (
    <section id="financial-services" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            Financial Services Built for Renting
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Rent financing, deposit insurance, and property loans — integrated directly into the platform. No third-party juggling.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-8 shadow-sm hover:shadow-md transition text-center"
            >
              <span className="text-3xl" aria-hidden>{p.icon}</span>
              <h3 className="mt-5 text-xl font-semibold text-surface-900 dark:text-surface-100">{p.title}</h3>
              <p className="mt-3 text-surface-600 dark:text-surface-400">{p.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm font-medium text-surface-500 dark:text-surface-400">
          These services are integrated directly into the platform — part of the rental ecosystem, not an add-on.
        </p>
      </div>
    </section>
  );
}
