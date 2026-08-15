"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/components/format";

type Batch = {
  id: string; name: string | null; status: string; storageMode: string;
  totalFiles: number; completedFiles: number; failedFiles: number;
  createdAt: string; _count: { documents: number };
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/batches")
      .then(r => { if (!r.ok) throw new Error("Gagal memuat"); return r.json(); })
      .then(d => setBatches(d.batches || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-24 skeleton" />)}</div>;
  if (error) return <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-2xl p-4 text-sm">{error}</div>;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Batch</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat upload invoice</p>
        </div>
        <Link href="/upload" className="btn-primary btn-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Upload</Link>
      </div>

      {batches.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">▣</div>
          <p className="text-gray-500 text-sm">Belum ada batch upload.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b, i) => (
            <Link key={b.id} href={`/batches/${b.id}`}
              className="card-hover p-5 block group"
              style={{ animationDelay: `${i*40}ms` }}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors truncate">{b.name || `Batch ${formatDate(b.createdAt)}`}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(b.createdAt)}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex gap-4 mt-3 text-sm flex-wrap">
                <span className="text-gray-500">{b._count.documents} file</span>
                {b.completedFiles > 0 && <span className="text-success-600 font-medium">{b.completedFiles} selesai</span>}
                {b.failedFiles > 0 && <span className="text-danger-600 font-medium">{b.failedFiles} gagal</span>}
                {b.storageMode === "EPHEMERAL" && <span className="chip-amber text-xs">Ephemeral</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
