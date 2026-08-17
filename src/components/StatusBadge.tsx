import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
  > = {
    COMPLETED: {
      label: "Selesai",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    REVIEWED: {
      label: "Sudah Review",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    PROCESSING: {
      label: "Diproses",
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
      dot: "bg-sky-500",
      pulse: true,
    },
    UPLOADED: {
      label: "Diunggah",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      dot: "bg-indigo-500",
      pulse: true,
    },
    EXTRACTING: {
      label: "Ekstraksi",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      dot: "bg-indigo-500",
      pulse: true,
    },
    ANALYZING: {
      label: "Analisis AI",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
      pulse: true,
    },
    VALIDATING: {
      label: "Validasi",
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
      dot: "bg-sky-500",
      pulse: true,
    },
    OCR: {
      label: "OCR",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
      pulse: true,
    },
    FAILED: {
      label: "Gagal",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
    },
    NEEDS_REVIEW: {
      label: "Perlu Review",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    PARTIAL: {
      label: "Sebagian",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    PENDING: {
      label: "Menunggu",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const s = map[status] || {
    label: status ? status.replace(/_/g, " ") : "Unknown",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border} whitespace-nowrap shadow-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
      <span>{s.label}</span>
    </span>
  );
}