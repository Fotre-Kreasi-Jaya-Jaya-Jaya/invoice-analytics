export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    COMPLETED: { label: "Selesai", cls: "chip-green", dot: "bg-success-500" },
    PROCESSING: { label: "Memproses", cls: "chip-sky", dot: "bg-sky-500 animate-pulse" },
    UPLOADED: { label: "Diupload", cls: "chip-slate", dot: "bg-slate-400" },
    EXTRACTING: { label: "Ekstraksi", cls: "chip-sky", dot: "bg-sky-500 animate-pulse" },
    OCR: { label: "OCR", cls: "chip-violet", dot: "bg-violet-500 animate-pulse" },
    ANALYZING: { label: "Analisis AI", cls: "chip-indigo", dot: "bg-primary-500 animate-pulse" },
    VALIDATING: { label: "Validasi", cls: "chip-amber", dot: "bg-warning-500 animate-pulse" },
    FAILED: { label: "Gagal", cls: "chip-rose", dot: "bg-danger-500" },
    PARTIAL: { label: "Sebagian", cls: "chip-amber", dot: "bg-warning-500" },
    PENDING: { label: "Belum direview", cls: "chip-amber", dot: "bg-warning-500" },
    NEEDS_REVIEW: { label: "Perlu review", cls: "chip-rose", dot: "bg-danger-500" },
    REVIEWED: { label: "Sudah direview", cls: "chip-green", dot: "bg-success-500" },
  };
  const s = map[status] || {
    label: status,
    cls: "chip-slate",
    dot: "bg-slate-400",
  };
  return (
    <span className={s.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
