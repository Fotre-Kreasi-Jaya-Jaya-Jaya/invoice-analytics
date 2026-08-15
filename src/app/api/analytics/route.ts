import { NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return unauthorized();

  const userId = session.id;

  // Get all invoices for this user (PERMANENT only)
  const invoices = await prisma.invoice.findMany({
    where: { document: { batch: { userId, storageMode: "PERMANENT" } } },
    include: { validationIssues: { where: { resolved: false } } },
  });

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
  const totalVat = invoices.reduce((s, i) => s + (Number(i.vatAmount) || 0), 0);
  const needsReview = invoices.filter((i) => i.reviewStatus === "NEEDS_REVIEW").length;
  const withWarnings = invoices.filter((i) => i.validationIssues.length > 0).length;

  // Per vendor
  const vendorMap = new Map<string, { count: number; total: number }>();
  for (const inv of invoices) {
    const name = inv.vendorName || "Unknown";
    const cur = vendorMap.get(name) || { count: 0, total: 0 };
    cur.count++;
    cur.total += Number(inv.grandTotal) || 0;
    vendorMap.set(name, cur);
  }
  const topVendors = Array.from(vendorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Per month
  const monthMap = new Map<string, { count: number; total: number }>();
  for (const inv of invoices) {
    if (!inv.invoiceDate) continue;
    const month = inv.invoiceDate.slice(0, 7);
    const cur = monthMap.get(month) || { count: 0, total: 0 };
    cur.count++;
    cur.total += Number(inv.grandTotal) || 0;
    monthMap.set(month, cur);
  }
  const monthly = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Invoice type distribution
  const typeMap = new Map<string, number>();
  for (const inv of invoices) {
    const t = inv.invoiceType || "UNKNOWN";
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  }
  const typeDistribution = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

  // Upcoming due dates
  const now = new Date();
  const upcomingDue = invoices
    .filter((i) => i.dueDate && new Date(i.dueDate) >= now)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 10)
    .map((i) => ({
      invoiceNumber: i.invoiceNumber,
      vendorName: i.vendorName,
      dueDate: i.dueDate,
      grandTotal: i.grandTotal ? Number(i.grandTotal) : null,
    }));

  return NextResponse.json({
    totalInvoices,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    needsReview,
    withWarnings,
    topVendors,
    monthly,
    typeDistribution,
    upcomingDue,
  });
}
