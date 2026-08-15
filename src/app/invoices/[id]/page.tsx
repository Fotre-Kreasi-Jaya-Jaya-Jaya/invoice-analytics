"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
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
    if (!confirm("Analisis ulang akan mengganti hasil ekstraksi saat ini. Lanjutkan?")) return;
    const res = await fetch(`/api/invoices/${id}/reanalyze`, { method: "POST" });
    if (res.ok) router.push(`/batches/${invoice.document.batchId}`);
  }

  async function remove() {
    if (!confirm("Hapus invoice ini? Tindakan ini tidak dapat dibatalkan.")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/invoices");
  }

  if (loading) return <div className="h-[calc(100vh-100px)] skeleton" />;
  if (error || !invoice) return <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-2xl p-6">{error}</div>;

  const fields = [
    { key: "invoiceNumber", label: "No. Invoice", type: "text" },
    { key: "invoiceDate", label: "Tanggal Invoice", type: "date" },
    { key: "dueDate", label: "Jatuh Tempo", type: "date" },
    { key: "poNumber", label: "No. PO", type: "text" },
    { key: "vendorName", label: "Vendor", type: "text" },
    { key: "vendorTaxId", label: "NPWP Vendor", type: "text" },
    { key: "buyerName", label: "Pembeli", type: "text" },
    { key: "buyerTaxId", label: "NPWP Pembeli", type: "text" },
  ];

  const moneyFields = [
    { key: "subtotal", label: "Subtotal" },
    { key: "discount", label: "Diskon" },
    { key: "dpp", label: "DPP" },
    { key: "vatAmount", label: "PPN" },
    { key: "withholdingTaxAmount", label: "PPh" },
    { key: "grandTotal", label: "Grand Total" },
    { key: "downPaymentAmount", label: "DP" },
    { key: "remainingAmount", label: "Sisa Pembayaran" },
  ];

  return (
    <div className="space-y-4 slide-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm">
            <Link href="/invoices" className="text-gray-400 hover:text-gray-600 transition-colors">← Invoice</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600">{invoice.invoiceNumber || "Detail"}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{invoice.vendorName || invoice.document.originalName}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={invoice.reviewStatus} />
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">Edit</button>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setForm(invoice); }} className="btn-ghost btn-sm">Batal</button>
              <button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? "Menyimpan..." : "Simpan"}</button>
            </>
          )}
          <button onClick={markReviewed} className="btn-success btn-sm">Tandai Direview</button>
          <button onClick={() => setCopilotOpen(true)} className="btn-primary btn-sm">
            <span className="text-base leading-none">💬</span> Tanya AI
          </button>
        </div>
      </div>

      {/* Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[700px]">
        <div className="h-[700px] xl:h-auto xl:sticky xl:top-20 xl:self-start">
          <PdfViewer src={`/api/documents/${invoice.documentId}/file`} />
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
          <Section title="Informasi Invoice">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <Field key={f.key} label={f.label} value={form[f.key]} editing={editing} type={f.type} onChange={(v) => setForm({ ...form, [f.key]: v })} />
              ))}
            </div>
          </Section>

          <Section title={`Rincian Item (${invoice.lineItems?.length || 0})`}>
            {invoice.lineItems?.length > 0 ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b">
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                      <th className="py-2 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((li: any) => (
                      <tr key={li.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 pr-3 text-gray-700">{li.description || "-"}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{li.quantity || "-"} {li.unit || ""}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(li.unitPrice, invoice.currency)}</td>
                        <td className="py-3 pl-3 text-right font-medium tabular-nums">{formatCurrency(li.lineTotal, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">Tidak ada rincian item.</p>}
          </Section>

          <Section title="Pajak & Total">
            <div className="space-y-1">
              {moneyFields.map((f) => (
                <div key={f.key} className={`flex items-center justify-between py-1.5 ${f.key === "grandTotal" ? "border-t border-gray-200 mt-2 pt-3" : ""}`}>
                  <span className={`text-sm ${f.key === "grandTotal" ? "font-semibold text-gray-700" : "text-gray-500"}`}>{f.label}</span>
                  {editing ? (
                    <input
                      type="number"
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value ? Number(e.target.value) : null })}
                      className="w-44 text-right rounded-lg border px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className={`tabular-nums ${f.key === "grandTotal" ? "text-lg font-bold text-gray-900" : "text-sm text-gray-700"}`}>
                      {formatCurrency(invoice[f.key], invoice.currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pembayaran">
            <div className="space-y-3 text-sm">
              <InfoRow label="Termin" value={invoice.paymentTerms || "-"} />
              <InfoRow label="Bank" value={invoice.bankName || "-"} />
              <InfoRow label="Nama Rekening" value={invoice.bankAccountName || "-"} />
              <InfoRow label="No. Rekening" value={invoice.bankAccountNumber || "-"} />
            </div>
          </Section>

          <Section title={`Validasi (${invoice.validationIssues?.length || 0})`}>
            {invoice.validationIssues?.length > 0 ? (
              <div className="space-y-2">
                {invoice.validationIssues.map((issue: any) => (
                  <div key={issue.id} className={`rounded-xl border p-3 scale-in ${issue.severity === "ERROR" ? "bg-danger-50 border-danger-200" : issue.severity === "WARNING" ? "bg-warning-50 border-warning-500/20" : "bg-sky-50 border-sky-200"}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${issue.severity === "ERROR" ? "bg-danger-100 text-danger-600" : issue.severity === "WARNING" ? "bg-warning-100 text-warning-600" : "bg-sky-100 text-sky-600"}`}>!</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success-700 text-sm">
                <span className="w-5 h-5 rounded-full bg-success-50 text-success-600 flex items-center justify-center text-xs">✓</span>
                Tidak ada masalah terdeteksi.
              </div>
            )}
          </Section>

          <div className="flex gap-3 pt-2 text-sm">
            <button onClick={reanalyze} className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">Analisis ulang</button>
            <span className="text-gray-300">•</span>
            <button onClick={remove} className="text-danger-600 hover:text-danger-700 font-medium hover:underline transition-colors">Hapus invoice</button>
          </div>
        </div>
      </div>

      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} invoiceId={id} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-section">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, editing, type, onChange }: { label: string; value: any; editing: boolean; type?: string; onChange: (v: any) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1 font-medium">{label}</label>
      {editing ? (
        <input type={type || "text"} value={value || ""} onChange={(e) => onChange(e.target.value)} className="input !py-2" />
      ) : (
        <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300">-</span>}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 text-right font-medium">{value}</span>
    </div>
  );
}
