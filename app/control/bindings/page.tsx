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
import {
  getTenantServiceBindings,
  isTenantBindingMutationAvailable,
  updateTenantServiceBindingStatus,
} from "@/lib/control-api";
import { mapBindingToRow } from "@/lib/control-mappers";
import type { TenantServiceBinding, TenantServiceBindingStatus } from "@/lib/control-types";
import { useEffect, useMemo, useState } from "react";

const fallbackBindings: TenantServiceBinding[] = [
  {
    id: "b-1",
    tenantName: "Grupo Solaris",
    serviceName: "Cardápio Digital",
    plan: "Enterprise",
    status: "Ativo",
    activatedAt: "20/03/2026",
    createdAt: "20/03/2026",
  },
  {
    id: "b-2",
    tenantName: "Clube Orizzon",
    serviceName: "Chatbot",
    plan: "Pro",
    status: "Ativo",
    activatedAt: "19/03/2026",
    createdAt: "19/03/2026",
  },
  {
    id: "b-3",
    tenantName: "Aster Labs",
    serviceName: "Site Builder",
    plan: "Business",
    status: "Pendente",
    activatedAt: "18/03/2026",
    createdAt: "18/03/2026",
  },
  {
    id: "b-4",
    tenantName: "Mercado Prisma",
    serviceName: "Cardápio Digital",
    plan: "Starter",
    status: "Ativo",
    activatedAt: "17/03/2026",
    createdAt: "17/03/2026",
  },
  {
    id: "b-5",
    tenantName: "Vitta Foods",
    serviceName: "Chatbot",
    plan: "Pro",
    status: "Suspenso",
    activatedAt: "16/03/2026",
    suspendedAt: "19/03/2026",
    createdAt: "16/03/2026",
  },
];

export default function BindingsPage() {
  const [bindings, setBindings] = useState<TenantServiceBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    tenant: string;
    nextStatus: TenantServiceBindingStatus;
  } | null>(null);
  const [selectedBindingId, setSelectedBindingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBindings() {
      setLoading(true);
      setError(null);

      const result = await getTenantServiceBindings({ cache: "no-store" });
      if (!active) return;

      if (Array.isArray(result.data) && !result.error) {
        setBindings(result.data);
      } else {
        setBindings(fallbackBindings);
        setError(result.error ?? "Não foi possível carregar as contratações agora.");
      }
      setLoading(false);
    }

    void loadBindings();
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    return bindings.map(mapBindingToRow);
  }, [bindings]);

  const selectedBinding = useMemo(
    () => rows.find((row) => row.id === selectedBindingId) ?? null,
    [rows, selectedBindingId],
  );

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoadingId(confirmAction.id);

    const result = await updateTenantServiceBindingStatus(confirmAction.id, confirmAction.nextStatus);

    if (result.data && !result.error) {
      setBindings((previous) =>
        previous.map((item) => {
          if (item.id !== confirmAction.id) return item;
          const now = new Date().toISOString();
          const next =
            confirmAction.nextStatus === "ativo"
              ? { ...item, status: "Ativo", activatedAt: item.activatedAt ?? now, suspendedAt: undefined }
              : { ...item, status: "Suspenso", suspendedAt: now };
          return next;
        }),
      );
      setActionSuccess(`Contratação de ${confirmAction.tenant} atualizada com sucesso.`);
    } else {
      setActionError(result.error ?? "Não foi possível concluir a ação na contratação.");
    }

    setActionLoadingId(null);
    setConfirmAction(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contratações</h1>
        <p className="text-sm text-slate-500">
          Visão clara de qual cliente está vinculado a cada produto.
        </p>
      </section>

      {!isTenantBindingMutationAvailable() ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
          Ações de gestão preparadas para ativação. Esta conta ainda não possui alteração de status habilitada.
        </section>
      ) : null}

      {error ? <ControlErrorState message={`${error} Exibindo visão de continuidade para manter a operação.`} /> : null}
      {actionError ? <ControlErrorState message={actionError} /> : null}
      {actionSuccess ? <ActionFeedback type="success" message={actionSuccess} /> : null}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nenhuma contratação encontrada"
          description="As contratações entre empresas e soluções aparecerão aqui conforme forem registradas."
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
                  Solução
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plano
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ativado em
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Suspenso em
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
              {rows.map((binding) => (
                <tr key={binding.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{binding.tenant}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{binding.service}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{binding.plan}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={binding.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{binding.activatedAt}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{binding.suspendedAt}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{binding.createdAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ActionButton onClick={() => setSelectedBindingId(binding.id)}>
                        Ver detalhes
                      </ActionButton>
                      <ActionButton
                        disabled={!isTenantBindingMutationAvailable()}
                        loading={actionLoadingId === binding.id}
                        onClick={() =>
                          setConfirmAction({
                            id: binding.id,
                            tenant: binding.tenant,
                            nextStatus: "ativo",
                          })
                        }
                      >
                        Ativar
                      </ActionButton>
                      <ActionButton
                        disabled={!isTenantBindingMutationAvailable()}
                        loading={actionLoadingId === binding.id}
                        onClick={() =>
                          setConfirmAction({
                            id: binding.id,
                            tenant: binding.tenant,
                            nextStatus: "suspenso",
                          })
                        }
                      >
                        Suspender
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
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
            ? `Confirmar alteração da ativação de ${confirmAction.tenant} para ${confirmAction.nextStatus}?`
            : ""
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmAction()}
        loading={Boolean(confirmAction && actionLoadingId === confirmAction.id)}
      />

      <QuickDetailPanel
        open={Boolean(selectedBinding)}
        title="Detalhes da ativação"
        onClose={() => setSelectedBindingId(null)}
        actions={
          selectedBinding ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ActionButton
                loading={actionLoadingId === selectedBinding.id}
                onClick={() =>
                  setConfirmAction({
                    id: selectedBinding.id,
                    tenant: selectedBinding.tenant,
                    nextStatus: "ativo",
                  })
                }
              >
                Ativar
              </ActionButton>
              <ActionButton
                loading={actionLoadingId === selectedBinding.id}
                onClick={() =>
                  setConfirmAction({
                    id: selectedBinding.id,
                    tenant: selectedBinding.tenant,
                    nextStatus: "suspenso",
                  })
                }
              >
                Suspender
              </ActionButton>
            </div>
          ) : null
        }
      >
        {selectedBinding ? (
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
              <p className="mt-1 font-semibold">{selectedBinding.tenant}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Solução</p>
              <p className="mt-1">{selectedBinding.service || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Plano</p>
              <p className="mt-1">{selectedBinding.plan || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={selectedBinding.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Ativado em</p>
              <p className="mt-1">{selectedBinding.activatedAt || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Suspenso em</p>
              <p className="mt-1">{selectedBinding.suspendedAt || "Não informado"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Criado em</p>
              <p className="mt-1">{selectedBinding.createdAt || "Não informado"}</p>
            </div>
          </div>
        ) : null}
      </QuickDetailPanel>
    </div>
  );
}
