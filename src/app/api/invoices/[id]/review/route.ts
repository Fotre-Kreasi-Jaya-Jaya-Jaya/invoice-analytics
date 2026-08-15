import { NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

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

  await prisma.invoice.update({ where: { id }, data: { reviewStatus: "REVIEWED" } });
  return NextResponse.json({ ok: true });
}
