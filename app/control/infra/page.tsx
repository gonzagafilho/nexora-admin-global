const metrics = [
  { label: "CPU média", value: "37%", trend: "+2.4% nas últimas 24h" },
  { label: "Memória", value: "68%", trend: "estável em janela de 7 dias" },
  { label: "Disco", value: "54%", trend: "+1.1% no mês" },
  { label: "Serviços online", value: "14/15", trend: "1 serviço em atenção" },
];

const services = [
  {
    service: "nexora-admin-global",
    port: "3000",
    status: "Online",
    environment: "Produção",
    note: "Frontend global em operação normal.",
  },
  {
    service: "nexora-api",
    port: "4000",
    status: "Online",
    environment: "Produção",
    note: "Latência dentro do esperado.",
  },
  {
    service: "nexora-app",
    port: "3100",
    status: "Atenção",
    environment: "Produção",
    note: "Pico de uso no período da manhã.",
  },
  {
    service: "billing-service",
    port: "4200",
    status: "Online",
    environment: "Produção",
    note: "Fila de cobrança processada sem atraso.",
  },
];

const environmentHealth = [
  { item: "SSL", status: "Saudável", detail: "Certificados válidos e handshake normal." },
  { item: "Banco de dados", status: "Atenção", detail: "Leve aumento de tempo em consultas pesadas." },
  { item: "PM2", status: "Saudável", detail: "Processos principais estáveis e monitorados." },
  { item: "Backup agendado", status: "Indisponível", detail: "Último job falhou e aguarda nova janela." },
];

function statusStyles(status: string) {
  if (status === "Saudável" || status === "Online") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Atenção") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-red-200 bg-red-50 text-red-700";
}

export default function InfraPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Operação</h1>
        <p className="text-sm text-slate-500">
          Visão consolidada dos recursos e serviços operacionais da plataforma.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{metric.trend}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Serviços</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Serviço
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Porta
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ambiente
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Observação
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {services.map((service) => (
                <tr key={service.service} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{service.service}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{service.port}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(
                        service.status,
                      )}`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{service.environment}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{service.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Saúde do ambiente</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {environmentHealth.map((health) => (
            <article
              key={health.item}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{health.item}</h3>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles(
                    health.status,
                  )}`}
                >
                  {health.status}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{health.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
