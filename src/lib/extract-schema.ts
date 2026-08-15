export const EXTRACT_SCHEMA = JSON.stringify(
  {
    invoiceType: "STANDARD | PROFORMA | DOWN_PAYMENT | SETTLEMENT | CREDIT_NOTE | UNKNOWN",
    invoiceNumber: "string or null",
    invoiceDate: "ISO date string or null (e.g. 2024-12-27)",
    dueDate: "ISO date string or null",
    currency: "string (default IDR)",
    poNumber: "string or null",
    deliveryNumber: "string or null",
    taxInvoiceNumber: "string or null",
    vendorName: "string or null",
    vendorAddress: "string or null",
    vendorTaxId: "string or null",
    vendorPhone: "string or null",
    vendorEmail: "string or null",
    buyerName: "string or null",
    buyerAddress: "string or null",
    buyerTaxId: "string or null",
    subtotal: "number or null",
    discount: "number or null",
    shipping: "number or null",
    dpp: "number or null (Dasar Pengenaan Pajak)",
    vatRate: "number or null (PPN rate, e.g. 0.11)",
    vatAmount: "number or null",
    withholdingTaxRate: "number or null (PPh rate)",
    withholdingTaxAmount: "number or null",
    otherCharges: "number or null",
    grandTotal: "number or null",
    paidAmount: "number or null",
    downPaymentAmount: "number or null",
    remainingAmount: "number or null",
    paymentTerms: "string or null",
    bankName: "string or null",
    bankAccountName: "string or null",
    bankAccountNumber: "string or null",
    lineItems: [
      {
        lineNumber: "number",
        description: "string or null",
        sku: "string or null",
        quantity: "number or null",
        unit: "string or null (e.g. pcs, unit, set)",
        unitPrice: "number or null",
        discount: "number or null",
        taxRate: "number or null",
        lineTotal: "number or null",
        pageNumber: "number or null"
      }
    ]
  },
  null,
  2
);

export function stripMarkdownFence(text: string): string {
  // Strip ```json ... ``` or ``` ... ``` fences
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Also try to find first { and last }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}
