"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

type FileInfo = {
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [storageMode, setStorageMode] = useState<"PERMANENT" | "EPHEMERAL">("PERMANENT");
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const isPermanent = storageMode === "PERMANENT";

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function addFiles(newFiles: FileList) {
    const list: FileInfo[] = [];
    const raw: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      list.push({ name: f.name, size: f.size, status: "pending" });
      raw.push(f);
    }
    setFiles((prev) => [...prev, ...list]);
    setRawFiles((prev) => [...prev, ...raw]);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setRawFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (rawFiles.length === 0) return;
    setUploading(true);
    setError("");
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    try {
      const formData = new FormData();
      formData.append("storageMode", storageMode);
      formData.append("sourceType", "multiple");
      for (const f of rawFiles) {
        formData.append("files", f);
      }

      const res = await fetch("/api/batches", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah dokumen");

      setBatchId(data.batchId);
      setBatchStatus("PROCESSING");
      setFiles((prev) => prev.map((f) => ({ ...f, status: "done" })));

      pollingRef.current = setInterval(async () => {
        try {
          const bRes = await fetch(`/api/batches/${data.batchId}`);
          if (bRes.ok) {
            const bData = await bRes.json();
            setBatchStatus(bData.batch.status);
            if (["COMPLETED", "PARTIAL", "FAILED"].includes(bData.batch.status)) {
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }
        } catch {}
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: err.message })));
      setUploading(false);
    }
  }

  function viewBatch() {
    if (batchId) router.push(`/batches/${batchId}`);
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const sizeLabel =
    totalSize > 1024 * 1024
      ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalSize / 1024).toFixed(0)} KB`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Upload & Analisis Invoice
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Unggah dokumen PDF atau ZIP untuk ekstraksi data otomatis dengan AI Vision
        </p>
      </div>

      {/* Storage Mode Toggle */}
      <div className="card p-5">
        <div
          onClick={() => setStorageMode(isPermanent ? "EPHEMERAL" : "PERMANENT")}
          className="flex items-start gap-3.5 cursor-pointer select-none group"
        >
          <div className="relative mt-0.5 shrink-0">
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out p-0.5 ${
                isPermanent ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isPermanent ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Simpan Permanen ke Histori & Analitik
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {isPermanent
                ? "Data invoice dienkripsi dan disimpan secara permanen untuk analisis agregasi dan rekapitulasi."
                : "Mode Ephemeral (Anonim): Data otomatis terhapus dari server setelah 24 jam."}
            </p>
          </div>
        </div>
        {!isPermanent && (
          <div className="mt-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 scale-in font-medium">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Data dokumen hanya aktif selama 24 jam untuk privasi maksimal.</span>
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-8 lg:p-12 text-center cursor-pointer transition-all duration-200 group ${
          dragOver
            ? "border-brand-500 bg-brand-50/60 scale-[1.01]"
            : "border-slate-200 bg-white hover:border-brand-400 hover:bg-slate-50/80"
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <div
          className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${
            dragOver
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/30"
              : "bg-brand-50 text-brand-600 border border-brand-100"
          }`}
        >
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-base font-semibold text-slate-800">
          <span className="text-brand-600 hover:underline">Klik untuk memilih file</span> atau tarik berkas ke area ini
        </p>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Mendukung format PDF atau file arsip ZIP (Maksimal 20 MB per berkas)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.zip"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card p-5 slide-up space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              Daftar Antrean ({files.length} Berkas)
            </p>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {sizeLabel}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <FileText className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {f.status === "pending" && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {f.status === "uploading" && (
                    <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                  )}
                  {f.status === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 scale-in" />
                  )}
                  {f.status === "error" && (
                    <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {f.error || "Gagal"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!uploading && !batchId && (
            <button
              onClick={handleUpload}
              className="btn-primary w-full mt-3 py-3 font-bold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Unggah & Mulai Ekstraksi AI
            </button>
          )}

          {uploading && !batchId && (
            <div className="mt-4 flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-600 p-3 bg-slate-50 rounded-xl">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
              <span>Mengunggah dokumen dan mempersiapkan model OCR...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3 flex items-center gap-2 scale-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Result */}
      {batchId && (
        <div className="card p-6 space-y-4 scale-in border-brand-200 bg-gradient-to-b from-brand-50/30 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={batchStatus || "PROCESSING"} />
              <span className="text-xs font-semibold text-slate-600">ID Batch: {batchId.slice(0, 10)}...</span>
            </div>
            <button
              onClick={viewBatch}
              className="btn-primary btn-sm flex items-center gap-1 shadow-xs"
            >
              <span>Pantau Proses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {batchStatus && !["COMPLETED", "PARTIAL", "FAILED"].includes(batchStatus) && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full animate-pulse w-2/3" />
            </div>
          )}

          {batchStatus === "COMPLETED" && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Semua invoice dalam batch ini telah berhasil diekstraksi dan divalidasi!
            </p>
          )}

          {batchStatus === "PARTIAL" && (
            <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Beberapa dokumen membutuhkan peninjauan manual atau resolusi gambar lebih tinggi.
            </p>
          )}
        </div>
      )}
    </div>
  );
}