import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      document: { include: { batch: { select: { userId: true } } } },
      lineItems: { orderBy: { lineNumber: "asc" } },
      validationIssues: { orderBy: { createdAt: "desc" } },
      fieldSources: true,
    },
  });

  if (!invoice || invoice.document.batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { document: { include: { batch: { select: { userId: true } } } } },
  });
  if (!invoice || invoice.document.batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only allow certain fields to be updated
  const allowed = [
    "invoiceNumber", "invoiceDate", "dueDate", "vendorName", "vendorAddress",
    "vendorTaxId", "buyerName", "buyerAddress", "buyerTaxId",
    "subtotal", "discount", "dpp", "vatRate", "vatAmount",
    "withholdingTaxAmount", "otherCharges", "grandTotal",
    "paidAmount", "downPaymentAmount", "remainingAmount",
    "paymentTerms", "category", "notes", "reviewStatus",
  ];

  const updateData: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ invoice: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { document: { include: { batch: { select: { userId: true } } } } },
  });
  if (!invoice || invoice.document.batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.validationIssue.deleteMany({ where: { invoiceId: id } });
  await prisma.fieldSource.deleteMany({ where: { invoiceId: id } });
  await prisma.lineItem.deleteMany({ where: { invoiceId: id } });
  await prisma.chatThread.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
