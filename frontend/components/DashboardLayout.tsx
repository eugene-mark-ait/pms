"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearTokens, User } from "@/lib/api";
import { clsx } from "clsx";

/** Nav items with roles that can see them (user needs at least one of these roles). */
const navItems: { href: string; label: string; roles: string[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["landlord", "manager", "tenant", "caretaker"] },
  { href: "/dashboard/my-units", label: "My Units", roles: ["tenant"] },
  { href: "/find-units", label: "Find units", roles: ["tenant"] },
  { href: "/properties", label: "Properties", roles: ["landlord", "manager"] },
  { href: "/units", label: "Units", roles: ["landlord", "manager"] },
  { href: "/tenants", label: "Tenants", roles: ["landlord", "manager"] },
  { href: "/payments", label: "Payments", roles: ["landlord", "manager", "tenant"] },
  { href: "/vacancies", label: "Vacancies", roles: ["landlord", "manager"] },
  { href: "/complaints", label: "Complaints", roles: ["landlord", "manager", "tenant"] },
  { href: "/messages", label: "Messages", roles: ["landlord", "manager", "tenant", "caretaker"] },
  { href: "/settings", label: "Settings", roles: ["landlord", "manager", "tenant", "caretaker"] },
];

function navForUser(user: User | null): typeof navItems {
  if (!user) return [navItems[0], navItems[navItems.length - 1]]; // Dashboard, Settings while loading
  if (!user.role_names?.length) return navItems.filter((item) => item.href === "/dashboard" || item.href === "/settings");
  return navItems.filter((item) => item.roles.some((role) => user.role_names?.includes(role)));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [navLoading, setNavLoading] = useState(true);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setNavLoading(false));
  }, []);

  function logout() {
    clearTokens();
    router.push("/login");
    router.refresh();
  }

  const nav = navForUser(user);

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="w-64 border-r border-surface-200 bg-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-surface-200">
          <Link href="/dashboard" className="font-bold text-lg text-primary-600">
            PMS
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLoading ? (
            <p className="px-4 py-2 text-sm text-surface-500">Loading…</p>
          ) : (
            nav.map((item) => (
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
            ))
          )}
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
