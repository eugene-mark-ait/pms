"use client";

const features = [
  {
    title: "Rent Wallet",
    description: "Secure wallet for paying and managing rent.",
    icon: "👛",
  },
  {
    title: "Credit Score",
    description: "Rent payments contribute to building tenant credit.",
    icon: "📋",
  },
  {
    title: "Rental History",
    description: "Portable rental reputation across properties.",
    icon: "📜",
  },
  {
    title: "House Discovery",
    description: "Discover and apply to verified rental listings.",
    icon: "🔑",
  },
  {
    title: "Maintenance Requests",
    description: "Submit and track maintenance requests digitally.",
    icon: "🔧",
  },
];

export default function TenantExperience() {
  return (
    <section id="tenants" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            A Financial Home for Tenants
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Tenants get more than a lease — they build financial identity and control their rental experience.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <span className="text-2xl" aria-hidden>{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">{f.title}</h3>
              <p className="mt-2 text-surface-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
