import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileP = promisify(execFile);

/**
 * OCR a PDF page-by-page using pdftoppm (poppler) + tesseract.
 * Requires pdftoppm and tesseract binaries on PATH (available in Docker image).
 * Gracefully fails if binaries are missing — caller falls back to raw text.
 */
export async function ocrPdf(
  filePath: string,
  pageCount: number,
  lang = "ind+eng"
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ia-ocr-"));
  try {
    const pages: string[] = [];

    for (let page = 1; page <= pageCount; page++) {
      const prefix = path.join(tmpDir, `page-${page}`);
      // Render page to PNG at 200 DPI
      await execFileP(
        "pdftoppm",
        ["-png", "-r", "200", "-f", String(page), "-l", String(page), filePath, prefix],
        { timeout: 60000, windowsHide: true }
      );

      // Find rendered file (pdftoppm may output page-1.png or page-01.png)
      const png = fs
        .readdirSync(tmpDir)
        .find((f) => f.startsWith(`page-${page}`) && f.endsWith(".png"));

      if (!png) continue;

      const pngPath = path.join(tmpDir, png);
      const { stdout } = await execFileP(
        "tesseract",
        [pngPath, "stdout", "-l", lang],
        { timeout: 60000, windowsHide: true, maxBuffer: 50 * 1024 * 1024 }
      );
      pages.push(`--- PAGE ${page} ---\n${stdout}`);
    }

    return pages.join("\n\n");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
