"use client";

import {
  ActionButton,
  ActionFeedback,
  ConfirmActionModal,
  ControlErrorState,
  EmptyState,
  QuickDetailPanel,
  StatusBadge,
  TableSkeleton,
} from "@/components/control";
import { getTenantsList, isTenantMutationAvailable, updateTenantStatus } from "@/lib/control-api";
import { mapTenantToRow, normalizeControlStatus } from "@/lib/control-mappers";
import type { TenantListItem, TenantStatus } from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const fallbackTenants: TenantListItem[] = [
  {
    id: "t-1",
    name: "Grupo Solaris",
    slug: "grupo-solaris",
    email: "admin@gruposolaris.com",
    plan: "Enterprise",
    status: "ativo",
    createdAt: "20/03/2026",
  },
  {
    id: "t-2",
    name: "Clube Orizzon",
    slug: "clube-orizzon",
    email: "contato@clubeorizzon.com",
    plan: "Pro",
    status: "ativo",
    createdAt: "19/03/2026",
  },
  {
    id: "t-3",
    name: "Aster Labs",
    slug: "aster-labs",
    email: "ops@asterlabs.io",
    plan: "Business",
    status: "bloqueado",
    createdAt: "18/03/2026",
  },
  {
    id: "t-4",
    name: "Mercado Prisma",
    slug: "mercado-prisma",
    email: "financeiro@mercadoprisma.com",
    plan: "Starter",
    status: "ativo",
    createdAt: "17/03/2026",
  },
  {
    id: "t-5",
    name: "Vitta Foods",
    slug: "vitta-foods",
    email: "ti@vittafoods.com",
    plan: "Pro",
    status: "bloqueado",
    createdAt: "16/03/2026",
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [detailsTenant, setDetailsTenant] = useState<ReturnType<typeof mapTenantToRow> | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    nextStatus: TenantStatus;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      setLoading(true);
      setError(null);
      const result = await getTenantsList({ cache: "no-store" });
      if (!active) return;

      if (Array.isArray(result.data) && !result.error) {
        setTenants(result.data);
      } else {
        setTenants(fallbackTenants);
        setError(result.error ?? "Não foi possível carregar as empresas agora.");
      }
      setLoading(false);
    }

    void loadTenants();
    return () => {
      active = false;
    };
  }, []);

  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((tenant) => {
      const row = mapTenantToRow(tenant);
      const haystack = [row.name, row.identifier, row.email, row.plan, row.status]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, tenants]);

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoadingId(confirmAction.id);

    const result = await updateTenantStatus(confirmAction.id, confirmAction.nextStatus);
    if (result.data && !result.error) {
      setTenants((previous) =>
        previous.map((tenant) =>
          tenant.id === confirmAction.id ? { ...tenant, status: confirmAction.nextStatus } : tenant,
        ),
      );
      setActionSuccess(`Status da empresa ${confirmAction.name} atualizado com sucesso.`);
    } else {
      setActionError(result.error ?? "Não foi possível concluir a ação na empresa.");
    }

    setActionLoadingId(null);
    setConfirmAction(null);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Empresas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestão de clientes da operação global Nexora
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, email ou plano..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
          />
          <button
            type="button"
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Nova empresa
          </button>
        </div>
      </section>

      {!isTenantMutationAvailable() ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Ações de gestão preparadas para ativação. Esta conta ainda não possui alteração de status habilitada.
        </section>
      ) : null}

      {error ? <ControlErrorState message={`${error} Exibindo visão de continuidade para manter a operação.`} /> : null}
      {actionError ? <ControlErrorState message={actionError} /> : null}
      {actionSuccess ? <ActionFeedback type="success" message={actionSuccess} /> : null}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa encontrada"
          description="Não encontramos empresas com os filtros aplicados."
          action={
            <button
              type="button"
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Nova empresa
            </button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Identificador
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Plano
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Criado em
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((tenant) => {
                  const row = mapTenantToRow(tenant);
                  return (
                    <tr key={tenant.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{row.identifier}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{row.email}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{row.plan}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{row.createdAt}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                            onClick={() => setDetailsTenant(row)}
                          >
                            Ver detalhes
                          </button>
                          <ActionButton
                            disabled={!isTenantMutationAvailable()}
                            loading={actionLoadingId === tenant.id}
                            onClick={() =>
                              setConfirmAction({
                                id: tenant.id,
                                name: row.name,
                                nextStatus:
                                  normalizeControlStatus(tenant.status) === "bloqueado"
                                    ? "ativo"
                                    : "bloqueado",
                              })
                            }
                          >
                            {normalizeControlStatus(tenant.status) === "bloqueado"
                              ? "Desbloquear"
                              : "Bloquear"}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmActionModal
        open={Boolean(confirmAction)}
        title="Confirmar ação"
        description={
          confirmAction
            ? `Confirmar alteração da empresa ${confirmAction.name} para ${confirmAction.nextStatus}?`
            : ""
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmAction()}
        loading={Boolean(confirmAction && actionLoadingId === confirmAction.id)}
      />

      <QuickDetailPanel
        open={Boolean(detailsTenant)}
        title="Detalhes do cliente"
        onClose={() => setDetailsTenant(null)}
        actions={
          detailsTenant ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ActionButton
                loading={actionLoadingId === detailsTenant.id}
                onClick={() =>
                  setConfirmAction({
                    id: detailsTenant.id,
                    name: detailsTenant.name,
                    nextStatus: "ativo",
                  })
                }
              >
                Desbloquear
              </ActionButton>
              <ActionButton
                loading={actionLoadingId === detailsTenant.id}
                onClick={() =>
                  setConfirmAction({
                    id: detailsTenant.id,
                    name: detailsTenant.name,
                    nextStatus: "bloqueado",
                  })
                }
              >
                Bloquear
              </ActionButton>
            </div>
          ) : null
        }
      >
        {detailsTenant ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Nome</p>
              <p className="mt-1 font-semibold">{detailsTenant.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Identificador</p>
              <p className="mt-1">{detailsTenant.identifier || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1">{detailsTenant.email || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Plano</p>
              <p className="mt-1">{detailsTenant.plan || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={detailsTenant.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Criado em</p>
              <p className="mt-1">{detailsTenant.createdAt || "Não informado"}</p>
            </div>
          </div>
        ) : null}
      </QuickDetailPanel>
    </div>
  );
}
