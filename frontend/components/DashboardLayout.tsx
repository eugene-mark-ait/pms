"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearTokens, User } from "@/lib/api";
import { clsx } from "clsx";
import ThemeToggle from "@/components/ThemeToggle";

const navItems: { href: string; label: string; roles: string[]; icon: React.ReactNode }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["property_owner", "manager", "tenant", "caretaker", "service_provider"], icon: <DashboardIcon /> },
  { href: "/choose-role", label: "Choose role", roles: [], icon: <SettingsIcon /> },
  { href: "/dashboard/my-units", label: "My Units", roles: ["tenant"], icon: <HomeIcon /> },
  { href: "/find-units", label: "Find units", roles: ["tenant"], icon: <SearchIcon /> },
  { href: "/alerts", label: "Vacancy Alerts", roles: ["tenant"], icon: <BellIcon /> },
  { href: "/properties", label: "Properties", roles: ["property_owner", "manager", "caretaker"], icon: <BuildingIcon /> },
  { href: "/units", label: "Units", roles: ["property_owner", "manager", "caretaker"], icon: <GridIcon /> },
  { href: "/tenants", label: "Tenants", roles: ["property_owner", "manager", "caretaker"], icon: <UsersIcon /> },
  { href: "/payments", label: "Payments", roles: ["property_owner", "manager", "tenant", "caretaker"], icon: <PaymentIcon /> },
  { href: "/vacancies", label: "Vacancies", roles: ["property_owner", "manager", "caretaker"], icon: <VacancyIcon /> },
  { href: "/complaints", label: "Complaints", roles: ["property_owner", "manager", "tenant", "caretaker"], icon: <AlertIcon /> },
  { href: "/messages", label: "Messages", roles: ["property_owner", "manager", "tenant", "caretaker"], icon: <MessageIcon /> },
  { href: "/marketplace", label: "Marketplace", roles: ["property_owner", "manager", "tenant", "caretaker"], icon: <MarketplaceIcon /> },
  { href: "/marketplace/requests", label: "My requests", roles: ["property_owner", "manager", "tenant", "caretaker"], icon: <BellIcon /> },
  { href: "/dashboard/provider", label: "Provider Dashboard", roles: ["service_provider"], icon: <ProviderDashboardIcon /> },
  { href: "/settings", label: "Settings", roles: ["property_owner", "manager", "tenant", "caretaker", "service_provider"], icon: <SettingsIcon /> },
];

function DashboardIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>; }
function HomeIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5V18.75m0 0h9.75V3.545M2.25 9h4.5v7.5m12-9.75v7.5" /></svg>; }
function SearchIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>; }
function BellIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>; }
function BuildingIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>; }
function GridIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 016 10.5H3.75A2.25 2.25 0 011.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM20.25 15.75a2.25 2.25 0 01-2.25 2.25H15a2.25 2.25 0 01-2.25-2.25V13.5a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.25z" /></svg>; }
function UsersIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function PaymentIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h6.21M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function VacancyIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>; }
function AlertIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>; }
function MessageIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25zM10.5 12a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h4.5a.75.75 0 01.75.75z" /></svg>; }
function MarketplaceIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614M3.75 21V9.349m0 0a3.004 3.004 0 01-.75-5.925A5.982 5.982 0 0112 3c2.648 0 4.963 1.602 5.625 4 1.662-.398 3.375-.602 5.625-.602 1.662 0 3.375.204 5.625.602A5.982 5.982 0 0118 3c.896 0 1.7.393 2.25 1.016a3.001 3.001 0 013.75.614m-16.5 0a3.004 3.004 0 01-.75-5.925A5.982 5.982 0 0112 3c2.648 0 4.963 1.602 5.625 4 1.662-.398 3.375-.602 5.625-.602 1.662 0 3.375.204 5.625.602A5.982 5.982 0 0118 3c.896 0 1.7.393 2.25 1.016a3.001 3.001 0 013.75.614M3.75 21" /></svg>; }
function ProviderDashboardIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>; }
function SettingsIcon() { return <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.379-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /></svg>; }

function navForUser(user: User | null): typeof navItems {
  if (!user) return [navItems[0], navItems[navItems.length - 1]];
  if (!user.role_names?.length) return navItems.filter((item) => ["/dashboard", "/choose-role", "/settings"].includes(item.href));
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
  const [openComplaintsCount, setOpenComplaintsCount] = useState<number>(0);

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setNavLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.role_names?.length || pathname === "/choose-role") return;
    if (!user.role_names.some((r) => ["property_owner", "manager", "tenant", "caretaker", "service_provider"].includes(r))) return;
    const fetchCount = () => {
      api.get<{ count: number }>("/complaints/open_count/").then((res) => setOpenComplaintsCount(res.data.count)).catch(() => {});
    };
    fetchCount();
    const t = setInterval(fetchCount, 45000);
    const onComplaintsUpdated = () => fetchCount();
    window.addEventListener("complaints-updated", onComplaintsUpdated);
    return () => {
      clearInterval(t);
      window.removeEventListener("complaints-updated", onComplaintsUpdated);
    };
  }, [user?.role_names, pathname]);

  useEffect(() => {
    if (navLoading || !user) return;
    const hasRole = user.role_names?.length;
    if (!hasRole && pathname !== "/choose-role") {
      router.replace("/choose-role");
    }
  }, [user, navLoading, pathname, router]);

  function logout() {
    clearTokens();
    router.push("/login");
    router.refresh();
  }

  const nav = navForUser(user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 72 : 256;

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-900">
      <aside
        className="border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex flex-col fixed h-full z-30 transition-[width] duration-200 ease-in-out overflow-hidden shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center justify-between h-14 px-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <Link href="/dashboard" className={clsx("font-bold text-primary-600 dark:text-primary-400 truncate", sidebarCollapsed ? "w-0 overflow-hidden" : "text-lg")}>
            PMS
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-2 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 shrink-0"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              )}
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navLoading ? (
            <p className="px-3 py-2 text-sm text-surface-500 dark:text-surface-400">Loading…</p>
          ) : (
            nav.map((item) => {
              const showBadge = item.href === "/complaints" && openComplaintsCount > 0;
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition py-2.5 relative",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    pathname === item.href
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                      : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {showBadge && (
                    <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 dark:bg-red-600 text-white text-xs font-medium">
                      {openComplaintsCount > 99 ? "99+" : openComplaintsCount}
                    </span>
                  )}
                </Link>
              );
              return sidebarCollapsed ? (
                <span key={item.href} title={item.label} className="block">
                  {link}
                </span>
              ) : (
                link
              );
            })
          )}
        </nav>
        <div className="p-2 border-t border-surface-200 dark:border-surface-700">
          <button
            onClick={logout}
            className={clsx(
              "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 py-2.5 transition",
              sidebarCollapsed ? "justify-center px-2" : "px-3"
            )}
            title={sidebarCollapsed ? "Log out" : undefined}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M15.75 9H21m0 0l-3 3m3-3l-3-3M21 15H9m0 0l-3-3m3 3l3-3" /></svg>
            {!sidebarCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 transition-[margin] duration-200" style={{ marginLeft: sidebarWidth }}>
        <header className="h-14 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <span className="text-surface-600 dark:text-surface-400 text-sm">Property Management / Rent Collection</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
