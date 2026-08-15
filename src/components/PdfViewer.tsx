"use client";

import { useState } from "react";

export default function PdfViewer({ src, highlightPage }: { src: string; highlightPage?: number | null }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative h-full bg-gray-100 rounded-2xl overflow-hidden border shadow-xs">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="w-9 h-9 mx-auto rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            <p className="text-xs text-gray-400 mt-3">Memuat PDF...</p>
          </div>
        </div>
      )}
      <iframe
        src={src}
        className="w-full h-full"
        onLoad={() => setLoading(false)}
        title="PDF Viewer"
      />
      {highlightPage && (
        <div className="absolute top-3 right-3 bg-primary-600/90 text-white text-xs font-medium rounded-full px-3 py-1 shadow-lg backdrop-blur-sm scale-in">
          Halaman {highlightPage}
        </div>
      )}
    </div>
  );
}