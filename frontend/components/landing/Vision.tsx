"use client";

export default function Vision() {
  return (
    <section id="vision" className="py-24 sm:py-32 bg-[#fafafa]/80 dark:bg-surface-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-white/60 dark:border-surface-700/60 bg-white/60 dark:bg-surface-800/60 backdrop-blur-xl p-10 sm:p-12 shadow-lg shadow-surface-900/5">
          <h2 className="text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl [letter-spacing:-0.02em]">
            The financial layer for housing
          </h2>
          <p className="mt-6 text-lg text-surface-600 dark:text-surface-400 leading-[1.75]">
            Housing is the largest expense for most people. Today it's mostly offline and invisible to the rest of the financial system. We're building the infrastructure so that rent flows into identity, credit, and better products — for tenants, property owners, and the ecosystem that serves them.
          </p>
          <p className="mt-5 text-surface-600 dark:text-surface-400 leading-[1.75]">
            One ledger. One identity layer. One platform that turns rental housing into a connected, financial asset.
          </p>
        </div>
      </div>
    </section>
  );
}
