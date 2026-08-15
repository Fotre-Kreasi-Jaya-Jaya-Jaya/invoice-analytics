import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { prisma } from "./db";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 50;
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100 MB

export async function processUpload(
  formData: FormData,
  userId: string
): Promise<{ batchId: string; storageMode: string; expiresAt: Date | null }> {
  const storageMode = (formData.get("storageMode") as string) || "PERMANENT";
  const sourceType = (formData.get("sourceType") as string) || "multiple";

  // Collect all files
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "files" && value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    throw new Error("Tidak ada file diupload");
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Maksimal ${MAX_FILES} file per batch`);
  }

  const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith(".zip");
  const actualSourceType = isZip ? "zip" : sourceType;

  const ttlHours = parseInt(process.env.EPHEMERAL_TTL_HOURS || "24", 10);
  const expiresAt =
    storageMode === "EPHEMERAL"
      ? new Date(Date.now() + ttlHours * 60 * 60 * 1000)
      : null;

  // Create batch record
  const batch = await prisma.batch.create({
    data: {
      name: `Batch ${new Date().toISOString().slice(0, 10)}`,
      sourceType: actualSourceType,
      storageMode,
      expiresAt,
      userId,
      status: "PROCESSING",
      totalFiles: files.length,
    },
  });

  // Process each file (or unzip)
  const uploadDir = path.join(UPLOAD_ROOT, batch.id);
  fs.mkdirSync(uploadDir, { recursive: true });

  let fileCount = 0;
  let failCount = 0;

  const processFile = async (file: File | { name: string; buffer: Buffer }) => {
    const isFileObj = file instanceof File;
    const name = isFileObj ? file.name : file.name;
    const buffer = isFileObj
      ? Buffer.from(await file.arrayBuffer())
      : file.buffer;

    // Validate size
    if (buffer.length > MAX_FILE_SIZE) {
      await createFailedDoc(batch.id, name, "FILE_TOO_LARGE", "Ukuran file melebihi batas 20 MB.");
      failCount++;
      return;
    }

    // Only PDFs
    if (!name.toLowerCase().endsWith(".pdf")) {
      await createFailedDoc(batch.id, name, "INVALID_FILE_TYPE", "Hanya file PDF yang didukung.");
      failCount++;
      return;
    }

    // Save file
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadDir, `${fileCount}-${safeName}`);
    fs.writeFileSync(filePath, buffer);

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // Create document record
    await prisma.document.create({
      data: {
        batchId: batch.id,
        originalName: name,
        safeName,
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        sha256,
        storagePath: filePath,
        status: "UPLOADED",
      },
    });

    fileCount++;
  };

  // Handle ZIP
  if (isZip) {
    try {
      const zipBuf = Buffer.from(await files[0].arrayBuffer());
      if (zipBuf.length > MAX_ZIP_SIZE) {
        throw new Error("ZIP terlalu besar");
      }
      const zip = new AdmZip(zipBuf);
      const entries = zip.getEntries();
      let zipFileCount = 0;
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        if (zipFileCount >= MAX_FILES) break;
        const entryName = entry.entryName;
        // Prevent path traversal
        if (entryName.includes("..") || path.isAbsolute(entryName)) {
          continue;
        }
        const baseName = path.basename(entryName);
        if (!baseName.toLowerCase().endsWith(".pdf")) continue;
        await processFile({ name: baseName, buffer: entry.getData() });
        zipFileCount++;
      }
      if (zipFileCount === 0) {
        throw new Error("Tidak ada file PDF valid di dalam ZIP");
      }
    } catch (err: any) {
      await createFailedDoc(batch.id, "archive.zip", "ZIP_INVALID", err.message || "ZIP tidak dapat dibaca.");
      failCount++;
    }
  } else {
    for (const file of files) {
      await processFile(file);
    }
  }

  // Update batch totals
  const totalDocs = fileCount;
  await prisma.batch.update({
    where: { id: batch.id },
    data: {
      totalFiles: totalDocs + failCount,
      failedFiles: failCount,
    },
  });

  if (totalDocs === 0) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: "FAILED" },
    });
    throw new Error("Tidak ada file PDF valid yang diproses");
  }

  return { batchId: batch.id, storageMode, expiresAt };
}

async function createFailedDoc(
  batchId: string,
  name: string,
  errorCode: string,
  errorMessage: string
) {
  await prisma.document.create({
    data: {
      batchId,
      originalName: name,
      safeName: name.replace(/[^a-zA-Z0-9._-]/g, "_"),
      mimeType: "application/pdf",
      sizeBytes: 0,
      status: "FAILED",
      errorCode,
      errorMessage,
    },
  });
}
