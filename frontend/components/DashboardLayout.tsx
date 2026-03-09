"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";
import { clsx } from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/my-units", label: "My Units" },
  { href: "/properties", label: "Properties" },
  { href: "/units", label: "Units" },
  { href: "/tenants", label: "Tenants" },
  { href: "/payments", label: "Payments" },
  { href: "/vacancies", label: "Vacancies" },
  { href: "/complaints", label: "Complaints" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearTokens();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="w-64 border-r border-surface-200 bg-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-surface-200">
          <Link href="/dashboard" className="font-bold text-lg text-primary-600">
            PMS
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block px-4 py-2.5 rounded-lg text-sm font-medium transition",
                pathname === item.href
                  ? "bg-primary-50 text-primary-700"
                  : "text-surface-700 hover:bg-surface-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-200">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-100"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1 pl-64 flex flex-col">
        <header className="h-14 border-b border-surface-200 bg-white flex items-center px-6">
          <span className="text-surface-600 text-sm">Property Management</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
