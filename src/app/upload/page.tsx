"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
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
  const [storageMode, setStorageMode] = useState("PERMANENT");
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

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
      if (!res.ok) throw new Error(data.error || "Gagal upload");

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
        <h1 className="text-xl font-bold text-gray-900">Upload Invoice</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload satu atau banyak invoice PDF untuk dianalisis AI
        </p>
      </div>

      {/* Storage mode */}
      <div className="card p-5">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={storageMode === "PERMANENT"}
              onChange={(e) => setStorageMode(e.target.checked ? "PERMANENT" : "EPHEMERAL")}
              className="peer sr-only"
            />
            <div className="w-10 h-6 rounded-full bg-gray-200 peer-checked:bg-primary-600 transition-colors duration-200 relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
              Simpan ke histori
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {storageMode === "PERMANENT"
                ? "Data invoice tersimpan dan muncul di analitik"
                : "Data otomatis dihapus setelah 24 jam, tidak muncul di histori"}
            </p>
          </div>
        </label>
        {storageMode === "EPHEMERAL" && (
          <div className="mt-3 bg-warning-50 border border-warning-500/20 text-warning-600 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 scale-in">
            <span>⚠</span>
            Data akan otomatis dihapus setelah 24 jam. Tidak muncul di histori atau analitik.
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-8 lg:p-12 text-center cursor-pointer transition-all duration-200 group ${
          dragOver
            ? "border-primary-500 bg-primary-50/50 scale-[1.01]"
            : "border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50/30"
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <div
          className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-110 ${
            dragOver ? "bg-primary-100 text-primary-600" : "bg-primary-50 text-primary-500"
          }`}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
          <span className="text-primary-600">Klik</span> atau{" "}
          <span className="text-primary-600">drag file</span> ke sini
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          PDF, maks 20 MB per file • ZIP didukung • drag folder juga bisa
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

      {/* File list */}
      {files.length > 0 && (
        <div className="card p-5 slide-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">
              {files.length} file <span className="text-gray-400">({sizeLabel})</span>
            </p>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg text-gray-300 group-hover:text-primary-500 transition-colors">▤</span>
                  <div className="truncate">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.status === "pending" && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-xs text-danger-600 hover:text-danger-700 font-medium hover:underline transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                  {f.status === "uploading" && (
                    <span className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                  )}
                  {f.status === "done" && (
                    <span className="text-success-600 text-sm scale-in">✓</span>
                  )}
                  {f.status === "error" && (
                    <span className="text-danger-600 text-xs max-w-[140px] truncate">
                      {f.error || "Gagal"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!uploading && !batchId && (
            <button onClick={handleUpload} className="btn-primary w-full mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload & Proses
            </button>
          )}

          {uploading && !batchId && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-500">
              <span className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              Mengupload & memproses...
            </div>
          )}

          {error && (
            <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2 scale-in">
              <span>!</span> {error}
            </div>
          )}
        </div>
      )}

      {/* Batch result */}
      {batchId && (
        <div className="card p-5 space-y-3 scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={batchStatus || "PROCESSING"} />
              <span className="text-sm text-gray-600">Batch: {batchId.slice(0, 8)}...</span>
            </div>
            <button onClick={viewBatch} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Lihat detail →
            </button>
          </div>
          {batchStatus && !["COMPLETED", "PARTIAL", "FAILED"].includes(batchStatus) && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          )}
          {batchStatus === "COMPLETED" && (
            <p className="text-sm text-success-700 font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-success-50 text-success-600 flex items-center justify-center text-xs">✓</span>
              Semua invoice berhasil diproses!
            </p>
          )}
          {batchStatus === "PARTIAL" && (
            <p className="text-sm text-warning-600 font-medium flex items-center gap-2">
              <span>⚠</span> Beberapa invoice gagal diproses.
            </p>
          )}
        </div>
      )}
    </div>
  );
}