"use client";

import Link from "next/link";

// Use /#section so from /pricing we navigate to home page section, not /pricing#section
const productLinks = [
  { href: "/find-units", label: "Find a Home" },
  { href: "/register", label: "List Your Property" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
];

const companyLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Careers" },
  { href: "#", label: "Contact" },
];

const socialLinks = [
  { href: "#", label: "Twitter", icon: "X" },
  { href: "#", label: "LinkedIn", icon: "in" },
  { href: "#", label: "GitHub", icon: "⌘" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-surface-500 hover:text-surface-900 transition text-sm">
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-surface-900">
              PMS
            </Link>
            <p className="mt-3 max-w-xs text-sm text-surface-500">
              Smarter renting and property management in one platform. For landlords, property managers, and tenants.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-surface-400 hover:text-surface-600 transition"
                  aria-label={s.label}
                >
                  <span className="text-sm font-medium">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">Product</h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">Company</h4>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-surface-500">
              <li>hello@pms.example.com</li>
              <li>+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-surface-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500">© {new Date().getFullYear()} PMS. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-surface-500">
            <a href="#" className="hover:text-surface-700 transition">Privacy</a>
            <a href="#" className="hover:text-surface-700 transition">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
