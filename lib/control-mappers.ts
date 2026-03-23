import type {
  LicenseListItem,
  ServiceCatalogItem,
  TenantListItem,
  TenantServiceBinding,
} from "@/lib/control-types";

export function extractArray<T = unknown>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object") {
    const source = input as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      result?: unknown;
    };
    if (Array.isArray(source.data)) return source.data as T[];
    if (Array.isArray(source.items)) return source.items as T[];
    if (Array.isArray(source.results)) return source.results as T[];
    if (Array.isArray(source.result)) return source.result as T[];
    if (source.data && typeof source.data === "object") {
      const nested = source.data as { items?: unknown; results?: unknown; result?: unknown; data?: unknown };
      if (Array.isArray(nested.items)) return nested.items as T[];
      if (Array.isArray(nested.results)) return nested.results as T[];
      if (Array.isArray(nested.result)) return nested.result as T[];
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
  }
  return [];
}

export function normalizeControlStatus(input?: string, options?: { isActive?: boolean; blocked?: boolean }) {
  if (options?.blocked) return "bloqueado";
  if (options?.isActive === true) return "ativo";
  if (options?.isActive === false) return "bloqueado";

  const status = (input ?? "").trim().toLowerCase();
  if (!status) return "pendente";
  if (["ativo", "active", "enabled", "operacional"].includes(status)) return "ativo";
  if (["bloqueado", "bloqueada", "blocked", "disabled", "suspenso", "suspended"].includes(status)) return "bloqueado";
  if (["expirando", "expiring"].includes(status)) return "expirando";
  if (["expirada", "expired"].includes(status)) return "expirada";
  return status;
}

export function formatControlDate(dateValue?: string) {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString("pt-BR");
}

export function mapServiceToCard(service: ServiceCatalogItem) {
  return {
    id: service.id,
    name: service.name,
    key: service.key ?? "",
    description: service.description || "Sem descrição informada.",
    status: normalizeControlStatus(service.status, { isActive: service.isActive }),
    type: service.category || service.type || "Sem categoria",
    activeClients: service.activeClients ?? 0,
    updatedAt: formatControlDate(service.updatedAt || service.createdAt),
  };
}

export function mapTenantToRow(tenant: TenantListItem) {
  return {
    id: tenant.id,
    name: tenant.name,
    identifier: tenant.slug ?? tenant.id,
    email: tenant.email ?? tenant.contactEmail ?? "N/A",
    plan: tenant.plan ?? "N/A",
    status: normalizeControlStatus(tenant.status),
    createdAt: formatControlDate(tenant.createdAt ?? tenant.updatedAt),
  };
}

export function mapBindingToRow(binding: TenantServiceBinding) {
  return {
    id: binding.id,
    tenant: binding.tenantName ?? binding.tenant ?? binding.clientName ?? "N/A",
    service: binding.serviceName ?? binding.service ?? "N/A",
    plan: binding.plan ?? "N/A",
    status: normalizeControlStatus(binding.status),
    activatedAt: formatControlDate(binding.activatedAt),
    suspendedAt: formatControlDate(binding.suspendedAt),
    createdAt: formatControlDate(binding.createdAt),
  };
}

export function mapLicenseToRow(license: LicenseListItem) {
  const normalizedStatus = normalizeControlStatus(license.status, { blocked: license.blocked });
  const expirationLabel = formatControlDate(license.expiration ?? license.updatedAt);
  const isBlocked = normalizedStatus === "bloqueado";
  let validityLabel = "N/A";
  if (typeof license.validityDays === "number") {
    validityLabel = `${license.validityDays} dias`;
  } else if (license.expiration) {
    const expiresAt = new Date(license.expiration);
    if (!Number.isNaN(expiresAt.getTime())) {
      const daysLeft = Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );
      validityLabel = `${daysLeft} dias`;
    }
  }

  return {
    ...license,
    environment: license.environment ?? "N/A",
    expiration: expirationLabel,
    statusBadge: normalizedStatus,
    blocked: isBlocked,
    validityLabel,
  };
}
