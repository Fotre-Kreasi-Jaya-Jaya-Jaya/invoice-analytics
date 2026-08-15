import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      batch: { select: { userId: true, storageMode: true, name: true } },
      invoice: {
        include: {
          lineItems: { orderBy: { lineNumber: "asc" } },
          validationIssues: { orderBy: { createdAt: "desc" } },
          fieldSources: true,
        },
      },
    },
  });

  if (!doc || doc.batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}
