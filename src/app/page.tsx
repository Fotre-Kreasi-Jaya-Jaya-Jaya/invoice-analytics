"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Wallet,
  Receipt,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
  Plus,
  BarChart2,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatDate, formatMonth } from "@/components/format";
import { StatusBadge } from "@/components/StatusBadge";

type Analytics = {
  totalInvoices: number;
  totalAmount: number;
  totalVat: number;
  needsReview: number;
  withWarnings: number;
  topVendors: { name: string; count: number; total: number }[];
  monthly: { month: string; count: number; total: number }[];
  typeDistribution: { type: string; count: number }[];
  upcomingDue: { invoiceNumber: string | null; vendorName: string | null; dueDate: string | null; grandTotal: number | null }[];
};

type RecentInvoice = {
  id: string;
  invoiceNumber: string | null;
  vendorName: string | null;
  invoiceDate: string | null;
  grandTotal: number | null;
  reviewStatus: string;
  currency: string;
  document: { originalName: string };
  _count: { validationIssues: number };
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recent, setRecent] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredMonth, setHoveredMonth] = useState<{ month: string; total: number; count: number } | null>(null);
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    try {
      setCurrentDateStr(
        new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date())
      );
    } catch {}

    async function load() {
      try {
        const [aRes, iRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/invoices?limit=8"),
        ]);
        if (!aRes.ok || !iRes.ok) throw new Error("Gagal memuat data dashboard");
        const a = await aRes.json();
        const i = await iRes.json();
        setAnalytics(a);
        setRecent(i.invoices || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 skeleton" />
          <div className="h-80 skeleton" />
        </div>
        <div className="h-64 skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-sm flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
        <p>{error}</p>
      </div>
    );
  }

  if (!analytics || analytics.totalInvoices === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center card p-10 slide-up max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 text-brand-600 flex items-center justify-center mb-5 border border-brand-100">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Belum ada invoice yang diproses</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
          Unggah file invoice PDF atau gambar untuk memulai ekstraksi otomatis dengan AI.
        </p>
        <Link href="/upload" className="btn-primary mt-6 btn-lg shadow-sm flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Unggah Invoice Pertama
        </Link>
      </div>
    );
  }

  const maxMonthVal = Math.max(...analytics.monthly.map((m) => m.total), 1);
  const highestMonth = analytics.monthly.reduce(
    (prev, current) => (prev.total > current.total ? prev : current),
    analytics.monthly[0] || { month: "-", total: 0, count: 0 }
  );

  return (
    <div className="space-y-6 slide-up">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Dashboard Analitik
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan performa finansial dan status pemrosesan invoice
          </p>
        </div>
        {currentDateStr && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/70 shadow-2xs">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>{currentDateStr}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoice"
          value={analytics.totalInvoices.toLocaleString("id-ID")}
          sub="Semua dokumen terdaftar"
          color="brand"
          icon={FileText}
        />
        <KpiCard
          title="Total Nilai"
          value={formatCurrency(analytics.totalAmount)}
          sub="Akumulasi seluruh transaksi"
          color="success"
          icon={Wallet}
        />
        <KpiCard
          title="Total PPN"
          value={formatCurrency(analytics.totalVat)}
          sub="Pajak Pertambahan Nilai"
          color="purple"
          icon={Receipt}
        />
        <KpiCard
          title="Perlu Review"
          value={analytics.needsReview}
          sub={
            analytics.withWarnings > 0
              ? `${analytics.withWarnings} invoice ada peringatan`
              : "Semua data tervalidasi aman"
          }
          color={analytics.needsReview > 0 ? "danger" : "warning"}
          icon={AlertTriangle}
          badge={analytics.needsReview > 0 ? "Penting" : undefined}
        />
      </div>

      {/* Chart & Top Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-brand-600" />
                Pengeluaran per Bulan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tren agregasi nominal invoice bulanan
              </p>
            </div>
            {highestMonth && highestMonth.total > 0 && (
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200/70 px-3 py-1.5 rounded-lg text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-slate-600 font-medium">Tertinggi:</span>
                <span className="font-semibold text-brand-700">
                  {formatMonth(highestMonth.month)} ({formatCurrency(highestMonth.total)})
                </span>
              </div>
            )}
          </div>

          {analytics.monthly.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Belum ada data riwayat pengeluaran bulanan.
            </div>
          ) : (
            <div className="pt-6">
              {/* Interactive Tooltip Banner */}
              <div className="h-8 flex items-center justify-center mb-2">
                {hoveredMonth ? (
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs px-3.5 py-1.5 rounded-full shadow-md fade-in">
                    <span className="font-semibold">{formatMonth(hoveredMonth.month)}:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(hoveredMonth.total)}</span>
                    <span className="text-slate-300">({hoveredMonth.count} invoice)</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Arahkan kursor ke grafik batang untuk melihat rincian
                  </span>
                )}
              </div>

              {/* Chart Grid */}
              <div className="relative pt-4 pb-2">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                </div>

                {/* Bars */}
                <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 relative z-10 px-2 sm:px-6">
                  {analytics.monthly.map((m) => {
                    const isMax = m.total === maxMonthVal;
                    const heightPercent = Math.max((m.total / maxMonthVal) * 100, 8);

                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(m)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        <div className="w-full flex items-end justify-center h-40">
                          <div
                            className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 group-hover:scale-105 ${
                              isMax
                                ? "bg-gradient-to-t from-brand-600 via-indigo-500 to-indigo-400 shadow-md shadow-brand-500/25 ring-2 ring-brand-300"
                                : "bg-gradient-to-t from-brand-400/70 to-indigo-300/80 group-hover:from-brand-500 group-hover:to-brand-400"
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium tracking-tight transition-colors ${
                            isMax
                              ? "text-brand-700 font-bold"
                              : "text-slate-500 group-hover:text-slate-900"
                          }`}
                        >
                          {formatMonth(m.month)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Vendors */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Top Vendor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Berdasarkan total nominal invoice</p>
            </div>
          </div>

          <div className="py-4 space-y-4 flex-1">
            {analytics.topVendors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Belum ada data vendor.</p>
            ) : (
              analytics.topVendors.map((v, idx) => {
                const maxVendorSpend = analytics.topVendors[0]?.total || 1;
                const percentShare = Math.round((v.total / maxVendorSpend) * 100);

                return (
                  <div
                    key={v.name}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : idx === 1
                              ? "bg-slate-100 text-slate-700 border border-slate-300"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={v.name}>
                            {v.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{v.count} invoice</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">
                        {formatCurrency(v.total)}
                      </span>
                    </div>

                    {/* Proportional Spend Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? "bg-gradient-to-r from-brand-600 to-indigo-400"
                            : "bg-slate-400"
                        }`}
                        style={{ width: `${percentShare}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href="/analytics"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100"
          >
            Lihat Analitik Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/40">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Invoice Terbaru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftar transaksi dan verifikasi terkini</p>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-3.5">No. Invoice</th>
                <th className="px-6 py-3.5">Vendor</th>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5 text-right">Total Transaksi</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => (window.location.href = `/invoices/${inv.id}`)}
                >
                  <td className="px-6 py-4 font-semibold text-brand-600 group-hover:text-brand-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                      <span>{inv.invoiceNumber || <span className="text-slate-300 font-normal">-</span>}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium truncate max-w-[220px]">
                    {inv.vendorName || <span className="text-slate-300 font-normal">Tanpa Nama Vendor</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                    {formatCurrency(inv.grandTotal, inv.currency)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={inv.reviewStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}