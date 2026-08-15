export type InvoiceSummary = {
  invoiceNumber?: string | null;
  vendorName?: string | null;
  invoiceDate?: string | null;
  grandTotal?: number | null;
  currency?: string | null;
  invoiceType?: string | null;
  vatAmount?: number | null;
  poNumber?: string | null;
  taxInvoiceNumber?: string | null;
  paymentTerms?: string | null;
  dueDate?: string | null;
  lineItemCount?: number;
  validationIssueCount?: number;
  batchInvoiceCount?: number;
  batchGrandTotal?: number | null;
  hasTaxInvoice?: boolean;
  hasPo?: boolean;
  hasDownPayment?: boolean;
  isBatch?: boolean;
};

export type Template = {
  id: string;
  label: string;
  question: string;
  condition?: (s: InvoiceSummary) => boolean;
};

export const ALL_TEMPLATES: Template[] = [
  { id: "summary", label: "Ringkas invoice ini", question: "Ringkas invoice ini secara singkat: vendor, nomor invoice, tanggal, total, dan jatuh tempo." },
  { id: "total", label: "Berapa total yang harus dibayar?", question: "Berapa total yang harus dibayar? Jelaskan subtotal, diskon, DPP, PPN, PPh, DP, dan sisa pembayaran." },
  { id: "calc", label: "Apakah perhitungannya sudah benar?", question: "Periksa apakah perhitungan invoice sudah benar: item, pajak, potongan, dan grand total." },
  { id: "issues", label: "Cari kejanggalan", question: "Apakah ada data yang hilang atau kejanggalan pada invoice ini? Sebutkan apa adanya." },
  { id: "items", label: "Detail barang atau jasa", question: "Apa detail barang atau jasanya? Sebutkan item, qty, harga satuan, dan item termahal." },
  { id: "payment", label: "Ketentuan pembayaran", question: "Bagaimana ketentuan pembayarannya? Termin, DP/pelunasan, jatuh tempo, dan rekening." },
  {
    id: "taxinvoice",
    label: "Periksa faktur pajak",
    question: "Periksa faktur pajak pada dokumen: nomor seri, NPWP, DPP, PPN. Apakah konsisten dengan invoice?",
    condition: (s) => !!s.hasTaxInvoice,
  },
  {
    id: "dp",
    label: "Hitung DP dan sisa pembayaran",
    question: "Hitung jumlah DP yang harus dibayar dan sisa pembayaran setelah DP.",
    condition: (s) => !!s.hasDownPayment,
  },
  {
    id: "po",
    label: "Cocokkan dengan PO",
    question: "Cocokkan invoice ini dengan nomor PO yang tertera. Apakah konsisten?",
    condition: (s) => !!s.hasPo,
  },
  {
    id: "duplicate",
    label: "Cari invoice duplikat",
    question: "Apakah ada kemungkinan invoice duplikat dalam data? Bandingkan nomor invoice dan nilai.",
    condition: (s) => s.batchInvoiceCount !== undefined && s.batchInvoiceCount > 1,
  },
  {
    id: "batch",
    label: "Ringkasan semua invoice",
    question: "Buat ringkasan dari semua invoice dalam batch: jumlah invoice, total nilai, vendor, dan peringatan apa pun.",
    condition: (s) => !!s.isBatch,
  },
  {
    id: "compare",
    label: "Bandingkan vendor",
    question: "Bandingkan vendor-vendor dalam batch ini: total nilai per vendor dan jumlah invoice.",
    condition: (s) => !!s.isBatch,
  },
];

export function selectQuickTemplates(summary: InvoiceSummary, max = 4): Template[] {
  const always: string[] = ["summary", "total", "issues", "payment"];
  const picked = new Set<string>();
  const result: Template[] = [];

  // Always include the 4 base templates first
  for (const id of always) {
    const t = ALL_TEMPLATES.find((x) => x.id === id);
    if (t) {
      result.push(t);
      picked.add(id);
    }
  }

  // Then add dynamic ones based on conditions, up to max total
  const dynamic = ALL_TEMPLATES.filter(
    (t) => !picked.has(t.id) && t.condition && t.condition(summary)
  );

  for (const t of dynamic) {
    if (result.length >= max) break;
    result.push(t);
    picked.add(t.id);
  }

  // If still under max, fill with remaining static templates
  if (result.length < max) {
    for (const t of ALL_TEMPLATES) {
      if (result.length >= max) break;
      if (!picked.has(t.id)) {
        result.push(t);
        picked.add(t.id);
      }
    }
  }

  return result.slice(0, max);
}

export function buildContext(summary: InvoiceSummary, invoiceData?: string, batchData?: string): string {
  const parts: string[] = [];

  if (invoiceData) {
    parts.push("=== DATA INVOICE (structured JSON) ===");
    parts.push(invoiceData);
  }

  if (summary.isBatch && batchData) {
    parts.push("=== DATA BATCH (aggregate JSON) ===");
    parts.push(batchData);
  }

  return parts.join("\n\n");
}
