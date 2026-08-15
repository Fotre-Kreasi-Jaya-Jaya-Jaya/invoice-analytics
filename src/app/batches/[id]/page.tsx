"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      .then(r => { if (!r.ok) throw new Error("Batch tidak ditemukan"); return r.json(); })
      .then(d => setData(d.batch))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-60 skeleton" />;
  if (error || !data) return <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-2xl p-6">{error}</div>;

  const totalAmount = data.documents.reduce((s: number, d: any) => s + (Number(d.invoice?.grandTotal) || 0), 0);
  const completedCount = data.documents.filter((d: any) => d.status === "COMPLETED").length;
  const failedCount = data.documents.filter((d: any) => d.status === "FAILED").length;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm">
            <Link href="/batches" className="text-gray-400 hover:text-gray-600 transition-colors">← Batch</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600">{data.name || `Batch ${formatDate(data.createdAt)}`}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{data.name || "Detail Batch"}</h1>
          <div className="flex gap-3 mt-1 text-sm text-gray-500 flex-wrap items-center">
            <span>{formatDate(data.createdAt)}</span>
            <span>•</span>
            <span>{data.documents.length} file</span>
            {data.storageMode === "EPHEMERAL" && <span className="chip-amber text-xs">Ephemeral</span>}
          </div>
        </div>
        <button onClick={() => setCopilotOpen(true)} className="btn-primary btn-sm self-start">
          <span className="text-base leading-none">💬</span> Tanya Semua Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 group">
          <p className="text-xs text-gray-400 font-medium">Total File</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{data.documents.length}</p>
        </div>
        <div className="card p-4 group">
          <p className="text-xs text-gray-400 font-medium">Selesai</p>
          <p className="text-2xl font-bold text-success-600 mt-1 tabular-nums">{completedCount}</p>
        </div>
        <div className="card p-4 group">
          <p className="text-xs text-gray-400 font-medium">Gagal</p>
          <p className="text-2xl font-bold text-danger-600 mt-1 tabular-nums">{failedCount}</p>
        </div>
        <div className="card p-4 group">
          <p className="text-xs text-gray-400 font-medium">Total Nilai</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Docs */}
      <div className="card overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Daftar Dokumen</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {data.documents.map((doc: any, i: number) => (
            <div key={doc.id} className="px-5 lg:px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors" style={{ animationDelay: `${i*30}ms` }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-300 text-lg">▤</span>
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.originalName}</p>
                  {doc.invoice?.invoiceNumber && (
                    <p className="text-xs text-gray-400">{doc.invoice.vendorName || "-"} • {doc.invoice.invoiceNumber}</p>
                  )}
                  {doc.status === "FAILED" && doc.errorMessage && (
                    <p className="text-xs text-danger-500">{doc.errorMessage}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {doc.invoice?.grandTotal && (
                  <span className="text-sm font-medium text-gray-700 tabular-nums">{formatCurrency(doc.invoice.grandTotal)}</span>
                )}
                <StatusBadge status={doc.status} />
                {doc.status === "COMPLETED" && doc.invoice && (
                  <Link href={`/invoices/${doc.invoice.id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    Lihat →
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
