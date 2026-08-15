"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const nav = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/upload", label: "Upload", icon: "↑" },
  { href: "/invoices", label: "Invoice", icon: "▤" },
  { href: "/batches", label: "Batch", icon: "▣" },
  { href: "/analytics", label: "Analitik", icon: "◫" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/register") return <>{children}</>;

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-60 bg-white border-r z-40 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            IA
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight text-sm">Invoice Analytics</p>
            <p className="text-[10px] text-gray-400 font-medium">AI-powered</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`w-5 text-center text-[16px] leading-none transition-transform duration-150 group-hover:scale-110 ${
                    active ? "text-primary-600" : "text-gray-400"
                  }`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-danger-50 hover:text-danger-600 transition-all duration-150 group"
          >
            <span className="w-5 text-center text-[16px] leading-none text-gray-400 group-hover:text-danger-500 transition-colors">
              ↪
            </span>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl hover:bg-gray-100 transition flex items-center justify-center text-gray-500"
            aria-label="Buka menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="text-sm text-gray-500">Online</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/upload" className="btn-primary btn-sm lg:btn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden lg:inline">Upload Invoice</span>
              <span className="lg:hidden">Upload</span>
            </Link>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto slide-up">{children}</main>
      </div>
    </div>
  );
}