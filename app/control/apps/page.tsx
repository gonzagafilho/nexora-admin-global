import { EmptyState } from "@/components/control";

const apps = [
  {
    name: "Cardápio Digital",
    type: "SaaS",
    status: "Operacional",
    description: "Gestão e publicação de cardápios digitais com atualização em tempo real.",
    clients: 842,
  },
  {
    name: "Chatbot",
    type: "SaaS",
    status: "Em expansão",
    description: "Atendimento automatizado com fluxos inteligentes e integração multicanal.",
    clients: 516,
  },
  {
    name: "Site Builder",
    type: "Licenciado",
    status: "Beta",
    description: "Construtor de sites para aceleração da presença digital dos clientes.",
    clients: 137,
  },
  {
    name: "Licenças Desktop",
    type: "Licenciado",
    status: "Planejado",
    description: "Gestão centralizada de licenciamento para aplicações desktop corporativas.",
    clients: 0,
  },
];

const operationalSummary = [
  {
    application: "Cardápio Digital",
    environment: "Produção",
    status: "Operacional",
    activeClients: 842,
    lastUpdate: "Hoje, 10:42",
  },
  {
    application: "Chatbot",
    environment: "Produção",
    status: "Em expansão",
    activeClients: 516,
    lastUpdate: "Hoje, 09:58",
  },
  {
    application: "Site Builder",
    environment: "Staging",
    status: "Beta",
    activeClients: 137,
    lastUpdate: "Hoje, 08:21",
  },
  {
    application: "Licenças Desktop",
    environment: "Roadmap",
    status: "Planejado",
    activeClients: 0,
    lastUpdate: "Ontem, 18:03",
  },
];

function statusBadge(status: string) {
  if (status === "Operacional") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Em expansão") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (status === "Beta") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Aplicativos</h1>
        <p className="text-sm text-slate-500">
          Visão geral dos produtos e soluções da plataforma Nexora.
        </p>
      </section>

      {apps.length === 0 ? (
        <EmptyState
          title="Nenhum aplicativo disponível"
          description="Assim que novos produtos forem cadastrados, esta visão executiva exibirá status e adoção."
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {apps.map((app) => (
            <article
              key={app.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{app.name}</h2>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                    app.status,
                  )}`}
                >
                  {app.status}
                </span>
              </div>

              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {app.type}
              </p>

              <p className="mt-3 min-h-12 text-sm leading-relaxed text-slate-600">
                {app.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Clientes usando
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                    {app.clients.toLocaleString("pt-BR")}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Ver detalhes
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {operationalSummary.length === 0 ? (
        <EmptyState
          title="Nenhum resumo operacional"
          description="O resumo operacional será exibido quando houver métricas de ambiente e atualização de serviços."
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Resumo operacional</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Aplicativo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ambiente
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clientes ativos
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Última atualização
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {operationalSummary.map((row) => (
                <tr key={`${row.application}-${row.environment}`} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.application}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.environment}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                        row.status,
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {row.activeClients.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
