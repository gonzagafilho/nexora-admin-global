"use client";

import {
  ActionFeedback,
  ControlErrorState,
  EmptyState,
  QuickDetailPanel,
  StatusBadge,
  TableSkeleton,
} from "@/components/control";
import {
  activateLicense,
  blockLicense,
  getLicensesList,
  isLicensesMutationAvailable,
  renewLicense,
} from "@/lib/control-api";
import { mapLicenseToRow } from "@/lib/control-mappers";
import type { LicenseListItem } from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const mockLicenses: LicenseListItem[] = [
  {
    id: "lic-1",
    client: "Grupo Solaris",
    product: "Site Builder",
    key: "NXR-SB-9F2K-71LM",
    expiration: "20/09/2026",
    status: "Ativa",
    environment: "Produção",
    validityDays: 184,
    blocked: false,
  },
  {
    id: "lic-2",
    client: "Clube Orizzon",
    product: "Billing Core",
    key: "NXR-BC-4A8D-53QP",
    expiration: "15/07/2026",
    status: "Ativa",
    environment: "Produção",
    validityDays: 117,
    blocked: false,
  },
  {
    id: "lic-3",
    client: "Aster Labs",
    product: "Site Builder",
    key: "NXR-SB-2M7X-89RT",
    expiration: "12/04/2026",
    status: "Expirando",
    environment: "Staging",
    validityDays: 22,
    blocked: false,
  },
  {
    id: "lic-4",
    client: "Vitta Foods",
    product: "Billing Core",
    key: "NXR-BC-6J1V-24ZN",
    expiration: "05/03/2026",
    status: "Expirada",
    environment: "Produção",
    validityDays: 0,
    blocked: true,
  },
  {
    id: "lic-5",
    client: "Mercado Prisma",
    product: "Site Builder",
    key: "NXR-SB-8Q3C-65YW",
    expiration: "28/08/2026",
    status: "Ativa",
    environment: "Produção",
    validityDays: 162,
    blocked: false,
  },
];

type LicenseLoadResult = {
  data: LicenseListItem[];
  error: string | null;
  source: "mock" | "real";
};

async function loadLicenses(): Promise<LicenseLoadResult> {
  const result = await getLicensesList({ cache: "no-store" });
  if (Array.isArray(result.data) && !result.error) {
    return {
      data: result.data,
      error: null,
      source: "real",
    };
  }

  // Visão de continuidade quando a leitura em tempo real estiver indisponível.
  return {
    data: mockLicenses,
    error: result.error,
    source: "mock",
  };
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"mock" | "real">("mock");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "expirando" | "expirada" | "bloqueado">(
    "todos",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError(null);
      const result = await loadLicenses();
      if (!active) return;
      setLicenses(result.data);
      setError(result.error);
      setSource(result.source);
      setLoading(false);
    }

    void run();
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () => licenses.map(mapLicenseToRow),
    [licenses],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusMatch = statusFilter === "todos" ? true : row.statusBadge === statusFilter;
      const text = [row.client, row.product, row.key, row.environment ?? ""].join(" ").toLowerCase();
      const queryMatch = query ? text.includes(query) : true;
      return statusMatch && queryMatch;
    });
  }, [rows, search, statusFilter]);

  const selected = useMemo(
    () => filteredRows.find((row) => row.id === selectedId) ?? null,
    [filteredRows, selectedId],
  );

  async function handleCopyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopyFeedback(`Chave ${key} copiada.`);
    } catch {
      setCopyFeedback("Não foi possível copiar a chave.");
    }
  }

  function expirationClass(status: string) {
    if (status === "expirada") return "text-red-600 font-semibold";
    if (status === "expirando") return "text-amber-600 font-semibold";
    return "text-slate-600";
  }

  async function handlePlannedAction(action: "emitir" | "renovar" | "bloquear", licenseId: string) {
    if (!isLicensesMutationAvailable()) {
      setActionInfo(`Ação "${action}" preparada para ativação nesta conta.`);
      return;
    }

    setActionInfo(null);
    setActionLoadingId(licenseId);

    const response =
      action === "emitir"
        ? await activateLicense(licenseId)
        : action === "bloquear"
          ? await blockLicense(licenseId)
          : await renewLicense(licenseId, 365);

    if (response.data && !response.error) {
      setLicenses((current) => current.map((item) => (item.id === licenseId ? response.data! : item)));
      setActionInfo(
        action === "emitir"
          ? "Licença ativada com sucesso."
          : action === "bloquear"
            ? "Licença bloqueada com sucesso."
            : "Licença renovada com sucesso.",
      );
    } else {
      setActionInfo(response.error ?? "Não foi possível concluir a ação na licença.");
    }
    setActionLoadingId(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Licenças</h1>
        <p className="text-sm text-slate-500">Gestão comercial das licenças da operação Nexora.</p>
      </section>

      {source === "mock" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Não foi possível carregar as licenças agora. Exibindo visão de continuidade.
        </section>
      ) : null}

      {!isLicensesMutationAvailable() ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Emissão, renovação e bloqueio estão preparados para ativação. Esta conta ainda não possui ações habilitadas.
        </section>
      ) : null}

      {error ? <ControlErrorState message={error} /> : null}
      {copyFeedback ? <ActionFeedback type="info" message={copyFeedback} /> : null}
      {actionInfo ? <ActionFeedback type="info" message={actionInfo} /> : null}

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por empresa, solução, chave ou ambiente..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          {(["todos", "ativo", "expirando", "expirada", "bloqueado"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === status
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status === "todos" ? "Todos" : status}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title="Nenhuma licença encontrada"
          description="As licenças aparecerão aqui assim que houver registros disponíveis."
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cliente
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Produto
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chave
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expiração
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ambiente
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Validade
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((license) => (
                <tr key={license.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{license.client}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{license.product}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                        {license.key}
                      </span>
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                        onClick={() => void handleCopyKey(license.key)}
                      >
                        Copiar
                      </button>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-sm ${expirationClass(license.statusBadge)}`}>{license.expiration}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{license.environment ?? "Não informado"}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{license.validityLabel}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={license.statusBadge} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        onClick={() => setSelectedId(license.id)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === license.id}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        onClick={() => void handlePlannedAction("emitir", license.id)}
                      >
                        {actionLoadingId === license.id ? "Processando..." : "Emitir"}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === license.id}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        onClick={() => void handlePlannedAction("renovar", license.id)}
                      >
                        {actionLoadingId === license.id ? "Processando..." : "Renovar"}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === license.id}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        onClick={() => void handlePlannedAction("bloquear", license.id)}
                      >
                        {actionLoadingId === license.id ? "Processando..." : "Bloquear"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </section>
      )}

      <QuickDetailPanel
        open={Boolean(selected)}
        title="Detalhes da licença"
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
              <p className="mt-1 font-semibold">{selected.client}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Produto</p>
              <p className="mt-1">{selected.product}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Chave</p>
              <p className="mt-1 font-mono">{selected.key}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Expiração</p>
              <p className="mt-1">{selected.expiration}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={selected.statusBadge} />
              </div>
            </div>
          </div>
        ) : null}
      </QuickDetailPanel>
    </div>
  );
}
