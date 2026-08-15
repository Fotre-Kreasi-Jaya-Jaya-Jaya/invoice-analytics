import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { startQueueWorker } from "@/lib/queue";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      batch: { select: { userId: true } },
      invoice: { select: { id: true } },
    },
  });

  if (!doc || doc.batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reset document to UPLOADED
  await prisma.document.update({
    where: { id },
    data: {
      status: "UPLOADED",
      errorCode: null,
      errorMessage: null,
      extractedText: null,
    },
  });

  // Also delete any associated invoice + issues if exists
  if (doc.invoice) {
    await prisma.validationIssue.deleteMany({ where: { documentId: id } });
    await prisma.fieldSource.deleteMany({ where: { invoice: { documentId: id } } });
    await prisma.lineItem.deleteMany({ where: { invoice: { documentId: id } } });
    await prisma.chatMessage.deleteMany({ where: { thread: { invoice: { documentId: id } } } });
    await prisma.chatThread.deleteMany({ where: { invoice: { documentId: id } } });
    await prisma.invoice.delete({ where: { documentId: id } });
  }

  startQueueWorker();
  return NextResponse.json({ ok: true });
}
