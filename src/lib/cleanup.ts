import fs from "fs";
import { prisma } from "./db";

let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // once per hour

/** Delete expired ephemeral batches, files, and all related DB records. */
export async function cleanupExpiredEphemeral(): Promise<number> {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return 0;
  lastCleanup = now;

  const batches = await prisma.batch.findMany({
    where: {
      storageMode: "EPHEMERAL",
      expiresAt: { lte: new Date() },
    },
    include: {
      documents: {
        include: {
          invoice: { select: { id: true } },
        },
      },
    },
  });

  for (const batch of batches) {
    for (const doc of batch.documents) {
      if (doc.storagePath && fs.existsSync(doc.storagePath)) {
        try { fs.unlinkSync(doc.storagePath); } catch { /* best effort */ }
      }
      const invoiceId = doc.invoice?.id;
      if (invoiceId) {
        await prisma.chatMessage.deleteMany({ where: { thread: { invoiceId } } });
        await prisma.chatThread.deleteMany({ where: { invoiceId } });
        await prisma.fieldSource.deleteMany({ where: { invoiceId } });
        await prisma.lineItem.deleteMany({ where: { invoiceId } });
        await prisma.validationIssue.deleteMany({ where: { invoiceId } });
        await prisma.invoice.delete({ where: { id: invoiceId } });
      }
      await prisma.validationIssue.deleteMany({ where: { documentId: doc.id } });
      await prisma.document.delete({ where: { id: doc.id } });
    }
    await prisma.chatMessage.deleteMany({ where: { thread: { batchId: batch.id } } });
    await prisma.chatThread.deleteMany({ where: { batchId: batch.id } });
    await prisma.batch.delete({ where: { id: batch.id } });
  }

  return batches.length;
}
