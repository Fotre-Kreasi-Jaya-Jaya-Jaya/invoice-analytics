import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";
  const batchId = url.searchParams.get("batchId") || "";
  const vendor = url.searchParams.get("vendor") || "";

  const where: any = {
    document: { batch: { userId: session.id, storageMode: "PERMANENT" } },
  };
  if (batchId) where.document.batchId = batchId;
  if (vendor) where.vendorName = { contains: vendor, mode: "insensitive" };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  if (format === "xlsx") {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    wb.creator = "Invoice Analytics AI";
    const ws = wb.addWorksheet("Invoices");

    const headers = [
      "No. Invoice", "Tanggal", "Jatuh Tempo", "Vendor", "NPWP Vendor",
      "Pembeli", "Subtotal", "Diskon", "DPP", "PPN", "PPh",
      "Grand Total", "Dibayar", "DP", "Sisa", "Status Review",
      "Tipe", "No. PO", "No. Faktur Pajak", "Kategori", "Catatan",
    ];
    ws.addRow(headers);
    // Style header
    ws.getRow(1).font = { bold: true };

    for (const inv of invoices) {
      ws.addRow([
        inv.invoiceNumber || "", inv.invoiceDate || "", inv.dueDate || "",
        inv.vendorName || "", inv.vendorTaxId || "", inv.buyerName || "",
        inv.subtotal ? Number(inv.subtotal) : null,
        inv.discount ? Number(inv.discount) : null,
        inv.dpp ? Number(inv.dpp) : null,
        inv.vatAmount ? Number(inv.vatAmount) : null,
        inv.withholdingTaxAmount ? Number(inv.withholdingTaxAmount) : null,
        inv.grandTotal ? Number(inv.grandTotal) : null,
        inv.paidAmount ? Number(inv.paidAmount) : null,
        inv.downPaymentAmount ? Number(inv.downPaymentAmount) : null,
        inv.remainingAmount ? Number(inv.remainingAmount) : null,
        inv.reviewStatus || "", inv.invoiceType || "", inv.poNumber || "",
        inv.taxInvoiceNumber || "", inv.category || "", inv.notes || "",
      ]);
    }

    // Auto-fit columns
    ws.columns.forEach((col) => {
      col.width = col.header ? Math.min(col.header.length + 5, 30) : 15;
    });

    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="invoices-${Date.now()}.xlsx"`,
      },
    });
  }

  // CSV generation
  const headers = [
    "Nomor Invoice", "Tanggal", "Jatuh Tempo", "Vendor", "NPWP Vendor",
    "Pembeli", "Subtotal", "Diskon", "DPP", "PPN", "PPh",
    "Grand Total", "Dibayar", "DP", "Sisa", "Status Review",
    "Tipe", "No. PO", "No. Faktur Pajak", "Kategori", "Catatan",
  ];

  const csvRows = [headers.join(",")];
  for (const inv of invoices) {
    csvRows.push([
      csvEscape(inv.invoiceNumber || ""),
      csvEscape(inv.invoiceDate || ""),
      csvEscape(inv.dueDate || ""),
      csvEscape(inv.vendorName || ""),
      csvEscape(inv.vendorTaxId || ""),
      csvEscape(inv.buyerName || ""),
      inv.subtotal?.toString() || "",
      inv.discount?.toString() || "",
      inv.dpp?.toString() || "",
      inv.vatAmount?.toString() || "",
      inv.withholdingTaxAmount?.toString() || "",
      inv.grandTotal?.toString() || "",
      inv.paidAmount?.toString() || "",
      inv.downPaymentAmount?.toString() || "",
      inv.remainingAmount?.toString() || "",
      inv.reviewStatus || "",
      inv.invoiceType || "",
      csvEscape(inv.poNumber || ""),
      csvEscape(inv.taxInvoiceNumber || ""),
      csvEscape(inv.category || ""),
      csvEscape(inv.notes || ""),
    ].join(","));
  }

  const csv = "\uFEFF" + csvRows.join("\n"); // BOM for Excel

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${Date.now()}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
