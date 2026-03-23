import type { ButtonHTMLAttributes } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function ActionButton({ loading = false, children, className = "", disabled, ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? "Processando..." : children}
    </button>
  );
}
