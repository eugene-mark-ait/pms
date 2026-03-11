"use client";

export default function MpesaRentSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Rent collection through M-Pesa
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Tenants pay rent directly from the platform. Landlords receive payments with clear records—no chasing cash or manual reconciliation. Simple, fast, and transparent.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50/50 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-surface-900">Pay from your phone</p>
              <p className="text-sm text-surface-600">Tenants pay rent via M-Pesa in a few taps</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50/50 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-surface-900">Automatic records</p>
              <p className="text-sm text-surface-600">Every payment is logged and visible to both parties</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
