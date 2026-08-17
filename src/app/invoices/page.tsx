"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
} from "lucide-react";
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
        if (!res.ok) throw new Error("Gagal memuat data invoice");
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
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Daftar Invoice
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ditemukan <span className="font-semibold text-slate-800">{total}</span> total invoice terdaftar
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`/api/export?format=csv${status ? `&status=${status}` : ""}`}
            className="btn-secondary btn-sm flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <Link href="/upload" className="btn-primary btn-sm flex items-center gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Upload Invoice</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor invoice, nama vendor, atau kata kunci..."
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="">Semua Status Review</option>
            <option value="PENDING">Menunggu Review</option>
            <option value="NEEDS_REVIEW">Perlu Review / Anomali</option>
            <option value="REVIEWED">Sudah Direview</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak ada invoice ditemukan</h3>
          <p className="text-slate-500 text-xs mt-1">Coba ganti filter atau upload dokumen invoice baru.</p>
          <Link href="/upload" className="btn-primary btn-sm mt-5 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Upload Dokumen
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-3.5">No. Invoice</th>
                  <th className="px-6 py-3.5">Vendor</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5 text-right">Total Nominal</th>
                  <th className="px-6 py-3.5 text-center">Isu / Warning</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => (window.location.href = `/invoices/${inv.id}`)}
                  >
                    <td className="px-6 py-4 font-semibold text-brand-600 group-hover:text-brand-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                        <span>{inv.invoiceNumber || <span className="text-slate-300 font-normal">-</span>}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium truncate max-w-[200px]">
                      {inv.vendorName || <span className="text-slate-300 font-normal">Tanpa Vendor</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {inv.invoiceType ? inv.invoiceType.replace(/_/g, " ") : "STANDARD"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inv._count.validationIssues > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {inv._count.validationIssues}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal text-xs">Aman</span>
                      )}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Menampilkan halaman <span className="font-semibold text-slate-800">{page}</span> dari {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary btn-sm !p-1.5 disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary btn-sm !p-1.5 disabled:opacity-40"
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}