"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

const OVERLAY_BASE =
  "fixed inset-0 top-0 left-0 w-[100vw] min-w-full h-[100vh] min-h-screen overflow-hidden flex justify-end z-[100]";
const BACKDROP_CLASS =
  "absolute inset-0 bg-black/40 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out";

const WIDTH_CLASS = {
  sm: "max-w-full sm:max-w-sm",
  md: "max-w-full sm:max-w-md",
  lg: "max-w-full sm:max-w-lg",
} as const;

type WidthKey = keyof typeof WIDTH_CLASS;

export interface SlideOverFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: WidthKey;
  /** Optional sticky footer (e.g. Save / Cancel). If function, receives onRequestClose to trigger animated close. */
  footer?: React.ReactNode | ((onRequestClose: () => void) => React.ReactNode);
  /** Optional aria-describedby for the dialog description. */
  ariaDescribedBy?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

const TRANSITION_PANEL =
  "transition-transform duration-300 ease-in-out transform";

export default function SlideOverForm({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
  footer,
  ariaDescribedBy,
}: SlideOverFormProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Close: animate out then notify parent (useEffect below runs timeout)
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, handleClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const focusable = getFocusableElements(panel);
      if (focusable.length > 0) {
        const first = focusable[0];
        requestAnimationFrame(() => first.focus());
      }
    }
    return () => {
      if (previousActiveElement.current?.focus) {
        try {
          previousActiveElement.current.focus();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Enter: start off-screen, then transition to visible
  useEffect(() => {
    if (!isOpen) return;
    setEntered(false);
    setIsClosing(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isClosing) return;
    const t = window.setTimeout(() => onClose(), 300);
    return () => window.clearTimeout(t);
  }, [isClosing, onClose]);

  if (!isOpen) return null;

  const panelVisible = entered && !isClosing;
  const backdropOpacity = panelVisible ? "opacity-100" : "opacity-0";
  const panelTranslate = panelVisible ? "translate-x-0" : "translate-x-full";

  const content = (
    <div
      className={OVERLAY_BASE}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slide-over-form-title"
      aria-describedby={ariaDescribedBy}
    >
      <div
        className={`${BACKDROP_CLASS} ${backdropOpacity}`}
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className={`w-full ${WIDTH_CLASS[width]} h-full bg-white dark:bg-surface-800 shadow-2xl border-l border-surface-200 dark:border-surface-700 flex flex-col ${TRANSITION_PANEL} ${panelTranslate}`}
        style={{ boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="shrink-0 flex items-start justify-between gap-4 p-6 pb-4 border-b border-surface-200 dark:border-surface-700">
          <h2 id="slide-over-form-title" className="text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-2 text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </div>

        {/* Sticky footer */}
        {footer != null && (
          <div className="shrink-0 p-6 pt-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
            {typeof footer === "function" ? footer(handleClose) : footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
