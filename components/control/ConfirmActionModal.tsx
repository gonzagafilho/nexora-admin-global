type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  loading?: boolean;
};

export function ConfirmActionModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  loading = false,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
