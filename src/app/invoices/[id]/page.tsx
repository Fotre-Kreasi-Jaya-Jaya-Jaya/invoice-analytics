"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  CheckCircle2,
  Bot,
  RefreshCw,
  Trash2,
  Save,
  X,
  AlertTriangle,
  FileCheck2,
  Receipt,
  Building,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/components/format";
import PdfViewer from "@/components/PdfViewer";
import CopilotDrawer from "@/components/CopilotDrawer";

type Invoice = any;

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Invoice tidak ditemukan");
      const data = await res.json();
      setInvoice(data.invoice);
      setForm(data.invoice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      await load();
      setEditing(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markReviewed() {
    const res = await fetch(`/api/invoices/${id}/review`, { method: "POST" });
    if (res.ok) await load();
  }

  async function reanalyze() {
    if (!confirm("Analisis ulang akan memproses ulang OCR dan ekstraksi AI. Lanjutkan?")) return;
    const res = await fetch(`/api/invoices/${id}/reanalyze`, { method: "POST" });
    if (res.ok) router.push(`/batches/${invoice.document.batchId}`);
  }

  async function remove() {
    if (!confirm("Hapus invoice ini secara permanen?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/invoices");
  }

  if (loading) {
    return <div className="h-[calc(100vh-100px)] skeleton" />;
  }

  if (error || !invoice) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-rose-600" />
        <p>{error || "Invoice tidak ditemukan."}</p>
      </div>
    );
  }

  const fields = [
    { key: "invoiceNumber", label: "No. Invoice", type: "text" },
    { key: "invoiceDate", label: "Tanggal Invoice", type: "date" },
    { key: "dueDate", label: "Jatuh Tempo", type: "date" },
    { key: "poNumber", label: "No. Purchase Order (PO)", type: "text" },
    { key: "vendorName", label: "Nama Vendor", type: "text" },
    { key: "vendorTaxId", label: "NPWP Vendor", type: "text" },
    { key: "buyerName", label: "Nama Pembeli", type: "text" },
    { key: "buyerTaxId", label: "NPWP Pembeli", type: "text" },
  ];

  const moneyFields = [
    { key: "subtotal", label: "Subtotal" },
    { key: "discount", label: "Diskon" },
    { key: "dpp", label: "DPP" },
    { key: "vatAmount", label: "PPN" },
    { key: "withholdingTaxAmount", label: "PPh" },
    { key: "grandTotal", label: "Grand Total" },
    { key: "downPaymentAmount", label: "Down Payment (DP)" },
    { key: "remainingAmount", label: "Sisa Pembayaran" },
  ];

  return (
    <div className="space-y-4 slide-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <Link
              href="/invoices"
              className="text-slate-400 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Daftar Invoice
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">{invoice.invoiceNumber || "Tanpa Nomor"}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {invoice.vendorName || invoice.document.originalName}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={invoice.reviewStatus} />

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary btn-sm flex items-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(invoice);
                }}
                className="btn-ghost btn-sm flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary btn-sm flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Menyimpan..." : "Simpan"}</span>
              </button>
            </>
          )}

          <button
            onClick={markReviewed}
            className="btn-success btn-sm flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tandai Selesai</span>
          </button>

          <button
            onClick={() => setCopilotOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5 shadow-xs bg-gradient-to-r from-brand-600 to-indigo-600"
          >
            <Bot className="w-4 h-4" />
            <span>Tanya AI</span>
          </button>
        </div>
      </div>

      {/* Split Viewer & Metadata */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[700px]">
        {/* PDF Document Preview */}
        <div className="h-[650px] xl:h-[calc(100vh-140px)] xl:sticky xl:top-20 xl:self-start rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900">
          <PdfViewer src={`/api/documents/${invoice.documentId}/file`} />
        </div>

        {/* Structured Data Editor */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {/* Main Info */}
          <Section title="Informasi Faktur / Invoice" icon={Receipt}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  value={form[f.key]}
                  editing={editing}
                  type={f.type}
                  onChange={(v) => setForm({ ...form, [f.key]: v })}
                />
              ))}
            </div>
          </Section>

          {/* Line Items */}
          <Section title={`Rincian Item (${invoice.lineItems?.length || 0})`} icon={FileCheck2}>
            {invoice.lineItems?.length > 0 ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2.5 pr-3">Item / Deskripsi</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.lineItems.map((li: any) => (
                      <tr key={li.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-3 text-slate-800 font-medium">{li.description || "-"}</td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                          {li.quantity || "-"} {li.unit || ""}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                          {formatCurrency(li.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-3 pl-3 text-right font-bold tabular-nums text-slate-900">
                          {formatCurrency(li.lineTotal, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-2">Tidak ada rincian item spesifik.</p>
            )}
          </Section>

          {/* Tax & Totals */}
          <Section title="Rekapitulasi Pajak & Total" icon={CreditCard}>
            <div className="space-y-1">
              {moneyFields.map((f) => (
                <div
                  key={f.key}
                  className={`flex items-center justify-between py-2 ${
                    f.key === "grandTotal"
                      ? "border-t-2 border-slate-200 mt-2 pt-3 bg-slate-50/50 -mx-6 px-6 rounded-b-xl"
                      : "border-b border-slate-50"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      f.key === "grandTotal" ? "font-bold text-slate-900" : "text-slate-500 font-medium"
                    }`}
                  >
                    {f.label}
                  </span>
                  {editing ? (
                    <input
                      type="number"
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-44 text-right rounded-lg border px-2 py-1 text-sm font-semibold"
                    />
                  ) : (
                    <span
                      className={`tabular-nums ${
                        f.key === "grandTotal"
                          ? "text-xl font-bold text-slate-900"
                          : "text-sm font-semibold text-slate-700"
                      }`}
                    >
                      {formatCurrency(invoice[f.key], invoice.currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Payment Terms */}
          <Section title="Informasi Rekening & Termin" icon={Building}>
            <div className="space-y-2.5 text-sm">
              <InfoRow label="Termin Pembayaran" value={invoice.paymentTerms || "-"} />
              <InfoRow label="Bank Penerima" value={invoice.bankName || "-"} />
              <InfoRow label="Nama Pemilik Rekening" value={invoice.bankAccountName || "-"} />
              <InfoRow label="Nomor Rekening" value={invoice.bankAccountNumber || "-"} />
            </div>
          </Section>

          {/* Validation & Warning Section */}
          <Section title={`Validasi & Kejanggalan (${invoice.validationIssues?.length || 0})`} icon={AlertCircle}>
            {invoice.validationIssues?.length > 0 ? (
              <div className="space-y-2.5">
                {invoice.validationIssues.map((issue: any) => (
                  <div
                    key={issue.id}
                    className={`rounded-xl border p-3.5 scale-in ${
                      issue.severity === "ERROR"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : issue.severity === "WARNING"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-sky-50 border-sky-200 text-sky-900"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{issue.title}</p>
                        <p className="text-xs opacity-80 mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Semua kalkulasi matematis dan NPWP tervalidasi konsisten.</span>
              </div>
            )}
          </Section>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 pb-6 text-sm">
            <button
              onClick={reanalyze}
              className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1.5 hover:underline transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Analisis Ulang Dokumen
            </button>
            <button
              onClick={remove}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 hover:underline transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Hapus Invoice
            </button>
          </div>
        </div>
      </div>

      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} invoiceId={id} />
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 lg:p-6 space-y-3.5">
      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
        {Icon && <Icon className="w-4 h-4 text-brand-600" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  editing,
  type,
  onChange,
}: {
  label: string;
  value: any;
  editing: boolean;
  type?: string;
  onChange: (v: any) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 block mb-1 font-medium">{label}</label>
      {editing ? (
        <input
          type={type || "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="input !py-1.5 w-full text-sm"
        />
      ) : (
        <p className="text-sm text-slate-800 font-semibold">{value || <span className="text-slate-300">-</span>}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 text-xs font-medium">{label}</span>
      <span className="text-slate-800 text-right font-semibold text-xs">{value}</span>
    </div>
  );
}
