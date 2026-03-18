"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "@/lib/api";
import { getDisplayName, clearTokens } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#problem", label: "Problem" },
  { href: "/#platform-capabilities", label: "Platform" },
  { href: "/#property-owners", label: "Property Owners" },
  { href: "/#tenants", label: "Tenants" },
  { href: "/#financial-services", label: "Financial Services" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar({ user = null }: { user?: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    clearTokens();
    setMobileOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 dark:bg-surface-950/50 backdrop-blur-2xl border-b border-white/40 dark:border-surface-800/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-surface-900 dark:text-surface-100">
            Mahaliwise
          </span>
          <span className="hidden text-sm text-surface-500 dark:text-surface-400 sm:inline">Rental Housing OS</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
              >
                Dashboard
              </Link>
              <span className="rounded-full px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                {getDisplayName(user)}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-surface-100 dark:bg-surface-800 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-surface-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-surface-900 hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2.5 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg py-2.5 px-3 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 space-y-2 border-t border-surface-200 dark:border-surface-800">
            {user ? (
              <>
                <Link href="/dashboard" className="block rounded-lg py-2.5 px-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <p className="py-2 text-center text-sm text-surface-500 dark:text-surface-400">{getDisplayName(user)}</p>
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="block w-full rounded-lg py-2.5 text-center text-sm font-medium text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-lg py-2.5 px-3 text-center text-sm font-medium text-surface-700 dark:text-surface-300" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="block rounded-full bg-surface-900 dark:bg-white py-2.5 text-center text-sm font-medium text-white dark:text-surface-900" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
