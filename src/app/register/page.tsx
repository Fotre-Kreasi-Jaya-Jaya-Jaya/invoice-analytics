"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Kata sandi harus memiliki minimal 8 karakter.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat akun baru");

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || "Gagal masuk otomatis");

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
              Mulai Analisis{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Invoice Cerdas
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
              Daftarkan akun tim keuangan Anda dan nikmati pemrosesan dokumen otomatis berbasis AI.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded-2xl p-4 mb-6 flex items-center gap-3 scale-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nama Lengkap
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:bg-white transition-all"
                  placeholder="Misal: Ridho Pratama"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Alamat Email Kerja
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
                  placeholder="Buat kata sandi yang kuat"
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

              {/* Password Strength Indicators */}
              {password.length > 0 && (
                <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className={hasMinLength ? "text-emerald-600" : "text-slate-400"}>8+ karakter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className={hasUppercase ? "text-emerald-600" : "text-slate-400"}>Huruf besar</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className={hasNumber ? "text-emerald-600" : "text-slate-400"}>Angka</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Akun Baru...</span>
                </>
              ) : (
                <>
                  <span>Buat Akun & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Sudah memiliki akun terdaftar?{" "}
              <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-all">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Privasi &bull; Keamanan Terenkripsi
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
              <span>Setup Cepat &amp; Langsung Siap Pakai</span>
            </div>
          </div>

          {/* Center */}
          <div className="my-auto space-y-8 max-w-2xl">
            <div>
              <h2 className="text-3xl xl:text-[2.6rem] font-extrabold tracking-tight leading-[1.15]">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                  Kelola Ratusan Invoice
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-brand-300 to-violet-300 bg-clip-text text-transparent">
                  Dalam Hitungan Menit
                </span>
              </h2>
              <p className="text-slate-400 text-sm xl:text-base mt-4 leading-relaxed max-w-lg">
                Solusi cerdas bagi perusahaan yang menginginkan kecepatan audit pengeluaran tanpa kesalahan manual manusia.
              </p>
            </div>

            {/* Feature Steps */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                    <FileCheck2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-px h-6 bg-white/10 mt-2" />
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">Upload Dokumen Massal</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upload puluhan PDF atau arsip ZIP sekaligus. Proses OCR berjalan paralel dalam antrean.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-px h-6 bg-white/10 mt-2" />
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">AI Ekstraksi & Validasi</p>
                  <p className="text-xs text-slate-400 mt-0.5">GPT-4o membaca setiap field—vendor, NPWP, item produk, DPP, PPN—dalam hitungan detik.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="pt-1.5">
                  <p className="text-sm font-bold text-white">Analitik & Ekspor Instan</p>
                  <p className="text-xs text-slate-400 mt-0.5">Dashboard ringkasan pengeluaran vendor bulanan, ekspor CSV 1 klik untuk software akuntansi.</p>
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
            <span>Sistem Berjalan Aman &bull; Keamanan Tingkat Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
}