"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Layers,
  ArrowRight,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/components/format";
import CopilotDrawer from "@/components/CopilotDrawer";

type BatchDetail = any;

export default function BatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/batches/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Batch tidak ditemukan");
        return r.json();
      })
      .then((d) => setData(d.batch))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll every 2 seconds while batch is processing
  useEffect(() => {
    if (!id || !data) return;
    if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "PARTIAL") return;
    const interval = setInterval(() => {
      fetch(`/api/batches/${id}`)
        .then((r) => r.json())
        .then((d) => setData(d.batch))
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [id, data?.status]);

  if (loading) {
    return <div className="h-60 skeleton" />;
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>{error || "Batch tidak ditemukan."}</p>
      </div>
    );
  }

  const totalAmount = data.documents.reduce(
    (s: number, d: any) => s + (Number(d.invoice?.grandTotal) || 0),
    0
  );
  const completedCount = data.documents.filter((d: any) => d.status === "COMPLETED").length;
  const failedCount = data.documents.filter((d: any) => d.status === "FAILED").length;

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <Link
              href="/batches"
              className="text-slate-400 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Riwayat Batch
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">{data.name || `Batch ${formatDate(data.createdAt)}`}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {data.name || "Detail Sesi Batch"}
          </h1>
          <div className="flex gap-3 mt-1.5 text-xs text-slate-500 flex-wrap items-center">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(data.createdAt)}
            </span>
            <span>&bull;</span>
            <span>{data.documents.length} berkas</span>
            {data.storageMode === "EPHEMERAL" && (
              <span className="chip-amber text-[10px] font-bold">Ephemeral (24 Jam)</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5 shadow-xs"
          >
            <Bot className="w-4 h-4" />
            <span>Tanya AI</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 group border-slate-200">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Berkas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{data.documents.length}</p>
        </div>
        <div className="card p-5 group border-slate-200">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Selesai Ekstraksi</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{completedCount}</p>
        </div>
        <div className="card p-5 group border-slate-200">
          <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Gagal</p>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{failedCount}</p>
        </div>
        <div className="card p-5 group border-slate-200">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider">Total Nilai Batch</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">Daftar Dokumen dalam Batch</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {data.documents.map((doc: any, i: number) => (
            <div
              key={doc.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText className="w-4 h-4 text-brand-600" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{doc.originalName}</p>
                  {doc.invoice?.invoiceNumber && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {doc.invoice.vendorName || "Tanpa Vendor"} &bull; {doc.invoice.invoiceNumber}
                    </p>
                  )}
                  {doc.status === "FAILED" && doc.errorMessage && (
                    <p className="text-xs text-rose-600 mt-0.5 font-medium">{doc.errorMessage}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {doc.invoice?.grandTotal && (
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(doc.invoice.grandTotal)}
                  </span>
                )}
                <StatusBadge status={doc.status} />
                {doc.status === "COMPLETED" && doc.invoice && (
                  <Link
                    href={`/invoices/${doc.invoice.id}`}
                    className="btn-secondary btn-sm !p-1.5 hover:text-brand-600"
                    title="Buka Invoice"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} batchId={id} />
    </div>
  );
}
