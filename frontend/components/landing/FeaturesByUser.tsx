"use client";

const features = [
  {
    userType: "Landlords",
    icon: "🏢",
    color: "primary",
    items: [
      "List and manage properties",
      "Track rental income",
      "Monitor property assets",
      "View financial reports",
      "Manage tenants",
      "Receive rent payment notifications",
    ],
  },
  {
    userType: "Property Managers / Caretakers",
    icon: "🔧",
    color: "emerald",
    items: [
      "Manage multiple properties",
      "Track maintenance issues",
      "Monitor property occupancy",
      "Communicate with tenants",
      "Track property assets",
    ],
  },
  {
    userType: "Tenants",
    icon: "🔑",
    color: "violet",
    items: [
      "Search verified rental listings",
      "Filter properties easily",
      "Apply for rentals online",
      "Communicate with landlords",
      "Track rent payments and requests",
    ],
  },
];

const colorMap = {
  primary: "bg-primary-50 text-primary-700 border-primary-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
} as const;

function FeatureCard({
  userType,
  icon,
  color,
  items,
}: {
  userType: string;
  icon: string;
  color: keyof typeof colorMap;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-lg transition">
      <div className={`inline-flex items-center justify-center rounded-xl border p-3 ${colorMap[color]}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-surface-900">{userType}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-surface-600">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FeaturesByUser() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Features by User Type
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Built for everyone in the rental ecosystem. Each role gets the tools they need.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard
              key={f.userType}
              userType={f.userType}
              icon={f.icon}
              color={f.color as keyof typeof colorMap}
              items={f.items}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
