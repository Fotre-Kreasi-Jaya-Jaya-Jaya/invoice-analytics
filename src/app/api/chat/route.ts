import { NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { chatCopilot } from "@/lib/omnirouter";
import { buildContext } from "@/lib/copilot";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const body = await req.json();
  const { question, invoiceId, batchId, messages } = body;

  if (!question && !messages) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  // Build context based on scope
  let context = "";

  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        document: { select: { extractedText: true } },
        lineItems: true,
        validationIssues: { take: 20, orderBy: { createdAt: "desc" } },
      },
    });

    if (invoice) {
      const summary = {
        invoiceNumber: invoice.invoiceNumber,
        vendorName: invoice.vendorName,
        invoiceDate: invoice.invoiceDate,
        grandTotal: invoice.grandTotal ? Number(invoice.grandTotal) : null,
        currency: invoice.currency,
        invoiceType: invoice.invoiceType,
        vatAmount: invoice.vatAmount ? Number(invoice.vatAmount) : null,
        poNumber: invoice.poNumber,
        taxInvoiceNumber: invoice.taxInvoiceNumber,
        paymentTerms: invoice.paymentTerms,
        dueDate: invoice.dueDate,
        lineItemCount: invoice.lineItems.length,
        validationIssueCount: invoice.validationIssues.length,
        hasTaxInvoice: !!invoice.taxInvoiceNumber,
        hasPo: !!invoice.poNumber,
        hasDownPayment: invoice.downPaymentAmount != null && Number(invoice.downPaymentAmount) > 0,
      };

      context = buildContext(
        summary,
        JSON.stringify(invoice, null, 2),
        invoice.document.extractedText ? `=== FULL TEXT ===\n${invoice.document.extractedText.slice(0, 10000)}` : undefined
      );
    }
  }

  if (batchId && !invoiceId) {
    const invoices = await prisma.invoice.findMany({
      where: { document: { batchId } },
      include: { validationIssues: { take: 5 } },
    });

    if (invoices.length > 0) {
      const batchSummary = {
        isBatch: true,
        batchInvoiceCount: invoices.length,
        batchGrandTotal: invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0),
        hasTaxInvoice: invoices.some((i) => !!i.taxInvoiceNumber),
        hasPo: invoices.some((i) => !!i.poNumber),
        hasDownPayment: invoices.some((i) => Number(i.downPaymentAmount) > 0),
      };

      context = buildContext(
        batchSummary,
        JSON.stringify(invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          vendorName: i.vendorName,
          invoiceDate: i.invoiceDate,
          grandTotal: i.grandTotal ? Number(i.grandTotal) : null,
          invoiceType: i.invoiceType,
          reviewStatus: i.reviewStatus,
        })), null, 2)
      );
    }
  }

  // Create chat history from messages
  const chatMessages = messages || [{ role: "user", content: question }];

  try {
    const stream = await chatCopilot(chatMessages, context);

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI tidak tersedia" }, { status: 502 });
  }
}
