"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatDate } from "@/components/format";

type Analytics = {
  totalInvoices: number; totalAmount: number; totalVat: number;
  needsReview: number; withWarnings: number;
  topVendors: { name: string; count: number; total: number }[];
  monthly: { month: string; count: number; total: number }[];
  typeDistribution: { type: string; count: number }[];
  upcomingDue: { invoiceNumber: string | null; vendorName: string | null; dueDate: string | null; grandTotal: number | null }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="h-28 skeleton" />)}</div>;
  if (!data) return <p className="text-gray-500">Gagal memuat analitik.</p>;

  return (
    <div className="space-y-6 slide-up">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analitik</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan analisis lintas invoice</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Invoice" value={data.totalInvoices} color="indigo" icon="▤" />
        <KpiCard title="Total Nilai" value={formatCurrency(data.totalAmount)} color="emerald" icon="₿" />
        <KpiCard title="Total PPN" value={formatCurrency(data.totalVat)} color="sky" icon="％" />
        <KpiCard title="Perlu Review" value={data.needsReview} color={data.needsReview > 0 ? "rose" : "amber"} icon="!" />
      </div>

      {/* Vendors */}
      <div className="card-section">
        <h3 className="font-semibold text-gray-900">Top Vendor</h3>
        {data.topVendors.length === 0 ? <p className="text-sm text-gray-400">Belum ada data vendor.</p> : (
          <div className="space-y-3">
            {data.topVendors.map((v, i) => {
              const max = data.topVendors[0]?.total || 1;
              return (
                <div key={v.name} className="flex items-center gap-4">
                  <span className="w-6 text-xs font-semibold text-gray-400 text-center">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 truncate">{v.name}</span>
                      <span className="tabular-nums text-gray-600 font-medium">{formatCurrency(v.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500" style={{ width: `${(v.total/max)*100}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{v.count} invoice</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly */}
      <div className="card-section">
        <h3 className="font-semibold text-gray-900">Pengeluaran per Bulan</h3>
        {data.monthly.length === 0 ? <p className="text-sm text-gray-400">Belum ada data bulanan.</p> : (
          <div className="space-y-2.5">
            {data.monthly.map(m => {
              const max = Math.max(...data.monthly.map(x => x.total), 1);
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="w-14 text-xs text-gray-400 font-medium">{m.month.slice(5)}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg transition-all duration-500" style={{ width: `${(m.total/max)*100}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-gray-600 font-medium w-28 text-right">{formatCurrency(m.total)}</span>
                  <span className="text-xs text-gray-400 w-12 text-right">{m.count} inv</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type dist */}
        <div className="card-section">
          <h3 className="font-semibold text-gray-900">Distribusi Tipe Invoice</h3>
          {data.typeDistribution.length === 0 ? <p className="text-sm text-gray-400">Belum ada data.</p> : (
            <div className="space-y-2.5">
              {data.typeDistribution.map(t => {
                const max = Math.max(...data.typeDistribution.map(x => x.count), 1);
                return (
                  <div key={t.type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-32 truncate">{t.type.replace(/_/g," ")}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" style={{ width: `${(t.count/max)*100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right tabular-nums">{t.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Due dates */}
        <div className="card-section">
          <h3 className="font-semibold text-gray-900">Jatuh Tempo Mendatang</h3>
          {data.upcomingDue.length === 0 ? <p className="text-sm text-gray-400">Tidak ada jatuh tempo mendatang.</p> : (
            <div className="space-y-3">
              {data.upcomingDue.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{d.vendorName || "-"}</p>
                    <p className="text-xs text-gray-400">{d.invoiceNumber || "-"}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-warning-600 font-medium">{formatDate(d.dueDate)}</p>
                    <p className="text-xs tabular-nums text-gray-600">{d.grandTotal ? formatCurrency(d.grandTotal) : "-"}</p>
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
