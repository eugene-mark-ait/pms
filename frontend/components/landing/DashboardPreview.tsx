"use client";

const mockListings = [
  { name: "Sunset Apartments", units: 12, occupied: 10 },
  { name: "Downtown Lofts", units: 8, occupied: 7 },
  { name: "Riverside Residences", units: 24, occupied: 22 },
];

export default function DashboardPreview() {
  return (
    <section className="py-20 sm:py-28 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Platform Dashboard Preview
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Everything you need in one place: listings, payments, reports, and maintenance.
          </p>
        </div>

        <div className="mt-16 relative">
          <div className="rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-900/10 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-surface-200 bg-surface-50 px-6 py-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="ml-4 text-sm text-surface-500">PMS Dashboard</span>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
              <div className="border-r border-surface-200 p-6">
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
                  Property listings
                </h3>
                <ul className="space-y-3">
                  {mockListings.map((p) => (
                    <li key={p.name} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-3">
                      <span className="font-medium text-surface-900">{p.name}</span>
                      <span className="text-sm text-surface-500">{p.occupied}/{p.units} occupied</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
                  Rent payment tracking
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-surface-50 px-4 py-3">
                    <span className="text-surface-700">Unit 101 – Due Mar 1</span>
                    <span className="text-emerald-600 font-medium">Paid</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-surface-50 px-4 py-3">
                    <span className="text-surface-700">Unit 102 – Due Mar 1</span>
                    <span className="text-amber-600 font-medium">Pending</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-surface-50 px-4 py-3">
                    <span className="text-surface-700">Unit 201 – Due Mar 5</span>
                    <span className="text-surface-400 font-medium">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-0 border-t border-surface-200">
              <div className="border-r border-surface-200 p-6">
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
                  Financial summary
                </h3>
                <div className="rounded-xl bg-primary-50 p-4">
                  <p className="text-sm text-primary-700">Monthly revenue</p>
                  <p className="text-2xl font-bold text-primary-900">$24,500</p>
                  <p className="text-xs text-primary-600 mt-1">+12% vs last month</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
                  Maintenance tracking
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-sm text-surface-700">Unit 103 – Plumbing</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-surface-700">Unit 205 – Resolved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
