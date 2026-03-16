"use client";

import Link from "next/link";

const productLinks = [
  { href: "/find-units", label: "Find a Home" },
  { href: "/register", label: "For Property Owners" },
  { href: "/#overview", label: "Platform" },
  { href: "/#financial-services", label: "Financial Services" },
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
    <Link href={href} className="text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition text-sm">
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-surface-900 dark:text-surface-100">
              PMS
            </Link>
            <p className="mt-3 max-w-xs text-sm text-surface-500 dark:text-surface-400">
              The financial operating system for rental housing. Property owners, tenants, and embedded financial services — one ecosystem.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition"
                  aria-label={s.label}
                >
                  <span className="text-sm font-medium">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Product</h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Company</h4>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-surface-500 dark:text-surface-400">
              <li>hello@pms.example.com</li>
              <li>+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">© {new Date().getFullYear()} PMS. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-surface-500 dark:text-surface-400">
            <a href="#" className="hover:text-surface-700 dark:hover:text-surface-200 transition">Privacy</a>
            <a href="#" className="hover:text-surface-700 dark:hover:text-surface-200 transition">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
