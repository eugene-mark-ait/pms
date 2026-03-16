"use client";

const PARTNERS = [
  "Acme Properties",
  "Metro Realty",
  "Urban Housing Co",
  "SafeRent Insurance",
  "PayRent Finance",
  "KeyStone Lending",
  "Nest Property Group",
  "ClearView Credit",
  "HomeBase Partners",
  "RentWise Analytics",
];

function PartnerItem({ name }: { name: string }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-xl border border-white/20 dark:border-surface-600/50 bg-white/60 dark:bg-surface-800/60 backdrop-blur-md px-8 py-4 min-w-[180px]">
      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 whitespace-nowrap">{name}</span>
    </div>
  );
}

function PartnerStrip() {
  return (
    <div className="flex shrink-0 gap-6 pr-6">
      {PARTNERS.map((name) => (
        <PartnerItem key={name} name={name} />
      ))}
    </div>
  );
}

export default function PartnersMarquee() {
  return (
    <section className="relative py-12 sm:py-16 overflow-hidden border-y border-surface-200/50 dark:border-surface-800/50 bg-white/40 dark:bg-surface-900/40 backdrop-blur-xl">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400 mb-8">
        Trusted by property groups and fintech partners
      </p>
      <div className="overflow-hidden">
        <div className="flex w-max animate-marquee">
          <PartnerStrip />
          <PartnerStrip />
        </div>
      </div>
    </section>
  );
}
