"use client";

import {
  ActionButton,
  ActionFeedback,
  ControlErrorState,
  ControlLoadingState,
  EmptyState,
  QuickDetailPanel,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/control";
import {
  getBillingItems,
  getBillingOverview,
  isBillingItemsReadAvailable,
  isBillingSyncAvailable,
  syncBillingItemStatus,
} from "@/lib/control-api";
import type { BillingItem, BillingItemStatus, BillingOverview } from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const fallbackOverview: BillingOverview = {
  estimatedMrr: 482300,
  pendingCharges: 3,
  overdueCharges: 1,
  paidInMonth: 451900,
};

const fallbackRows: BillingItem[] = [
  {
    id: "mock-1",
    client: "Grupo Solaris",
    amount: 1890,
    status: "pago",
    method: "Cartão",
    provider: "Stripe",
    reference: "inv_001992",
    date: "20/03/2026",
  },
  {
    id: "mock-2",
    client: "Aster Labs",
    amount: 990,
    status: "pendente",
    method: "PIX",
    provider: "Asaas",
    reference: "inv_001993",
    date: "20/03/2026",
  },
  {
    id: "mock-3",
    client: "Vitta Foods",
    amount: 590,
    status: "falhou",
    method: "Boleto",
    provider: "Asaas",
    reference: "inv_001994",
    date: "19/03/2026",
  },
];

function money(value: number) {
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function normalizeBillingStatus(status?: string): BillingItemStatus {
  const value = (status ?? "").toLowerCase();
  if (value === "pago") return "pago";
  if (value === "falhou") return "falhou";
  return "pendente";
}

export default function BillingPage() {
  const [overview, setOverview] = useState<BillingOverview>(fallbackOverview);
  const [overviewIsReal, setOverviewIsReal] = useState(false);
  const [rows, setRows] = useState<BillingItem[]>(fallbackRows);
  const [rowsAreReal, setRowsAreReal] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | BillingItemStatus>("todos");
  const [providerFilter, setProviderFilter] = useState("todos");
  const [methodFilter, setMethodFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  async function loadBillingData() {
    setLoadingOverview(true);
    setLoadingRows(true);
    setOverviewError(null);
    setRowsError(null);

    const [overviewResult, rowsResult] = await Promise.all([
      getBillingOverview({ cache: "no-store" }),
      getBillingItems({ cache: "no-store" }),
    ]);

    if (overviewResult.data && !overviewResult.error) {
      setOverview(overviewResult.data);
      setOverviewIsReal(true);
    } else {
      setOverview(fallbackOverview);
      setOverviewIsReal(false);
      setOverviewError(overviewResult.error ?? "Não foi possível carregar o resumo financeiro agora.");
    }

    if (Array.isArray(rowsResult.data) && !rowsResult.error) {
      setRows(rowsResult.data);
      setRowsAreReal(true);
    } else {
      setRows(fallbackRows);
      setRowsAreReal(false);
      setRowsError(rowsResult.error ?? "Não foi possível carregar os lançamentos financeiros agora.");
    }

    setLoadingOverview(false);
    setLoadingRows(false);
  }

  useEffect(() => {
    void loadBillingData();
  }, []);

  const kpis = useMemo(
    () => [
      {
        label: "Receita recorrente mensal",
        value: money(overview.estimatedMrr),
        trend: overviewIsReal ? "Dados financeiros atualizados" : "Visão de continuidade temporária",
      },
      {
        label: "Pendências financeiras",
        value: overview.pendingCharges.toLocaleString("pt-BR"),
        trend: overviewIsReal ? "Situação financeira atual" : "Visão resumida temporária",
      },
      {
        label: "Inadimplência (itens)",
        value: overview.overdueCharges.toLocaleString("pt-BR"),
        trend: overviewIsReal ? "Indicador consolidado atualizado" : "Estimativa de contingência",
      },
      {
        label: "Recebido no mês",
        value: money(overview.paidInMonth),
        trend: overviewIsReal ? "Valor atualizado em tempo real" : "Visão de continuidade temporária",
      },
    ],
    [overview, overviewIsReal],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const status = normalizeBillingStatus(row.status);
      const statusMatch = statusFilter === "todos" ? true : status === statusFilter;
      const providerMatch = providerFilter === "todos" ? true : (row.provider ?? "Não informado") === providerFilter;
      const methodMatch = methodFilter === "todos" ? true : (row.method ?? "Não informado") === methodFilter;
      const text = [row.client, row.reference ?? "", row.provider ?? "", row.method ?? ""].join(" ").toLowerCase();
      const searchMatch = query ? text.includes(query) : true;
      return statusMatch && providerMatch && methodMatch && searchMatch;
    });
  }, [methodFilter, providerFilter, rows, search, statusFilter]);

  const selectedRow = useMemo(() => rows.find((row) => row.id === selectedItemId) ?? null, [rows, selectedItemId]);
  const availableProviders = useMemo(
    () => Array.from(new Set(rows.map((row) => row.provider ?? "Não informado"))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const availableMethods = useMemo(
    () => Array.from(new Set(rows.map((row) => row.method ?? "Não informado"))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const filteredSummary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const status = normalizeBillingStatus(row.status);
        acc.total += 1;
        acc.amount += row.amount;
        if (status === "pago") acc.paid += 1;
        if (status === "pendente") acc.pending += 1;
        if (status === "falhou") acc.failed += 1;
        return acc;
      },
      { total: 0, amount: 0, paid: 0, pending: 0, failed: 0 },
    );
  }, [filteredRows]);

  async function handleCopyReference(reference?: string) {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopyFeedback(`Referência ${reference} copiada.`);
    } catch {
      setCopyFeedback("Não foi possível copiar a referência.");
    }
  }

  async function handleSync(row: BillingItem) {
    setActionError(null);
    setActionSuccess(null);
    setSyncLoadingId(row.id);
    const result = await syncBillingItemStatus(row.id);
    if (result.data && !result.error) {
      setActionSuccess(`Lançamento ${row.reference ?? row.id} atualizado com sucesso.`);
    } else {
      setActionError(result.error ?? "Não foi possível sincronizar o item.");
    }
    setSyncLoadingId(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Financeiro</h1>
        <p className="text-sm text-slate-500">
          Visão consolidada de cobranças, pagamentos e inadimplência da operação global.
        </p>
      </section>

      {overviewError ? (
        <ControlErrorState
          message={`${overviewError} Exibindo visão de continuidade sem interromper a operação.`}
        />
      ) : null}
      {rowsError && !isBillingItemsReadAvailable() ? (
        <ActionFeedback type="info" message={`${rowsError} Exibindo dados de continuidade local.`} />
      ) : null}
      {actionError ? <ControlErrorState message={actionError} /> : null}
      {actionSuccess ? <ActionFeedback type="success" message={actionSuccess} /> : null}
      {copyFeedback ? <ActionFeedback type="info" message={copyFeedback} /> : null}

      {loadingOverview ? (
        <ControlLoadingState variant="cards" />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} />
          ))}
        </section>
      )}

      <SectionCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Eventos de cobrança</h2>
          <p className="mt-1 text-sm text-slate-500">
            Leitura por lançamento para acompanhamento financeiro global.
          </p>
        </div>

        {!isBillingSyncAvailable() ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Atualização de status preparada para ativação. Esta conta ainda não possui sincronização habilitada.
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Fonte da listagem:{" "}
            <span className="font-medium text-slate-700">{rowsAreReal ? "dados em tempo real" : "dados de continuidade"}</span>
          </p>
          <ActionButton onClick={() => void loadBillingData()} loading={loadingOverview || loadingRows}>
            Atualizar visão
          </ActionButton>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Itens filtrados</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{filteredSummary.total.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Valor filtrado</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{money(filteredSummary.amount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-emerald-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-emerald-700">Pagos</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">{filteredSummary.paid.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-amber-700">Pendentes</p>
            <p className="mt-1 text-lg font-semibold text-amber-700">{filteredSummary.pending.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-red-700">Falhas</p>
            <p className="mt-1 text-lg font-semibold text-red-700">{filteredSummary.failed.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por empresa, referência ou provedor..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
            className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos provedores</option>
            {availableProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="todos">Todos métodos</option>
            {availableMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            {(["todos", "pendente", "pago", "falhou"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === filter
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter === "todos" ? "Todos" : filter}
              </button>
            ))}
          </div>
        </div>

        {loadingRows ? (
          <ControlLoadingState variant="table" />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento encontrado"
            description="Não encontramos lançamentos com os filtros aplicados."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Método
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Provedor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Referência
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.client}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{money(row.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={normalizeBillingStatus(row.status)} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.method}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.provider}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{row.reference}</span>
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                          onClick={() => void handleCopyReference(row.reference)}
                        >
                          Copiar
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.date}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          onClick={() => setSelectedItemId(row.id)}
                        >
                          Ver detalhes
                        </button>
                        <ActionButton
                          className="px-2.5 py-1"
                          disabled={!isBillingSyncAvailable()}
                          loading={syncLoadingId === row.id}
                          onClick={() => void handleSync(row)}
                        >
                          Sincronizar
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <QuickDetailPanel
        open={Boolean(selectedRow)}
        title="Detalhes da cobrança"
        onClose={() => setSelectedItemId(null)}
        actions={
          selectedRow ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ActionButton onClick={() => void handleCopyReference(selectedRow.reference)}>Copiar referência</ActionButton>
              <ActionButton
                disabled={!isBillingSyncAvailable()}
                loading={syncLoadingId === selectedRow.id}
                onClick={() => void handleSync(selectedRow)}
              >
                Sincronizar
              </ActionButton>
            </div>
          ) : null
        }
      >
        {selectedRow ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
              <p className="mt-1 font-semibold">{selectedRow.client}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={normalizeBillingStatus(selectedRow.status)} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Valor</p>
              <p className="mt-1">{money(selectedRow.amount)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Método</p>
              <p className="mt-1">{selectedRow.method ?? "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Provedor</p>
              <p className="mt-1">{selectedRow.provider ?? "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Data</p>
              <p className="mt-1">{selectedRow.date ?? "Não informado"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Referência externa</p>
              <p className="mt-1 font-mono">{selectedRow.reference ?? "Não informado"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Origem dos dados</p>
              <p className="mt-1">{rowsAreReal ? "Dados financeiros em tempo real" : "Dados de continuidade da interface"}</p>
            </div>
          </div>
        ) : null}
      </QuickDetailPanel>
    </div>
  );
}
