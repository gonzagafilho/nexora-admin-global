/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  ControlErrorState,
  ControlLoadingState,
  DataTableShell,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/control";
import {
  getBillingOverview,
  getControlOverview,
  getMasterServicesCatalog,
  getTenantsList,
  getTenantServiceBindings,
} from "@/lib/control-api";
import { normalizeControlStatus } from "@/lib/control-mappers";
import type {
  BillingOverview,
  ControlOverview,
  ServiceCatalogItem,
  TenantListItem,
  TenantServiceBinding,
} from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const fallbackTenants: TenantListItem[] = [
  { id: "t1", name: "Grupo Solaris", email: "admin@gruposolaris.com", plan: "Enterprise", status: "ativo", createdAt: "Hoje, 09:14" },
  { id: "t2", name: "Clube Orizzon", email: "contato@clubeorizzon.com", plan: "Pro", status: "ativo", createdAt: "Hoje, 08:37" },
  { id: "t3", name: "Vitta Foods", email: "ti@vittafoods.com", plan: "Business", status: "bloqueado", createdAt: "Ontem, 18:22" },
  { id: "t4", name: "Aster Labs", email: "ops@asterlabs.io", plan: "Starter", status: "ativo", createdAt: "Ontem, 16:05" },
  { id: "t5", name: "Mercado Prisma", email: "financeiro@mercadoprisma.com", plan: "Pro", status: "ativo", createdAt: "Ontem, 14:41" },
];

const fallbackServices: ServiceCatalogItem[] = [
  { id: "s1", name: "Cardápio Digital", type: "SaaS", status: "Operacional", description: "Plataforma de cardápio em tempo real.", activeClients: 842 },
  { id: "s2", name: "Chatbot", type: "SaaS", status: "Operacional", description: "Atendimento automatizado omnichannel.", activeClients: 516 },
  { id: "s3", name: "Site Builder", type: "Licenciado", status: "Beta", description: "Construtor visual para presença digital.", activeClients: 137 },
];

const fallbackBindings: TenantServiceBinding[] = [
  { id: "b1", tenantName: "Grupo Solaris", serviceName: "Cardápio Digital", status: "Ativo", activatedAt: "20/03/2026" },
  { id: "b2", tenantName: "Clube Orizzon", serviceName: "Chatbot", status: "Ativo", activatedAt: "19/03/2026" },
  { id: "b3", tenantName: "Aster Labs", serviceName: "Site Builder", status: "Pendente", activatedAt: "18/03/2026" },
];

const fallbackOverview: ControlOverview = {
  totalTenants: 1284,
  activeServices: 3917,
  estimatedMrr: 482300,
  pendingCharges: 3,
};

const fallbackBilling: BillingOverview = {
  estimatedMrr: 482300,
  pendingCharges: 3,
  overdueCharges: 1,
  paidInMonth: 451900,
};

const chartBars = [62, 74, 58, 81, 69, 88, 93];

type SourceState = {
  overviewReal: boolean;
  tenantsReal: boolean;
  servicesReal: boolean;
  bindingsReal: boolean;
  billingReal: boolean;
};

function hasUsefulOverviewData(input: ControlOverview | null | undefined) {
  if (!input) return false;
  return (
    input.totalTenants > 0 ||
    input.activeServices > 0 ||
    input.estimatedMrr > 0 ||
    input.pendingCharges >= 0
  );
}

export default function ControlDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ControlOverview>(fallbackOverview);
  const [tenants, setTenants] = useState<TenantListItem[]>(fallbackTenants);
  const [services, setServices] = useState<ServiceCatalogItem[]>(fallbackServices);
  const [bindings, setBindings] = useState<TenantServiceBinding[]>(fallbackBindings);
  const [billing, setBilling] = useState<BillingOverview>(fallbackBilling);
  const [sourceState, setSourceState] = useState<SourceState>({
    overviewReal: false,
    tenantsReal: false,
    servicesReal: false,
    bindingsReal: false,
    billingReal: false,
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setFatalError(null);

      const [overviewRes, tenantsRes, servicesRes, bindingsRes, billingRes] = await Promise.all([
        getControlOverview({ cache: "no-store" }),
        getTenantsList({ cache: "no-store" }),
        getMasterServicesCatalog({ cache: "no-store" }),
        getTenantServiceBindings({ cache: "no-store" }),
        getBillingOverview({ cache: "no-store" }),
      ]);

      if (!active) return;

      const normalizedOverview = overviewRes.data;
      const overviewError = Boolean(overviewRes.error);
      const usefulOverview = hasUsefulOverviewData(normalizedOverview);

      const nextSourceState: SourceState = {
        overviewReal: Boolean(!overviewError && usefulOverview),
        tenantsReal: Boolean(tenantsRes.data && !tenantsRes.error),
        servicesReal: Boolean(servicesRes.data && !servicesRes.error),
        bindingsReal: Boolean(bindingsRes.data && !bindingsRes.error),
        billingReal: Boolean(billingRes.data && !billingRes.error),
      };

      if (nextSourceState.overviewReal && overviewRes.data) setOverview(overviewRes.data);
      if (nextSourceState.tenantsReal && Array.isArray(tenantsRes.data)) setTenants(tenantsRes.data);
      if (nextSourceState.servicesReal && Array.isArray(servicesRes.data)) setServices(servicesRes.data);
      if (nextSourceState.bindingsReal && Array.isArray(bindingsRes.data)) setBindings(bindingsRes.data);
      if (nextSourceState.billingReal && billingRes.data) setBilling(billingRes.data);

      const shouldShowGlobalFallback = overviewError || !usefulOverview;
      if (shouldShowGlobalFallback) {
        setFatalError("Não foi possível carregar os indicadores agora. Exibindo visão de continuidade.");
      }

      setSourceState(nextSourceState);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const kpiCards = useMemo(() => {
    const mrr = sourceState.billingReal ? billing.estimatedMrr : overview.estimatedMrr;
    const pending = sourceState.billingReal ? billing.pendingCharges : overview.pendingCharges;
    return [
      {
        label: "Empresas ativas",
        value: overview.totalTenants.toLocaleString("pt-BR"),
        trend: sourceState.overviewReal ? "Base operacional atualizada" : "Valor estimado temporariamente",
        icon: "EMP",
      },
      {
        label: "Soluções ativas",
        value: overview.activeServices.toLocaleString("pt-BR"),
        trend: sourceState.overviewReal ? "Portfólio em operação real" : "Valor estimado temporariamente",
        icon: "SOL",
      },
      {
        label: "Receita mensal recorrente",
        value: `R$ ${mrr.toLocaleString("pt-BR")}`,
        trend: sourceState.billingReal ? "Atualizada pela base financeira" : "Estimativa com base no panorama atual",
        icon: "RMR",
      },
      {
        label: "Pendências financeiras",
        value: pending.toLocaleString("pt-BR"),
        trend: sourceState.billingReal ? "Monitoramento financeiro em tempo real" : "Estimativa baseada no panorama atual",
        icon: "FIN",
      },
    ];
  }, [overview, billing, sourceState.billingReal, sourceState.overviewReal]);

  const latestCompanies = useMemo(
    () => {
      const safeTenants = Array.isArray(tenants) ? tenants : [];
      return safeTenants.slice(0, 5).map((tenant) => ({
        name: tenant.name,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
      }));
    },
    [tenants],
  );

  const growthIndicators = useMemo(() => {
    const start = chartBars[0] ?? 0;
    const end = chartBars[chartBars.length - 1] ?? 0;
    const growthPercent = start > 0 ? ((end - start) / start) * 100 : 0;
    const newCompanies = latestCompanies.length;
    const evolution = sourceState.billingReal
      ? "Evolução de receita com base financeira real"
      : "Evolução estimada com base operacional";
    return {
      newCompanies,
      growthPercent,
      evolution,
      weeklyBars: chartBars,
    };
  }, [latestCompanies.length, sourceState.billingReal]);

  const topSolutions = useMemo(() => {
    const safeBindings = Array.isArray(bindings) ? bindings : [];
    const countBySolution = new Map<string, number>();

    for (const binding of safeBindings) {
      const solution = binding.serviceName || "Solução não identificada";
      countBySolution.set(solution, (countBySolution.get(solution) ?? 0) + 1);
    }

    return Array.from(countBySolution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([solution, contracts]) => ({ solution, contracts }));
  }, [bindings]);

  const systemAlerts = useMemo(() => {
    const alerts: { title: string; detail: string; status: string }[] = [];
    const safeServices = Array.isArray(services) ? services : [];
    const safeBindings = Array.isArray(bindings) ? bindings : [];
    const safeTenants = Array.isArray(tenants) ? tenants : [];
    const pendingCharges = sourceState.billingReal ? billing.pendingCharges : overview.pendingCharges;
    const companiesAtRisk = safeTenants.filter((tenant) =>
      ["bloqueado", "suspenso", "pendente"].includes(normalizeControlStatus(tenant.status)),
    ).length;

    if (pendingCharges > 0) {
      alerts.push({
        title: `${pendingCharges} pendência(s) financeira(s)`,
        detail: "Pendências que exigem atenção imediata da equipe financeira.",
        status: "pendente",
      });
    }

    const betaOrExpansion = safeServices.filter((service) => {
      const normalized = normalizeControlStatus(service.status, { isActive: service.isActive });
      return ["beta", "em expansão"].includes(normalized);
    }).length;
    if (betaOrExpansion > 0) {
      alerts.push({
        title: `${betaOrExpansion} solução(ões) com expansão acelerada`,
        detail: "Soluções com maior crescimento pedem acompanhamento de capacidade.",
        status: "beta",
      });
    }

    const inactiveBindings = safeBindings.filter((binding) =>
      ["pendente", "bloqueado", "suspenso"].includes(normalizeControlStatus(binding.status)),
    ).length;
    if (inactiveBindings > 0) {
      alerts.push({
        title: `${inactiveBindings} contratação(ões) com atenção operacional`,
        detail: "Contratações fora do padrão ativo precisam de revisão de atendimento.",
        status: "expirando",
      });
    }

    if (companiesAtRisk > 0) {
      alerts.push({
        title: `${companiesAtRisk} empresa(s) com risco de churn`,
        detail: "Empresas com necessidade de acompanhamento próximo do time comercial.",
        status: "bloqueado",
      });
    }

    if (!alerts.length) {
      alerts.push({
        title: "Panorama operacional estável",
        detail: "Nenhum ponto crítico identificado no monitoramento atual.",
        status: "operacional",
      });
    }

    return alerts.slice(0, 3);
  }, [billing.pendingCharges, bindings, overview.pendingCharges, services, sourceState.billingReal, tenants]);

  const operationalMetrics = useMemo(() => {
    const expiringItems = systemAlerts.filter((alert) => alert.status === "expirando").length;
    const pendingItems = systemAlerts.filter((alert) => alert.status === "pendente").length;
    const riskCompanies = systemAlerts.some((alert) => alert.title.includes("empresa")) ? 1 : 0;
    return { expiringItems, pendingItems, riskCompanies };
  }, [systemAlerts]);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
        title="Painel Executivo"
          subtitle="Controle operacional e comercial da plataforma Nexora."
        />
        <ControlLoadingState variant="mixed" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Executivo"
        subtitle="Visão executiva comercial com foco em crescimento, operação e valor recorrente."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Exportar
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Nova empresa
            </button>
          </div>
        }
      />

      {fatalError ? <ControlErrorState message={fatalError} /> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            trend={card.trend}
            icon={
              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                {card.icon}
              </span>
            }
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Crescimento de receita nos últimos 7 dias</h2>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              Atualizado há 5 min
            </span>
          </div>
          <div className="flex h-72 items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            {chartBars.map((bar, index) => (
              <div
                key={`${bar}-${index}`}
                className="group relative flex-1 rounded-md bg-blue-100"
                style={{ height: `${bar}%` }}
              >
                <div className="absolute inset-0 rounded-md bg-gradient-to-t from-blue-500 to-blue-300 transition-opacity duration-200 group-hover:opacity-85" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Novas empresas no período</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {growthIndicators.newCompanies.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Crescimento percentual</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {growthIndicators.growthPercent.toFixed(1).replace(".", ",")}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Evolução da receita</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{growthIndicators.evolution}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-semibold text-slate-900">Operação e riscos</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-700">Licenças próximas do vencimento</p>
              <span className="text-sm font-semibold text-slate-800">{operationalMetrics.expiringItems}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-700">Pendências que exigem atenção</p>
              <span className="text-sm font-semibold text-slate-800">{operationalMetrics.pendingItems}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-700">Empresas com risco</p>
              <span className="text-sm font-semibold text-slate-800">{operationalMetrics.riskCompanies}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-700">Panorama operacional</p>
              <StatusBadge status={sourceState.overviewReal ? "operacional" : "pendente"} />
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTableShell title="Empresas recentes" subtitle="Novas empresas adicionadas no período mais recente.">
          {latestCompanies.length === 0 ? (
            <EmptyState
              title="Nenhuma empresa encontrada"
              description="Assim que novas empresas forem adicionadas, elas aparecerão aqui."
            />
          ) : (
            <ul className="space-y-3">
              {latestCompanies.map((company) => (
                <li
                  key={`${company.name}-${company.createdAt}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.plan}</p>
                  </div>
                  <span className="text-xs text-slate-500">{company.createdAt}</span>
                </li>
              ))}
            </ul>
          )}
        </DataTableShell>

        <SectionCard>
          <h2 className="text-lg font-semibold text-slate-900">Alertas prioritários</h2>
          <p className="mt-1 text-sm text-slate-500">Sinais de negócio que exigem acompanhamento imediato.</p>
          <ul className="mt-5 space-y-3">
            {systemAlerts.map((alert) => (
              <li key={alert.title} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                  <StatusBadge status={alert.status} />
                </div>
                <p className="mt-1 text-xs text-slate-600">{alert.detail}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard>
          <h2 className="text-lg font-semibold text-slate-900">Soluções mais contratadas</h2>
          <p className="mt-1 text-sm text-slate-500">Panorama das soluções com maior volume de contratações.</p>
          {topSolutions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Sem volume de contratações suficiente para análise no momento.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {topSolutions.map((item) => (
                <li
                  key={item.solution}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-800">{item.solution}</p>
                  <span className="text-xs font-medium text-slate-600">
                    {item.contracts.toLocaleString("pt-BR")} contratação(ões)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-semibold text-slate-900">Panorama executivo rápido</h2>
          <p className="mt-1 text-sm text-slate-500">Resumo comercial para tomada de decisão imediata.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Receita mensal recorrente em{" "}
              <span className="font-semibold">
                {sourceState.billingReal ? "base financeira real" : "estimativa operacional segura"}
              </span>
              .
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {latestCompanies.length.toLocaleString("pt-BR")} empresa(s) recente(s) para acompanhamento de expansão.
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {systemAlerts.length.toLocaleString("pt-BR")} alerta(s) de negócio em monitoramento executivo.
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
