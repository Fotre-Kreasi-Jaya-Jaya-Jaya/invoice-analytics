import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-middleware";
import { unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const search = url.searchParams.get("search") || "";
  const vendor = url.searchParams.get("vendor") || "";
  const status = url.searchParams.get("status") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";

  const where: any = {
    document: { batch: { userId: session.id, storageMode: "PERMANENT" } },
  };

  if (vendor) where.vendorName = { contains: vendor, mode: "insensitive" };
  if (status) where.reviewStatus = status;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { vendorName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (startDate) where.invoiceDate = { ...(where.invoiceDate || {}), gte: startDate };
  if (endDate) where.invoiceDate = { ...(where.invoiceDate || {}), lte: endDate };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        document: { select: { id: true, originalName: true, status: true } },
        _count: { select: { validationIssues: { where: { resolved: false } } } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}
