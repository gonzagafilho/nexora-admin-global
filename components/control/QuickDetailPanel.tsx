"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type QuickDetailPanelProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

export function QuickDetailPanel({ open, title, onClose, children, actions }: QuickDetailPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close detail panel overlay"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {actions ? <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-3">{actions}</footer> : null}
      </aside>
    </div>
  );
}
