import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import fs from "fs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { batch: { select: { userId: true } } },
  });

  if (!doc || doc.batch.userId !== session.id || !doc.storagePath) {
    return new Response("Not found", { status: 404 });
  }

  if (!fs.existsSync(doc.storagePath)) {
    return new Response("File not found", { status: 404 });
  }

  const buffer = fs.readFileSync(doc.storagePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.safeName}"`,
    },
  });
}
