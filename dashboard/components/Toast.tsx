"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value: ToastContextValue = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2.5 text-sm text-white shadow-lg ${
              t.type === "success" ? "bg-ink" : "bg-danger"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
