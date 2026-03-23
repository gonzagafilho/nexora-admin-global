"use client";

import {
  ActionButton,
  ActionFeedback,
  CardSkeleton,
  ConfirmActionModal,
  ControlErrorState,
  EmptyState,
  QuickDetailPanel,
  StatusBadge,
} from "@/components/control";
import {
  getMasterServicesCatalog,
  isServiceCatalogMutationAvailable,
  updateServiceCatalogStatus,
} from "@/lib/control-api";
import { mapServiceToCard, normalizeControlStatus } from "@/lib/control-mappers";
import type { ServiceCatalogItem, ServiceCatalogStatus } from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const fallbackServices: ServiceCatalogItem[] = [
  {
    id: "fallback-cardapio-digital",
    name: "Cardápio Digital",
    type: "SaaS",
    status: "Ativo",
    description: "Plataforma web para gestão e publicação de cardápios em tempo real.",
    activeClients: 0,
  },
  {
    id: "fallback-chatbot",
    name: "Chatbot",
    type: "SaaS",
    status: "Ativo",
    description: "Atendimento automatizado com fluxos inteligentes e integração omnichannel.",
    activeClients: 0,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [detailsServiceId, setDetailsServiceId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    nextStatus: ServiceCatalogStatus;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      setLoading(true);
      setError(null);

      const result = await getMasterServicesCatalog({ cache: "no-store" });
      if (!active) return;

      if (Array.isArray(result.data) && !result.error) {
        setServices(result.data);
      } else {
        setServices(fallbackServices);
        setError(result.error ?? "Não foi possível carregar as soluções agora.");
      }

      setLoading(false);
    }

    void loadServices();

    return () => {
      active = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) => {
      const mapped = mapServiceToCard(service);
      const haystack = [
        mapped.name,
        mapped.key,
        mapped.description,
        mapped.status,
        mapped.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, services]);

  const detailsService = useMemo(() => {
    if (!detailsServiceId) return null;
    const service = services.find((item) => item.id === detailsServiceId);
    return service ? mapServiceToCard(service) : null;
  }, [detailsServiceId, services]);

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoadingId(confirmAction.id);

    const result = await updateServiceCatalogStatus(confirmAction.id, confirmAction.nextStatus);
    if (result.data && !result.error) {
      setServices((previous) =>
        previous.map((service) =>
          service.id === confirmAction.id
            ? {
                ...service,
                status: confirmAction.nextStatus === "ativo" ? "Ativo" : "Bloqueado",
                isActive: confirmAction.nextStatus === "ativo",
              }
            : service,
        ),
      );
      setActionSuccess(`Status da solução ${confirmAction.name} atualizado com sucesso.`);
    } else {
      setActionError(result.error ?? "Não foi possível concluir a ação na solução.");
    }

    setActionLoadingId(null);
    setConfirmAction(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Soluções</h1>
        <p className="text-sm text-slate-500">
          Catálogo visual das soluções disponíveis na operação Nexora.
        </p>
      </section>

      {!isServiceCatalogMutationAvailable() ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Ações de gestão preparadas para ativação. Esta conta ainda não possui alteração de status habilitada.
        </section>
      ) : null}

      <section className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-slate-500">
          {error ? "Exibindo visão de continuidade no momento." : "Soluções atualizadas em tempo real."}
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, código ou categoria..."
          className="h-10 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </section>

      {error ? <ControlErrorState message={`${error} Exibindo visão de continuidade.`} /> : null}
      {actionError ? <ControlErrorState message={actionError} /> : null}
      {actionSuccess ? <ActionFeedback type="success" message={actionSuccess} /> : null}

      {loading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton count={6} className="h-44" />
        </section>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="Nenhuma solução encontrada"
          description="Não encontramos soluções com os filtros aplicados."
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => {
            const row = mapServiceToCard(service);

            return (
            <article
              key={row.id}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{row.name}</h2>
                <StatusBadge status={row.status} />
              </div>

              <p className="mt-2 text-sm text-slate-500">{row.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {row.key ? (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                    {row.key}
                  </span>
                ) : null}
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {row.type}
                </span>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                <p>
                  Empresas ativas:{" "}
                  <span className="font-semibold text-slate-700">
                    {row.activeClients.toLocaleString("pt-BR")}
                  </span>
                </p>
                {row.updatedAt !== "N/A" ? <p className="mt-1">Atualizado em: {row.updatedAt}</p> : null}
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setDetailsServiceId(row.id)}
                >
                  Ver detalhes
                </button>
                <ActionButton
                  className="ml-2 rounded-lg text-sm"
                  disabled={!isServiceCatalogMutationAvailable()}
                  loading={actionLoadingId === row.id}
                  onClick={() =>
                    setConfirmAction({
                      id: row.id,
                      name: row.name,
                      nextStatus:
                        normalizeControlStatus(service.status, { isActive: service.isActive }) === "bloqueado"
                          ? "ativo"
                          : "bloqueado",
                    })
                  }
                >
                  {normalizeControlStatus(service.status, { isActive: service.isActive }) === "bloqueado"
                    ? "Ativar"
                    : "Desativar"}
                </ActionButton>
              </div>
            </article>
            );
          })}
        </section>
      )}

      <ConfirmActionModal
        open={Boolean(confirmAction)}
        title="Confirmar ação"
        description={
          confirmAction
            ? `Confirmar alteração da solução ${confirmAction.name} para ${confirmAction.nextStatus}?`
            : ""
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmAction()}
        loading={Boolean(confirmAction && actionLoadingId === confirmAction.id)}
      />

      <QuickDetailPanel
        open={Boolean(detailsService)}
        title="Detalhes da solução"
        onClose={() => setDetailsServiceId(null)}
      >
        {detailsService ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Nome</p>
              <p className="mt-1 font-semibold">{detailsService.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Código</p>
              <p className="mt-1 font-mono">{detailsService.key || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Categoria</p>
              <p className="mt-1">{detailsService.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={detailsService.status} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Descrição</p>
              <p className="mt-1">{detailsService.description}</p>
            </div>
          </div>
        ) : null}
      </QuickDetailPanel>
    </div>
  );
}
