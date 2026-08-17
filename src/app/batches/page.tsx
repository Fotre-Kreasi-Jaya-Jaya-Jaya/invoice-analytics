"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/components/format";

type Batch = {
  id: string;
  name: string | null;
  status: string;
  storageMode: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  createdAt: string;
  _count: { documents: number };
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat daftar batch");
        return r.json();
      })
      .then((d) => setBatches(d.batches || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Poll every 3 seconds if any batch is still processing
  useEffect(() => {
    const hasProcessing = batches.some((b) => b.status === "UPLOADED" || b.status === "PROCESSING");
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetch("/api/batches")
        .then((r) => r.json())
        .then((d) => setBatches(d.batches || []))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [batches]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Riwayat Batch Upload
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar sesi pemrosesan berkas invoice massal
          </p>
        </div>
        <Link href="/upload" className="btn-primary btn-sm flex items-center gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Upload Batch Baru</span>
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Belum ada sesi batch upload</h3>
          <p className="text-slate-500 text-xs mt-1">Unggah beberapa file sekaligus untuk memproses invoice dalam satu sesi.</p>
          <Link href="/upload" className="btn-primary btn-sm mt-5 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Mulai Upload Sekarang
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b, i) => (
            <Link
              key={b.id}
              href={`/batches/${b.id}`}
              className="card-hover p-5 block group"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base truncate">
                      {b.name || `Batch ${formatDate(b.createdAt)}`}
                    </p>
                    {b.storageMode === "EPHEMERAL" && (
                      <span className="chip-amber text-[10px] font-bold">Ephemeral</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(b.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs flex-wrap">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {b._count.documents} berkas dokumen
                </span>
                {b.completedFiles > 0 && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {b.completedFiles} selesai
                  </span>
                )}
                {b.failedFiles > 0 && (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {b.failedFiles} gagal
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
