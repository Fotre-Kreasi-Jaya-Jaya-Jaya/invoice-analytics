"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  X,
  Send,
  Bot,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

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
        { id: "total", label: "Rincian bayar?", question: "Berapa total yang harus dibayar? Jelaskan rinciannya." },
        { id: "issues", label: "Cari anomali", question: "Apakah ada data yang hilang atau kejanggalan pada invoice ini?" },
        { id: "payment", label: "Ketentuan bayar", question: "Bagaimana ketentuan pembayarannya?" },
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
        const err = await res.json().catch(() => ({ error: "Gagal memproses pertanyaan" }));
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
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-10"
        style={{ animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                Invoice AI
                <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded-md border border-brand-200">
                  GPT-4o
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Asisten ekstraksi & verifikasi cerdas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 transition flex items-center justify-center text-slate-400 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates */}
        {messages.length === 0 && templates.length > 0 && (
          <div className="px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
            <p className="text-xs text-slate-500 mb-2 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Pertanyaan Cepat:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => ask(t.question)}
                  className="chip-brand cursor-pointer hover:bg-brand-100 active:scale-95 transition-all text-xs font-medium"
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
            <div className="text-center text-slate-400 text-sm mt-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700">Tanyakan apa saja tentang invoice ini</p>
              <p className="text-xs text-slate-400 mt-1">
                AI dapat menganalisis kejanggalan nominal, mendeteksi pajak ganda, serta mengonfirmasi jatuh tempo.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} scale-in`}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1 shadow-xs">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-br-xs shadow-xs"
                    : "bg-slate-50 text-slate-800 rounded-bl-xs border border-slate-100"
                }`}
              >
                {m.role === "user" ? (
                  <span className="whitespace-pre-wrap">{m.content || ""}</span>
                ) : m.content === "" && loading ? (
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">AI sedang mengetik...</span>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="my-1">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                      table: ({ children }) => <table className="w-full border-collapse my-2 text-xs">{children}</table>,
                      th: ({ children }) => <th className="border border-slate-200 bg-slate-100 px-2 py-1 text-left font-semibold">{children}</th>,
                      td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
                    }}
                  >
                    {m.content || ""}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator when waiting for stream to start */}
          {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start scale-in">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1 shadow-xs">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-xs bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                  <span className="text-xs text-slate-400 font-medium">AI sedang mengetik...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Tanyakan hal lain seputar dokumen..."
              className="input flex-1"
            />
            <button
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              className="btn-primary btn-sm !px-3 shadow-xs"
              aria-label="Kirim"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}