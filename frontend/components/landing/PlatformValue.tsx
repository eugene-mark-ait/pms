"use client";

const points = [
  "Rental operations — manage properties, units, leases, and payments",
  "Tenant financial identity — wallet, credit, and portable history",
  "Embedded housing finance — rent financing, deposits, and property loans",
];

export default function PlatformValue() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
          More Than Property Management
        </h2>
        <p className="mt-6 text-lg text-surface-600 leading-relaxed">
          The platform combines rental operations, tenant financial identity, and embedded housing finance into a single financial operating system for rental housing.
        </p>
        <ul className="mt-10 space-y-4 text-left max-w-xl mx-auto">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-surface-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
