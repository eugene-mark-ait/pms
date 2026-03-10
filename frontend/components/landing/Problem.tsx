"use client";

const houseHuntingProblems = [
  {
    title: "Fake listings",
    description: "Scammers post non-existent or misleading properties, wasting time and money.",
    icon: "⚠️",
  },
  {
    title: "Time-consuming search",
    description: "Endless browsing across multiple sites with no unified filters or verification.",
    icon: "⏱️",
  },
  {
    title: "Poor communication",
    description: "Tenants and landlords struggle with scattered messages and delayed responses.",
    icon: "💬",
  },
];

const managementProblems = [
  {
    title: "Manual rent tracking",
    description: "Spreadsheets and paper records that are error-prone and hard to maintain.",
    icon: "📋",
  },
  {
    title: "No centralized system",
    description: "Properties, tenants, and documents scattered across tools and emails.",
    icon: "📂",
  },
  {
    title: "Difficulty tracking assets",
    description: "No clear view of property condition, maintenance history, or inventory.",
    icon: "🏠",
  },
  {
    title: "Lack of financial insights",
    description: "Missing reports on income, expenses, and profitability per property.",
    icon: "📊",
  },
];

function ProblemCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-3 font-semibold text-surface-900">{title}</h3>
      <p className="mt-1.5 text-sm text-surface-600">{description}</p>
    </div>
  );
}

export default function Problem() {
  return (
    <section id="problem" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            The Problem
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            The rental ecosystem is broken for everyone. Here’s what we’re fixing.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">🏠</span>
              House Hunting Problems
            </h3>
            <div className="space-y-4">
              {houseHuntingProblems.map((p) => (
                <ProblemCard key={p.title} {...p} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">📈</span>
              Property Management Problems
            </h3>
            <div className="space-y-4">
              {managementProblems.map((p) => (
                <ProblemCard key={p.title} {...p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
