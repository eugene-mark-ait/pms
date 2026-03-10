"use client";

const landlordSteps = [
  { step: 1, title: "List your property", description: "Add properties and units with details, photos, and rent." },
  { step: 2, title: "Manage tenants", description: "Assign leases, track payments, and handle applications." },
  { step: 3, title: "Track finances and assets", description: "View reports, monitor income, and manage maintenance." },
];

const tenantSteps = [
  { step: 1, title: "Search verified homes", description: "Filter by location, unit type, and budget." },
  { step: 2, title: "Apply online", description: "Submit applications and communicate with landlords." },
  { step: 3, title: "Move in and manage rent digitally", description: "Pay rent, submit requests, and track your lease." },
];

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-surface-900">{title}</h3>
        <p className="mt-1 text-sm text-surface-600">{description}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Get started in minutes. Simple flows for landlords and tenants.
          </p>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-8">
            <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
              <span className="rounded-lg bg-primary-100 p-1.5 text-primary-700">Landlords</span>
            </h3>
            <div className="space-y-6">
              {landlordSteps.map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-8">
            <h3 className="text-lg font-semibold text-surface-900 mb-6 flex items-center gap-2">
              <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">Tenants</span>
            </h3>
            <div className="space-y-6">
              {tenantSteps.map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
