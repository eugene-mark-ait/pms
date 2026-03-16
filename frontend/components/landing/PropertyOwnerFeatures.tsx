"use client";

const features = [
  {
    title: "Portfolio Management",
    description: "Manage multiple properties, units, and tenants in one centralized dashboard.",
    icon: "📊",
  },
  {
    title: "Rent Collection",
    description: "Automated rent payments, reminders, and payment tracking.",
    icon: "💰",
  },
  {
    title: "Tenant Screening",
    description: "Integrated screening with identity verification and risk insights.",
    icon: "🔍",
  },
  {
    title: "Financial Reports",
    description: "Clear reports on rental income, performance, and expenses.",
    icon: "📈",
  },
  {
    title: "Predictive Analytics",
    description: "Data-driven insights on vacancies, rent pricing, and tenant behavior.",
    icon: "📉",
  },
];

export default function PropertyOwnerFeatures() {
  return (
    <section id="property-owners" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100 sm:text-4xl">
            Tools for Property Owners
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Everything you need to operate and grow your rental portfolio — from one dashboard.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm hover:shadow-md transition"
            >
              <span className="text-2xl" aria-hidden>{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-surface-100">{f.title}</h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
