"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/components/format";

type Invoice = {
  id: string;
  invoiceNumber: string | null;
  vendorName: string | null;
  invoiceDate: string | null;
  grandTotal: number | null;
  reviewStatus: string;
  currency: string;
  invoiceType: string | null;
  document: { originalName: string };
  _count: { validationIssues: number };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const res = await fetch(`/api/invoices?${params}`);
        if (!res.ok) throw new Error("Gagal memuat data");
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, search, status]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoice</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} invoice ditemukan</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/export?format=csv${status ? `&status=${status}` : ""}`}
            className="btn-secondary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
          <Link href="/upload" className="btn-primary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nomor invoice atau vendor..."
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Semua status</option>
          <option value="PENDING">Belum direview</option>
          <option value="NEEDS_REVIEW">Perlu review</option>
          <option value="REVIEWED">Sudah direview</option>
        </select>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-2xl p-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">▤</div>
          <p className="text-gray-500 text-sm">Tidak ada invoice.</p>
          <Link href="/upload" className="btn-primary btn-sm mt-4 inline-flex">Upload Invoice</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b bg-gray-50/50">
                  <th className="px-5 py-3 font-medium">No. Invoice</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Tipe</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Warning</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 25}ms` }}
                    onClick={() => (window.location.href = `/invoices/${inv.id}`)}
                  >
                    <td className="px-5 py-3.5 font-medium text-primary-600">{inv.invoiceNumber || <span className="text-gray-300">-</span>}</td>
                    <td className="px-5 py-3.5 text-gray-700 truncate max-w-[180px]">{inv.vendorName || <span className="text-gray-300">-</span>}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{inv.invoiceType || "-"}</span></td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums">{formatCurrency(inv.grandTotal, inv.currency)}</td>
                    <td className="px-5 py-3.5">
                      {inv._count.validationIssues > 0 ? (
                        <span className="chip-amber">{inv._count.validationIssues}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.reviewStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-xs text-gray-400">Hal {page} dari {totalPages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost btn-sm !rounded-lg">←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost btn-sm !rounded-lg">→</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}