import { NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { startQueueWorker } from "@/lib/queue";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const docId = invoice.documentId;
  // Clean up existing derived data
  await prisma.validationIssue.deleteMany({ where: { invoiceId: id } });
  await prisma.fieldSource.deleteMany({ where: { invoiceId: id } });
  await prisma.lineItem.deleteMany({ where: { invoiceId: id } });
  await prisma.chatThread.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.delete({ where: { id } });
  await prisma.document.update({ where: { id: docId }, data: { status: "UPLOADED" } });

  startQueueWorker();
  return NextResponse.json({ ok: true });
}
