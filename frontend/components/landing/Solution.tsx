"use client";

const solutions = [
  {
    title: "Verified property listings",
    description: "Every listing is validated so tenants find real homes, not scams.",
  },
  {
    title: "Property management tools",
    description: "One place to manage units, leases, and occupancy.",
  },
  {
    title: "Asset tracking",
    description: "Monitor condition, maintenance, and inventory per property.",
  },
  {
    title: "Financial reporting",
    description: "Income, expenses, and reports for landlords and managers.",
  },
  {
    title: "Tenant–landlord communication",
    description: "In-app messaging and complaint handling in one place.",
  },
];

export default function Solution() {
  return (
    <section id="solution" className="py-20 sm:py-28 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Our Solution
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            An all-in-one rental and property management platform that works for tenants, landlords, and property managers.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((s) => (
            <div
              key={s.title}
              className="group rounded-xl border border-surface-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-surface-900">{s.title}</h3>
              <p className="mt-2 text-sm text-surface-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
