import { prisma } from "./db";
import { extractPdfText } from "./pdf";
import { extractInvoice } from "./omnirouter";
import { EXTRACT_SCHEMA, stripMarkdownFence } from "./extract-schema";
import { validateInvoice } from "./validate";
import { cleanupExpiredEphemeral } from "./cleanup";

let running = false;

export function startQueueWorker() {
  if (running) return;
  running = true;
  // Poll every 1.5s for pending documents
  setInterval(async () => {
    try {
      await pump();
    } catch (err) {
      console.error("[queue] pump error:", err);
    }
  }, 1500);
}

async function pump() {
  // Run cleanup periodically
  await cleanupExpiredEphemeral().catch(() => {});

  // Find documents in UPLOADED status, process one at a time with OCR limit
  const doc = await prisma.document.findFirst({
    where: { status: "UPLOADED" },
    orderBy: { createdAt: "asc" },
  });

  if (doc) {
    await processDocument(doc.id);
    return;
  }

  // Check if any batch still processing (for periodical status update)
  await finalizeCompletedBatches();
}

async function processDocument(docId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { batch: true },
  });
  if (!doc || !doc.storagePath) return;

  try {
    // Phase 1: Extract
    await prisma.document.update({
      where: { id: docId },
      data: { status: "EXTRACTING" },
    });

    const extraction = await extractPdfText(doc.storagePath);

    // Phase 2: OCR (if needed)
    if (extraction.usedOcr) {
      await prisma.document.update({
        where: { id: docId },
        data: { status: "OCR", usedOcr: true, ocrPageNumbers: JSON.stringify(extraction.ocrPages) },
      });
    }

    // Phase 3: AI extraction
    await prisma.document.update({
      where: { id: docId },
      data: { status: "ANALYZING", extractedText: extraction.text },
    });

    const result = await extractInvoice(extraction.text, EXTRACT_SCHEMA);
    const cleaned = stripMarkdownFence(result.content);

    // Try parse JSON
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // One bounded repair attempt
      const repair = await extractInvoice(
        `The previous output was not valid JSON. Return ONLY valid JSON matching the schema. Previous output was:\n${result.content}\n\nInvoice text:\n${extraction.text}`,
        EXTRACT_SCHEMA
      );
      const repairCleaned = stripMarkdownFence(repair.content);
      try {
        parsed = JSON.parse(repairCleaned);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      await prisma.document.update({
        where: { id: docId },
        data: { status: "FAILED", errorCode: "AI_INVALID_OUTPUT", errorMessage: "Hasil analisis AI tidak valid." },
      });
      await finalizeCompletedBatches();
      return;
    }

    // Phase 4: Create invoice + line items
    const invoice = await prisma.invoice.create({
      data: {
        documentId: docId,
        reviewStatus: "PENDING",
        confidence: parsed.confidence ?? null,
        invoiceType: parsed.invoiceType ?? null,
        invoiceNumber: parsed.invoiceNumber ?? null,
        invoiceDate: parsed.invoiceDate ?? null,
        dueDate: parsed.dueDate ?? null,
        currency: parsed.currency ?? "IDR",
        poNumber: parsed.poNumber ?? null,
        deliveryNumber: parsed.deliveryNumber ?? null,
        taxInvoiceNumber: parsed.taxInvoiceNumber ?? null,
        vendorName: parsed.vendorName ?? null,
        vendorAddress: parsed.vendorAddress ?? null,
        vendorTaxId: parsed.vendorTaxId ?? null,
        vendorPhone: parsed.vendorPhone ?? null,
        vendorEmail: parsed.vendorEmail ?? null,
        buyerName: parsed.buyerName ?? null,
        buyerAddress: parsed.buyerAddress ?? null,
        buyerTaxId: parsed.buyerTaxId ?? null,
        subtotal: parsed.subtotal ?? null,
        discount: parsed.discount ?? null,
        shipping: parsed.shipping ?? null,
        dpp: parsed.dpp ?? null,
        vatRate: parsed.vatRate ?? null,
        vatAmount: parsed.vatAmount ?? null,
        withholdingTaxRate: parsed.withholdingTaxRate ?? null,
        withholdingTaxAmount: parsed.withholdingTaxAmount ?? null,
        otherCharges: parsed.otherCharges ?? null,
        grandTotal: parsed.grandTotal ?? null,
        paidAmount: parsed.paidAmount ?? null,
        downPaymentAmount: parsed.downPaymentAmount ?? null,
        remainingAmount: parsed.remainingAmount ?? null,
        paymentTerms: parsed.paymentTerms ?? null,
        bankName: parsed.bankName ?? null,
        bankAccountName: parsed.bankAccountName ?? null,
        bankAccountNumber: parsed.bankAccountNumber ?? null,
        rawAiResponse: result.content,
        modelUsed: result.model,
      },
    });

    // Line items
    if (Array.isArray(parsed.lineItems)) {
      for (const [idx, item] of parsed.lineItems.entries()) {
        await prisma.lineItem.create({
          data: {
            invoiceId: invoice.id,
            lineNumber: item.lineNumber ?? idx + 1,
            description: item.description ?? null,
            sku: item.sku ?? null,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            unitPrice: item.unitPrice ?? null,
            discount: item.discount ?? null,
            taxRate: item.taxRate ?? null,
            lineTotal: item.lineTotal ?? null,
            pageNumber: item.pageNumber ?? null,
            confidence: item.confidence ?? null,
          },
        });
      }
    }

    // Phase 5: Deterministic validation
    await prisma.document.update({
      where: { id: docId },
      data: { status: "VALIDATING" },
    });

    const validation = validateInvoice({
      documentId: docId,
      invoiceId: invoice.id,
      subtotal: parsed.subtotal,
      discount: parsed.discount,
      shipping: parsed.shipping,
      dpp: parsed.dpp,
      vatRate: parsed.vatRate,
      vatAmount: parsed.vatAmount,
      withholdingTaxAmount: parsed.withholdingTaxAmount,
      otherCharges: parsed.otherCharges,
      grandTotal: parsed.grandTotal,
      paidAmount: parsed.paidAmount,
      downPaymentAmount: parsed.downPaymentAmount,
      remainingAmount: parsed.remainingAmount,
      lineItems: (parsed.lineItems || []).map((li: any) => ({
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discount: li.discount,
        lineTotal: li.lineTotal,
      })),
      invoiceDate: parsed.invoiceDate,
      dueDate: parsed.dueDate,
      vendorName: parsed.vendorName,
      invoiceNumber: parsed.invoiceNumber,
      vendorTaxId: parsed.vendorTaxId,
    });

    // Save validation issues
    for (const issue of validation.issues) {
      await prisma.validationIssue.create({
        data: {
          documentId: docId,
          invoiceId: invoice.id,
          severity: issue.severity,
          code: issue.code,
          title: issue.title,
          description: issue.description,
          field: issue.field,
          expected: issue.expected,
          actual: issue.actual,
        },
      });
    }

    // Update invoice review status if errors
    const hasError = validation.issues.some((i) => i.severity === "ERROR");
    const hasWarning = validation.issues.some((i) => i.severity === "WARNING");
    if (hasError || hasWarning) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { reviewStatus: hasError ? "NEEDS_REVIEW" : "PENDING" },
      });
    }

    // Phase 6: Complete
    await prisma.document.update({
      where: { id: docId },
      data: { status: "COMPLETED", pageCount: extraction.pageCount },
    });

    await finalizeCompletedBatches();
  } catch (err: any) {
    console.error(`[queue] document ${docId} failed:`, err);
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: "FAILED",
        errorCode: "PROCESSING_ERROR",
        errorMessage: err?.message || "Terjadi kesalahan saat memproses.",
      },
    });
    await finalizeCompletedBatches();
  }
}

async function finalizeCompletedBatches() {
  const batches = await prisma.batch.findMany({
    where: { status: { in: ["UPLOADED", "PROCESSING"] } },
    include: { documents: true },
  });

  for (const batch of batches) {
    const failed = batch.documents.filter((d) => d.status === "FAILED").length;
    const completed = batch.documents.filter((d) => d.status === "COMPLETED").length;
    const stillProcessing = batch.documents.filter(
      (d) => !["FAILED", "COMPLETED"].includes(d.status)
    ).length;

    if (stillProcessing === 0) {
      const status = failed === 0 ? "COMPLETED" : completed === 0 ? "FAILED" : "PARTIAL";
      await prisma.batch.update({
        where: { id: batch.id },
        data: { status, completedFiles: completed, failedFiles: failed, completedAt: new Date() },
      });
    } else {
      await prisma.batch.update({
        where: { id: batch.id },
        data: { status: "PROCESSING", completedFiles: completed, failedFiles: failed },
      });
    }
  }
}
