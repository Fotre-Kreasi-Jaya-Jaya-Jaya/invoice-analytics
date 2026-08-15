import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: "asc" },
        include: {
          invoice: {
            include: {
              validationIssues: { where: { resolved: false }, take: 5 },
              lineItems: { take: 3 },
              _count: { select: { validationIssues: true } },
            },
          },
        },
      },
    },
  });

  if (!batch || batch.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ batch });
}
