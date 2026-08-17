"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";
type Toast = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastType, { bg: string; icon: string; iconBg: string }> = {
  success: { bg: "border-success-100", icon: "✓", iconBg: "bg-success-50 text-success-600" },
  error: { bg: "border-danger-100", icon: "!", iconBg: "bg-danger-50 text-danger-600" },
  warning: { bg: "border-warning-100", icon: "!", iconBg: "bg-warning-50 text-warning-600" },
  info: { bg: "border-brand-100", icon: "i", iconBg: "bg-brand-50 text-brand-600" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => {
          const s = styles[t.type];
          return (
            <div
              key={t.id}
              className={`min-w-[280px] max-w-sm bg-white border ${s.bg} rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-3.5 flex items-start gap-3 scale-in`}
            >
              <span className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center text-xs font-bold shrink-0`}>
                {s.icon}
              </span>
              <p className="text-sm text-gray-700 leading-5 pt-0.5 flex-1">{t.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
                aria-label="Tutup notifikasi"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}