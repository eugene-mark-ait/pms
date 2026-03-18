"use client";

import { useEffect } from "react";
import type { ToastType } from "@/context/ToastContext";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
  onExited?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-600 text-white dark:bg-green-500",
  error: "bg-red-600 text-white dark:bg-red-500",
  info: "bg-primary-600 text-white dark:bg-primary-500",
};

export default function Toast({ message, type, exiting, onExited }: ToastProps) {
  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => onExited?.(), 300);
      return () => clearTimeout(t);
    }
  }, [exiting, onExited]);

  return (
    <div
      className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        typeStyles[type]
      } ${exiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100 animate-slide-in-right"}`}
      role="status"
    >
      {message}
    </div>
  );
}
