"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email atau kata sandi tidak valid");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white selection:bg-brand-500/20">
      {/* ─── Left: Form Section ─── */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              Invoice AI
              <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-md border border-brand-200">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Smart Finance Analytics</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="my-auto py-8 max-w-md w-full mx-auto slide-up">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Selamat Datang di{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Invoice AI
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
              Masuk untuk mengelola, mengekstraksi dokumen otomatis, dan menganalisis arus invoice Anda.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded-2xl p-4 mb-6 flex items-center gap-3 scale-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:bg-white transition-all"
                  placeholder="nama@perusahaan.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Kata Sandi
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:bg-white transition-all"
                  placeholder="Min. 8 karakter"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                />
                <span className="text-xs font-medium text-slate-500">Ingat saya</span>
              </label>
              <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-all">
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Belum memiliki akun?{" "}
              <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-all">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Enkripsi SSL 256-Bit &bull; Isolasi Data
          </span>
          <span>&copy; {new Date().getFullYear()} Invoice AI</span>
        </div>
      </div>

      {/* ─── Right: Interactive Showcase ─── */}
      <div className="hidden lg:col-span-7 xl:col-span-7 lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Grid Dot Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] bg-brand-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Top Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Ekstraksi AI Generasi Terbaru</span>
            </div>
          </div>

          {/* Center: Headline + Floating Invoice Cards */}
          <div className="my-auto space-y-8 max-w-2xl">
            <div>
              <h2 className="text-3xl xl:text-[2.6rem] font-extrabold tracking-tight leading-[1.15]">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                  Otomasi Analisis &
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-brand-300 to-violet-300 bg-clip-text text-transparent">
                  Rekonsiliasi Invoice
                </span>
              </h2>
              <p className="text-slate-400 text-sm xl:text-base mt-4 leading-relaxed max-w-lg">
                Tinggalkan input manual. AI membaca tabel item, validasi perhitungan DPP, PPN, dan PPh secara instan dengan akurasi tinggi.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-px h-6 bg-white/10 mt-2" />
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">Validasi Anomali Otomatis</p>
                  <p className="text-xs text-slate-400 mt-0.5">Deteksi selisih angka pembulatan, NPWP ganda, dan kejanggalan jatuh tempo seketika.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-px h-6 bg-white/10 mt-2" />
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">Ekstraksi Format Bebas & Tabel</p>
                  <p className="text-xs text-slate-400 mt-0.5">Mendukung PDF hasil scan, foto faktur, hingga arsip batch ZIP multi-halaman.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">Analitik Pengeluaran Vendor</p>
                  <p className="text-xs text-slate-400 mt-0.5">Agregasi otomatis belanja bulanan untuk pengambilan keputusan CFO & Finance Lead.</p>
                </div>
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="flex items-center gap-6 pt-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-300">&lt;3 Detik</span>
                <span>per ekstraksi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-slate-300">100%</span>
                <span>data terisolasi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-semibold text-slate-300">GPT-4o</span>
                <span>vision engine</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Aktif &bull; Terenkripsi &bull; GPT-4o Vision</span>
          </div>
        </div>
      </div>
    </div>
  );
}