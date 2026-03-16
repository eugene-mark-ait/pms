"use client";

import Link from "next/link";

const productLinks = [
  { href: "/find-units", label: "Find a Home" },
  { href: "/register", label: "For Property Owners" },
  { href: "/#platform-capabilities", label: "Platform" },
  { href: "/#financial-services", label: "Financial Services" },
];

const companyLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Careers" },
  { href: "#", label: "Contact" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
    >
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-200/80 dark:border-surface-800/80 bg-white dark:bg-surface-900 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-100">
              PMS
            </Link>
            <p className="mt-4 max-w-xs text-sm text-surface-500 dark:text-surface-400 leading-[1.6]">
              The financial operating system for rental housing. Property owners, tenants, and embedded financial services — one ecosystem.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Product</h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Company</h4>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-surface-500 dark:text-surface-400">
              <li>hello@pms.example.com</li>
              <li>+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-surface-200/80 dark:border-surface-800/80 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">© {new Date().getFullYear()} PMS. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">Privacy</a>
            <a href="#" className="text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
