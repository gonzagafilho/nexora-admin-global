import { EmptyState } from "@/components/control";

const summaryCards = [
  { label: "Último backup", value: "Hoje, 03:00", indicator: "Concluído em 12 min" },
  { label: "Próximo agendado", value: "Amanhã, 03:00", indicator: "Janela automática diária" },
  { label: "Backups válidos", value: "42", indicator: "100% íntegros na última varredura" },
  { label: "Falhas recentes", value: "2", indicator: "Últimos 30 dias" },
];

const backupHistory = [
  {
    source: "nexora-admin-global",
    type: "Snapshot completo",
    date: "20/03/2026 03:00",
    size: "1.4 GB",
    status: "Concluído",
    action: "Ver detalhes",
  },
  {
    source: "nexora-api",
    type: "Incremental",
    date: "20/03/2026 02:30",
    size: "430 MB",
    status: "Concluído",
    action: "Ver detalhes",
  },
  {
    source: "billing-service",
    type: "Snapshot completo",
    date: "20/03/2026 02:10",
    size: "980 MB",
    status: "Em andamento",
    action: "Acompanhar",
  },
  {
    source: "nexora-app",
    type: "Incremental",
    date: "19/03/2026 03:00",
    size: "390 MB",
    status: "Falhou",
    action: "Reprocessar",
  },
];

function statusStyle(status: string) {
  if (status === "Concluído") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Em andamento") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export default function BackupsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Backups</h1>
        <p className="text-sm text-slate-500">
          Acompanhamento dos backups e restaurações da operação Nexora.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{card.indicator}</p>
          </article>
        ))}
      </section>

      {backupHistory.length === 0 ? (
        <EmptyState
          title="Nenhum backup encontrado"
          description="O histórico aparecerá aqui quando novos jobs de backup forem processados."
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Histórico operacional</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Origem
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Data
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tamanho
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ação
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {backupHistory.map((backup) => (
                <tr key={`${backup.source}-${backup.date}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{backup.source}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{backup.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{backup.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{backup.size}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                        backup.status,
                      )}`}
                    >
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {backup.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Política de retenção</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Diários por 7 dias</p>
            <p className="mt-1 text-xs text-slate-600">
              Cópias diárias para recuperação rápida de incidentes recentes.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Semanais por 4 semanas</p>
            <p className="mt-1 text-xs text-slate-600">
              Retenção intermediária para análise de variação operacional.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Mensais por 6 meses</p>
            <p className="mt-1 text-xs text-slate-600">
              Histórico de longo prazo para compliance e auditoria.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
