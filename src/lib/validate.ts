export type ValidationInput = {
  documentId: string;
  invoiceId: string;
  subtotal?: number | null;
  discount?: number | null;
  shipping?: number | null;
  dpp?: number | null;
  vatRate?: number | null;
  vatAmount?: number | null;
  withholdingTaxAmount?: number | null;
  otherCharges?: number | null;
  grandTotal?: number | null;
  paidAmount?: number | null;
  downPaymentAmount?: number | null;
  remainingAmount?: number | null;
  lineItems: {
    quantity?: number | null;
    unitPrice?: number | null;
    discount?: number | null;
    lineTotal?: number | null;
  }[];
  invoiceDate?: string | null;
  dueDate?: string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  vendorTaxId?: string | null;
};

export type ValidationResult = {
  issues: {
    severity: "INFO" | "WARNING" | "ERROR";
    code: string;
    title: string;
    description: string;
    field?: string;
    expected?: string;
    actual?: string;
  }[];
};

const TOLERANCE = 2; // IDR rounding tolerance

function isZeroish(v: number | null | undefined): boolean {
  return v === null || v === undefined || Math.abs(v) < 0.005;
}

function closeEnough(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE;
}

export function validateInvoice(input: ValidationInput): ValidationResult {
  const issues: ValidationResult["issues"] = [];

  // 1. Line item totals
  let subtotalFromLines = 0;
  const hasLineItems = input.lineItems.length > 0;
  for (const [idx, line] of input.lineItems.entries()) {
    if (line.quantity != null && line.unitPrice != null) {
      const expected = line.quantity * line.unitPrice - (line.discount ?? 0);
      subtotalFromLines += expected;
      if (line.lineTotal != null && !closeEnough(line.lineTotal, expected)) {
        issues.push({
          severity: "WARNING",
          code: "LINE_TOTAL_MISMATCH",
          title: `Line ${idx + 1} total tidak cocok`,
          description: `Quantity × unit price − discount seharusnya ${expected}, tetapi tertulis ${line.lineTotal}.`,
          field: `lineItems.${idx}.lineTotal`,
          expected: String(expected),
          actual: String(line.lineTotal),
        });
      }
    }
  }

  // 2. Subtotal vs sum of lines
  if (hasLineItems && input.subtotal != null && !isZeroish(subtotalFromLines)) {
    if (!closeEnough(subtotalFromLines, input.subtotal)) {
      issues.push({
        severity: "WARNING",
        code: "SUBTOTAL_MISMATCH",
        title: "Subtotal tidak cocok dengan rincian item",
        description: `Total dari rincian item adalah ${subtotalFromLines}, tetapi subtotal tertulis ${input.subtotal}.`,
        field: "subtotal",
        expected: String(subtotalFromLines),
        actual: String(input.subtotal),
      });
    }
  }

  // 3. VAT: if vatRate and dpp present, vatAmount should = dpp × rate
  if (input.vatRate != null && input.dpp != null && input.vatAmount != null) {
    const expectedVat = input.dpp * input.vatRate;
    if (!closeEnough(expectedVat, input.vatAmount)) {
      issues.push({
        severity: "WARNING",
        code: "VAT_MISMATCH",
        title: "PPN tidak cocok",
        description: `DPP × tarif PPN seharusnya ${expectedVat.toFixed(2)}, tetapi tertulis ${input.vatAmount}.`,
        field: "vatAmount",
        expected: expectedVat.toFixed(2),
        actual: String(input.vatAmount),
      });
    }
  }

  // 4. Grand total reconciliation
  if (input.grandTotal != null) {
    const base =
      (input.subtotal ?? 0) -
      (input.discount ?? 0) +
      (input.shipping ?? 0) +
      (input.vatAmount ?? 0) -
      (input.withholdingTaxAmount ?? 0) +
      (input.otherCharges ?? 0);

    // Only flag if we have enough info to reconcile
    const hasEnoughInfo =
      input.subtotal != null ||
      input.vatAmount != null ||
      input.withholdingTaxAmount != null;

    if (hasEnoughInfo && !closeEnough(base, input.grandTotal)) {
      // Could be because DPP-based rounding; check alternative: grandTotal = dpp + vat - withholding
      const alt = (input.dpp ?? input.subtotal ?? 0) + (input.vatAmount ?? 0) - (input.withholdingTaxAmount ?? 0) + (input.otherCharges ?? 0);
      if (!closeEnough(alt, input.grandTotal) && !closeEnough(base, input.grandTotal)) {
        issues.push({
          severity: "WARNING",
          code: "GRAND_TOTAL_MISMATCH",
          title: "Grand total tidak cocok",
          description: `Perhitungan dari komponen menghasilkan ${base.toFixed(2)}, tetapi grand total tertulis ${input.grandTotal}.`,
          field: "grandTotal",
          expected: base.toFixed(2),
          actual: String(input.grandTotal),
        });
      }
    }
  }

  // 5. Remaining amount
  if (input.grandTotal != null && input.paidAmount != null && input.remainingAmount != null) {
    const expectedRemaining =
      input.grandTotal - (input.paidAmount ?? 0) - (input.downPaymentAmount ?? 0);
    if (!closeEnough(expectedRemaining, input.remainingAmount)) {
      issues.push({
        severity: "WARNING",
        code: "REMAINING_MISMATCH",
        title: "Sisa pembayaran tidak cocok",
        description: `Grand total − pembayaran − DP seharusnya ${expectedRemaining.toFixed(2)}, tetapi tertulis ${input.remainingAmount}.`,
        field: "remainingAmount",
        expected: expectedRemaining.toFixed(2),
        actual: String(input.remainingAmount),
      });
    }
  }

  // 6. Required fields
  const requiredChecks: { field: string; value?: string | null; label: string }[] = [
    { field: "vendorName", value: input.vendorName, label: "Nama vendor" },
    { field: "invoiceNumber", value: input.invoiceNumber, label: "Nomor invoice" },
    { field: "grandTotal", value: input.grandTotal != null ? String(input.grandTotal) : null, label: "Grand total" },
  ];
  for (const rc of requiredChecks) {
    if (!rc.value || rc.value.trim() === "") {
      issues.push({
        severity: "ERROR",
        code: "REQUIRED_FIELD_MISSING",
        title: `${rc.label} tidak ditemukan`,
        description: `Field wajib "${rc.label}" kosong atau tidak terekstrak.`,
        field: rc.field,
      });
    }
  }

  // 7. Due date before invoice date
  if (input.invoiceDate && input.dueDate) {
    const inv = new Date(input.invoiceDate);
    const due = new Date(input.dueDate);
    if (!isNaN(inv.getTime()) && !isNaN(due.getTime()) && due < inv) {
      issues.push({
        severity: "WARNING",
        code: "DUE_DATE_BEFORE_INVOICE",
        title: "Jatuh tempo sebelum tanggal invoice",
        description: `Jatuh tempo (${input.dueDate}) lebih awal dari tanggal invoice (${input.invoiceDate}).`,
        field: "dueDate",
        expected: input.invoiceDate,
        actual: input.dueDate,
      });
    }
  }

  // 8. Negative grand total
  if (input.grandTotal != null && input.grandTotal < 0) {
    issues.push({
      severity: "ERROR",
      code: "NEGATIVE_TOTAL",
      title: "Grand total negatif",
      description: "Grand total bernilai negatif pada invoice normal.",
      field: "grandTotal",
      actual: String(input.grandTotal),
    });
  }

  // 9. Tax ID format (basic: 15 or 16 digits)
  if (input.vendorTaxId) {
    const digits = input.vendorTaxId.replace(/\D/g, "");
    if (digits.length !== 15 && digits.length !== 16 && digits.length !== 0) {
      issues.push({
        severity: "WARNING",
        code: "INVALID_TAX_ID",
        title: "Format NPWP tidak valid",
        description: `NPWP vendor "${input.vendorTaxId}" tidak sesuai format 15-16 digit.`,
        field: "vendorTaxId",
        actual: input.vendorTaxId,
      });
    }
  }

  return { issues };
}
