"use client";

import { useState, useRef, useEffect } from "react";

type Template = { id: string; label: string; question: string };
type Message = { role: "user" | "assistant"; content: string };

export default function CopilotDrawer({
  open,
  onClose,
  invoiceId,
  batchId,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId?: string;
  batchId?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTemplates([]);
      setMessages([]);
      const base: Template[] = [
        { id: "summary", label: "Ringkas invoice", question: "Ringkas invoice ini secara singkat." },
        { id: "total", label: "Total yang harus dibayar?", question: "Berapa total yang harus dibayar? Jelaskan rinciannya." },
        { id: "issues", label: "Cari kejanggalan", question: "Apakah ada data yang hilang atau kejanggalan pada invoice ini?" },
        { id: "payment", label: "Ketentuan pembayaran", question: "Bagaimana ketentuan pembayarannya?" },
      ];
      setTemplates(base);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, invoiceId, batchId, messages: [{ role: "user", content: question }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal" }));
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${err.error}` }]);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: fullText };
                  return next;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] fade-in" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideInRight 0.25s ease-out" }}>
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-[pulse_2s_ease-in-out_infinite]" />
              Invoice Copilot
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Tanya tentang invoice ini</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 transition flex items-center justify-center text-gray-400 hover:text-gray-600" aria-label="Tutup">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Templates */}
        {messages.length === 0 && templates.length > 0 && (
          <div className="px-5 py-3 border-b shrink-0">
            <p className="text-xs text-gray-400 mb-2 font-medium">Pertanyaan cepat:</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => ask(t.question)}
                  className="chip-indigo cursor-pointer hover:bg-primary-100 active:scale-95 transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-8">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center text-2xl mx-auto mb-3">💬</div>
              <p className="font-medium text-gray-600">Tanyakan apa saja</p>
              <p className="text-xs mt-1">Jawaban disertai referensi halaman.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} scale-in`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-md shadow-sm"
                    : "bg-gray-50 text-gray-800 rounded-bl-md border border-gray-100"
                }`}
              >
                {m.content || ""}
                {m.role === "assistant" && m.content === "" && loading && (
                  <span className="inline-flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Tanyakan hal lain tentang invoice..."
              className="input flex-1"
            />
            <button
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              className="btn-primary btn-sm !px-3"
              aria-label="Kirim"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}