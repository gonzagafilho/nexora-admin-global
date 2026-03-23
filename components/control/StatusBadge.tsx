type StatusBadgeProps = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  bloqueado: "border-red-200 bg-red-50 text-red-700",
  pago: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  concluído: "border-emerald-200 bg-emerald-50 text-emerald-700",
  falhou: "border-red-200 bg-red-50 text-red-700",
  operacional: "border-emerald-200 bg-emerald-50 text-emerald-700",
  beta: "border-violet-200 bg-violet-50 text-violet-700",
  expirando: "border-amber-200 bg-amber-50 text-amber-700",
  expirada: "border-red-200 bg-red-50 text-red-700",
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = normalizeStatus(status);
  const styleClass = STATUS_STYLES[key] ?? "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styleClass}`}>
      {status}
    </span>
  );
}
