"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatDate } from "@/components/format";
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

  useEffect(() => {
    async function load() {
      try {
        const [aRes, iRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/invoices?limit=8"),
        ]);
        if (!aRes.ok || !iRes.ok) throw new Error("Gagal memuat data");
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
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="h-80 skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-2xl p-5 text-sm">
        {error}
      </div>
    );
  }

  if (!analytics || analytics.totalInvoices === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center slide-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 flex items-center justify-center text-3xl mb-5 shadow-sm">
          ▤
        </div>
        <h2 className="text-xl font-bold text-gray-900">Belum ada invoice</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Upload invoice pertama Anda untuk mulai analisis otomatis dengan AI.
        </p>
        <Link href="/upload" className="btn-primary mt-6 btn-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Invoice
        </Link>
      </div>
    );
  }

  const maxMonth = Math.max(...analytics.monthly.map((m) => m.total), 1);

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan analisis invoice</p>
        </div>
        <Link href="/upload" className="btn-primary btn-sm lg:btn">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Invoice" value={analytics.totalInvoices} sub="semua invoice" color="indigo" icon="▤" />
        <KpiCard title="Total Nilai" value={formatCurrency(analytics.totalAmount)} sub="seluruh invoice" color="emerald" icon="₿" />
        <KpiCard title="Total PPN" value={formatCurrency(analytics.totalVat)} sub="akumulasi PPN" color="sky" icon="％" />
        <KpiCard title="Perlu Review" value={analytics.needsReview} sub={`${analytics.withWarnings} invoice ada warning`} color={analytics.needsReview > 0 ? "rose" : "amber"} icon="!" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <div className="lg:col-span-2 card-section">
          <h3 className="font-semibold text-gray-900">Pengeluaran per Bulan</h3>
          {analytics.monthly.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data bulanan.</p>
          ) : (
            <div className="flex items-end gap-3 h-48 pt-2">
              {analytics.monthly.map((m, i) => (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1 group scale-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(m.total, "IDR").replace(",00", "")}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 hover:to-primary-300 transition-all cursor-pointer min-h-[4px]"
                    style={{
                      height: `${Math.max((m.total / maxMonth) * 150, 4)}px`,
                    }}
                  />
                  <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top vendors */}
        <div className="card-section">
          <h3 className="font-semibold text-gray-900">Top Vendor</h3>
          <div className="space-y-3">
            {analytics.topVendors.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data.</p>
            ) : (
              analytics.topVendors.map((v, idx) => (
                <div key={v.name} className="flex items-center gap-3 group hover:bg-gray-50 -mx-1 px-1 py-1 rounded-xl transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.count} invoice</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(v.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 lg:px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Invoice Terbaru</h3>
          <Link href="/invoices" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Lihat semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b bg-gray-50/50">
                <th className="px-5 lg:px-6 py-3 font-medium">No. Invoice</th>
                <th className="px-5 lg:px-6 py-3 font-medium">Vendor</th>
                <th className="px-5 lg:px-6 py-3 font-medium">Tanggal</th>
                <th className="px-5 lg:px-6 py-3 font-medium text-right">Total</th>
                <th className="px-5 lg:px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer scale-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => (window.location.href = `/invoices/${inv.id}`)}
                >
                  <td className="px-5 lg:px-6 py-3.5 font-medium text-primary-600">
                    {inv.invoiceNumber || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-5 lg:px-6 py-3.5 text-gray-700 truncate max-w-[200px]">
                    {inv.vendorName || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-5 lg:px-6 py-3.5 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-5 lg:px-6 py-3.5 text-right font-medium tabular-nums">
                    {formatCurrency(inv.grandTotal, inv.currency)}
                  </td>
                  <td className="px-5 lg:px-6 py-3.5">
                    <StatusBadge status={inv.reviewStatus} />
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