import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { processUpload } from "@/lib/upload";
import { startQueueWorker } from "@/lib/queue";

// Start queue on first request
let started = false;

export async function POST(req: Request) {
  if (!started) {
    startQueueWorker();
    started = true;
  }

  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  try {
    const formData = await req.formData();
    const result = await processUpload(formData, session.id);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal upload" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { documents: true } },
      },
    }),
    prisma.batch.count({ where: { userId: session.id } }),
  ]);

  return NextResponse.json({ batches, total, page, limit });
}
