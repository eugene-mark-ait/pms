"use client";

const testimonials = [
  {
    quote: "Finally, a platform that lets me manage multiple properties without spreadsheets. Rent tracking and reports are a game-changer.",
    author: "Sarah M.",
    role: "Landlord",
    avatar: "SM",
  },
  {
    quote: "I found my current apartment in two days. Verified listings and filters made house hunting so much easier. No more fake ads.",
    author: "James K.",
    role: "Tenant",
    avatar: "JK",
  },
  {
    quote: "As a property manager, I need visibility across all units. Mahaliwise gives me occupancy, maintenance, and communication in one place.",
    author: "David L.",
    role: "Property Manager",
    avatar: "DL",
  },
];

function TestimonialCard({
  quote,
  author,
  role,
  avatar,
}: {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 sm:p-8 shadow-sm">
      <p className="text-surface-700 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-surface-900">{author}</p>
          <p className="text-sm text-surface-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            What Our Users Say
          </h2>
          <p className="mt-4 text-lg text-surface-600">
            Landlords, tenants, and property managers trust Mahaliwise to simplify renting and management.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.author} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
