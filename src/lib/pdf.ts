import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

type ExtractResult = {
  text: string;
  pageCount: number;
  usedOcr: boolean;
  ocrPages: number[];
};

export async function extractPdfText(filePath: string): Promise<ExtractResult> {
  let text = "";
  let pageCount = 1;

  try {
    const info = execFileSync("pdfinfo", [filePath], {
      timeout: 15000,
      encoding: "utf-8",
      windowsHide: true,
    });
    const pageMatch = info.match(/Pages:\s*(\d+)/i);
    pageCount = pageMatch ? parseInt(pageMatch[1], 10) : 1;
  } catch {
    // pdfinfo may be unavailable; continue with pageCount=1
  }

  try {
    // Use argument array, not shell interpolation, to avoid command injection.
    text = execFileSync("pdftotext", ["-layout", filePath, "-"], {
      timeout: 30000,
      encoding: "utf-8",
      windowsHide: true,
    });
  } catch {
    try {
      text = execFileSync("pdftotext", [filePath, "-"], {
        timeout: 30000,
        encoding: "utf-8",
        windowsHide: true,
      });
    } catch {
      text = "";
    }
  }

  const charCount = text.replace(/\s/g, "").length;
  const threshold = 50 * Math.max(pageCount, 1);
  let usedOcr = charCount < threshold;
  let ocrPages: number[] = [];

  if (usedOcr) {
    try {
      const { ocrPdf } = await import("./ocr");
      const ocrText = await ocrPdf(filePath, pageCount);
      if (ocrText && ocrText.trim().length > text.trim().length) {
        text = ocrText;
        usedOcr = true;
        ocrPages = Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1);
      } else {
        // OCR didn't improve; keep original
        usedOcr = false;
      }
    } catch {
      usedOcr = true; // still flag as needing OCR, keep original text
      ocrPages = Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1);
    }
  }

  return { text, pageCount: Math.max(pageCount, 1), usedOcr, ocrPages };
}

export async function saveUploadedFile(
  file: File,
  uploadDir: string
): Promise<{ filePath: string; safeName: string; sizeBytes: number }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(filePath, buffer);

  return { filePath, safeName, sizeBytes: buffer.length };
}
