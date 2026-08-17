"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Layers,
  BarChart3,
  LogOut,
  Menu,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/invoices", label: "Invoice", icon: FileText },
  { href: "/batches", label: "Batch", icon: Layers },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (pathname === "/login" || pathname === "/register") return <>{children}</>;

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const displayName = (user?.name && user.name.trim()) || user?.email?.split("@")[0] || "Pengguna";
  const displayRole = user?.role === "ADMIN" ? "Administrator" : "Finansial";

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-out shadow-xs ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight text-sm tracking-tight flex items-center gap-1.5">
                Invoice AI
                <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded-md border border-brand-200">
                  PRO
                </span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Smart Analytics</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? "bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-sm shadow-brand-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 inline" /> {displayRole}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg hover:bg-slate-100 transition flex items-center justify-center text-slate-600"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Siap &bull; Auto Extraction Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/upload" className="btn-primary btn-sm lg:btn shadow-sm">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="font-semibold">Upload Invoice</span>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto slide-up pb-24 lg:pb-8 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-lg">
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active ? "text-brand-600 font-semibold" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}