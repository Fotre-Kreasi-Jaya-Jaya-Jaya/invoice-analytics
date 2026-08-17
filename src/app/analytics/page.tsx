"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Wallet,
  Receipt,
  AlertTriangle,
  Building2,
  Calendar,
  PieChart,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatDate, formatMonth } from "@/components/format";

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

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 skeleton" />
          <div className="h-72 skeleton" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 card">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p>Gagal memuat analitik.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Analitik Mendalam
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Eksplorasi agregasi pengeluaran, distribusi vendor, dan jadwal jatuh tempo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoice"
          value={data.totalInvoices.toLocaleString("id-ID")}
          sub="Semua dokumen aktif"
          color="brand"
          icon={FileText}
        />
        <KpiCard
          title="Total Nilai"
          value={formatCurrency(data.totalAmount)}
          sub="Akumulasi seluruh transaksi"
          color="success"
          icon={Wallet}
        />
        <KpiCard
          title="Total PPN"
          value={formatCurrency(data.totalVat)}
          sub="Akumulasi PPN terdata"
          color="purple"
          icon={Receipt}
        />
        <KpiCard
          title="Perlu Review"
          value={data.needsReview}
          sub={
            data.withWarnings > 0
              ? `${data.withWarnings} invoice berpotensi anomali`
              : "Semua data tervalidasi"
          }
          color={data.needsReview > 0 ? "danger" : "warning"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Top Vendor
            </h3>
            <span className="text-xs text-slate-400 font-medium">Berdasarkan Total Nilai</span>
          </div>
          {data.topVendors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data vendor.</p>
          ) : (
            <div className="space-y-4">
              {data.topVendors.map((v, i) => {
                const max = data.topVendors[0]?.total || 1;
                const pct = Math.round((v.total / max) * 100);
                return (
                  <div key={v.name} className="flex items-center gap-4">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        i === 0
                          ? "bg-amber-100 text-amber-800"
                          : i === 1
                          ? "bg-slate-200 text-slate-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-slate-800 truncate">{v.name}</span>
                        <span className="tabular-nums text-slate-900 font-bold">{formatCurrency(v.total)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{v.count} invoice terbit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Breakdown */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Pengeluaran per Bulan
            </h3>
            <span className="text-xs text-slate-400 font-medium">Riwayat Nominal</span>
          </div>
          {data.monthly.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data bulanan.</p>
          ) : (
            <div className="space-y-3.5">
              {data.monthly.map((m) => {
                const max = Math.max(...data.monthly.map((x) => x.total), 1);
                const pct = Math.max((m.total / max) * 100, 4);
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-slate-600 font-semibold">{formatMonth(m.month)}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-lg transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-slate-800 font-bold w-32 text-right">
                      {formatCurrency(m.total)}
                    </span>
                    <span className="text-xs text-slate-400 w-12 text-right">{m.count} inv</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Distribusi Tipe Invoice
            </h3>
            <span className="text-xs text-slate-400 font-medium">Kategori Dokumen</span>
          </div>
          {data.typeDistribution.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada data tipe invoice.</p>
          ) : (
            <div className="space-y-3.5">
              {data.typeDistribution.map((t) => {
                const max = Math.max(...data.typeDistribution.map((x) => x.count), 1);
                const pct = (t.count / max) * 100;
                return (
                  <div key={t.type} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-700 w-36 truncate capitalize">
                      {t.type.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-10 text-right tabular-nums">
                      {t.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Due Dates */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-600" />
              Jatuh Tempo Mendatang
            </h3>
            <span className="text-xs text-slate-400 font-medium">Jadwal Pembayaran</span>
          </div>
          {data.upcomingDue.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Tidak ada jatuh tempo mendatang.</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingDue.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{d.vendorName || "Tanpa Vendor"}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      {d.invoiceNumber || "-"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {formatDate(d.dueDate)}
                    </p>
                    <p className="text-xs font-bold tabular-nums text-slate-900 mt-1">
                      {d.grandTotal ? formatCurrency(d.grandTotal) : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
