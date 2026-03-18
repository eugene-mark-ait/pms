"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Toast from "@/components/Toast";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
  }, []);

  const removeFromState = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    const tid = timeoutsRef.current.get(id);
    if (tid) clearTimeout(tid);
    timeoutsRef.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration: number = DEFAULT_DURATION) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const item: ToastItem = { id, message, type, duration };
      setToasts((prev) => [...prev, item]);
      const tid = setTimeout(() => removeToast(id), duration);
      timeoutsRef.current.set(id, tid);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            exiting={t.exiting}
            onExited={() => removeFromState(t.id)}
          />
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
