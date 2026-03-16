"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "@/lib/api";
import { getDisplayName, clearTokens } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#overview", label: "Platform" },
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
    // Full reload so landing page remounts and re-fetches user (will be null without token)
    window.location.href = "/";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200/60 dark:border-surface-700/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
            PMS
          </span>
          <span className="hidden text-sm text-surface-500 dark:text-surface-400 sm:inline">Rental Housing OS</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition"
              >
                Dashboard
              </Link>
              <span className="rounded-lg px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                {getDisplayName(user)}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-surface-100 dark:bg-surface-700 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600 transition"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-surface-600 hover:bg-surface-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-surface-700 dark:text-surface-300"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 space-y-3 border-t border-surface-100 dark:border-surface-700">
            {user ? (
              <>
                <Link href="/dashboard" className="block rounded-lg py-2 text-center text-sm font-medium text-surface-700 dark:text-surface-300" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <p className="py-2 text-center text-sm text-surface-600 dark:text-surface-400">{getDisplayName(user)}</p>
                <button
                  type="button"
                  onClick={() => { handleLogout(); }}
                  className="block w-full rounded-lg py-2 text-center text-sm font-medium text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-lg py-2 text-center text-sm font-medium text-surface-700 dark:text-surface-300" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block rounded-lg bg-primary-600 py-2 text-center text-sm font-medium text-white" onClick={() => setMobileOpen(false)}>
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
