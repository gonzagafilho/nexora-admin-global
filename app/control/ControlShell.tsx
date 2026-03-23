"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { profileLabel, type ControlMenuKey, type ControlProfile } from "@/lib/control-rbac";

function MenuIcon({
  path,
  active,
}: {
  path: string;
  active: boolean;
}) {
  const base = active ? "text-white" : "text-slate-500";
  if (path === "/control") {
    return <span className={`text-base leading-none ${base}`}>◉</span>;
  }
  if (path === "/control/tenants") {
    return <span className={`text-base leading-none ${base}`}>▦</span>;
  }
  if (path === "/control/services") {
    return <span className={`text-base leading-none ${base}`}>◇</span>;
  }
  if (path === "/control/bindings") {
    return <span className={`text-base leading-none ${base}`}>⟷</span>;
  }
  if (path === "/control/billing") {
    return <span className={`text-base leading-none ${base}`}>₿</span>;
  }
  if (path === "/control/licenses") {
    return <span className={`text-base leading-none ${base}`}>◎</span>;
  }
  if (path === "/control/apps") {
    return <span className={`text-base leading-none ${base}`}>◻</span>;
  }
  if (path === "/control/infra") {
    return <span className={`text-base leading-none ${base}`}>◈</span>;
  }
  return <span className={`text-base leading-none ${base}`}>⬒</span>;
}

const menuItems: { key: ControlMenuKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Painel Executivo", href: "/control" },
  { key: "companies", label: "Empresas", href: "/control/tenants" },
  { key: "solutions", label: "Soluções", href: "/control/services" },
  { key: "contracts", label: "Contratações", href: "/control/bindings" },
  { key: "finance", label: "Financeiro", href: "/control/billing" },
  { key: "licenses", label: "Licenças", href: "/control/licenses" },
  { key: "apps", label: "Aplicativos", href: "/control/apps" },
  { key: "operations", label: "Operação", href: "/control/infra" },
  { key: "backups", label: "Backups", href: "/control/backups" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/control") return pathname === "/control";
  return pathname.startsWith(href);
}

export default function ControlShell({
  children,
  userName,
  userProfile,
  allowedMenu,
}: Readonly<{
  children: React.ReactNode;
  userName: string;
  userProfile: ControlProfile;
  allowedMenu: ControlMenuKey[];
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/login");
    } finally {
      setLogoutLoading(false);
    }
  }

  const visibleMenuItems = menuItems.filter((item) => allowedMenu.includes(item.key));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-100 text-slate-900">
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-[#E5E7EB] bg-white transition-transform duration-200 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center border-b border-[#E5E7EB] bg-gradient-to-r from-slate-900 to-slate-800 px-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="relative h-9 w-[136px] shrink-0 overflow-hidden rounded-md bg-white/95 px-2">
              <Image
                src="/brand/nexora-logo.png"
                alt="Nexora"
                fill
                priority
                className="object-contain p-1"
                sizes="136px"
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">Global</span>
          </div>
        </div>

        <nav className="flex h-[calc(100%-4rem)] flex-col px-3 py-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Navegação
          </p>
          <ul className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2">
            {visibleMenuItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <MenuIcon path={item.href} active={active} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Nexora Platform</p>
            <p className="mt-1 text-xs text-slate-500">Gestão comercial e operacional centralizada</p>
          </div>
        </nav>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E5E7EB] bg-white px-6">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <span className="text-lg leading-none">☰</span>
          </button>

          <div className="hidden max-w-md flex-1 lg:block">
            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
              <span className="text-xs text-slate-400">Buscar empresa, solução ou licença...</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight text-slate-800">{userName}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {profileLabel(userProfile)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={logoutLoading}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {logoutLoading ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

