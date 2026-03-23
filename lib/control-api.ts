import { apiGet, apiRequest, type ApiRequestOptions, type ApiResult } from "@/lib/api";
import type {
  BillingItem,
  BillingItemStatus,
  BillingOverview,
  ControlOverview,
  LicenseListItem,
  ServiceCatalogStatus,
  ServiceCatalogItem,
  TenantStatus,
  TenantListItem,
  TenantServiceBindingStatus,
  TenantServiceBinding,
} from "@/lib/control-types";
import { extractArray } from "@/lib/control-mappers";

type ControlApiOptions = {
  token?: string;
  signal?: AbortSignal;
  next?: RequestInit["next"];
  cache?: RequestCache;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapSubscriptionToOverview(input: unknown): BillingOverview {
  if (!input || typeof input !== "object") {
    return { estimatedMrr: 0, pendingCharges: 0, overdueCharges: 0, paidInMonth: 0 };
  }
  const payload = input as Record<string, unknown>;
  const estimatedMrr =
    toNumber(payload.estimatedMrr) ||
    toNumber(payload.mrr) ||
    toNumber(payload.monthlyAmount) ||
    toNumber(payload.amount) ||
    0;
  const pendingCharges = toNumber(payload.pendingCharges);
  const overdueCharges = toNumber(payload.overdueCharges);
  const paidInMonth =
    toNumber(payload.paidInMonth) ||
    toNumber(payload.collectedInMonth) ||
    toNumber(payload.totalPaid) ||
    0;
  return { estimatedMrr, pendingCharges, overdueCharges, paidInMonth };
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function mapOverviewPayload(input: unknown): ControlOverview {
  const payload = asRecord(input);
  const data = asRecord(payload.data);
  const stats = asRecord(payload.stats);
  const dataStats = asRecord(data.stats);
  return {
    totalTenants:
      toNumber(payload.totalTenants) ||
      toNumber(data.totalTenants) ||
      toNumber(payload.tenants) ||
      toNumber(data.tenants) ||
      toNumber(payload.totalClients) ||
      toNumber(data.totalClients) ||
      toNumber(stats.tenants) ||
      toNumber(dataStats.tenants),
    activeServices:
      toNumber(payload.activeServices) ||
      toNumber(data.activeServices) ||
      toNumber(payload.services) ||
      toNumber(data.services) ||
      toNumber(payload.totalServices) ||
      toNumber(data.totalServices) ||
      toNumber(stats.services) ||
      toNumber(dataStats.services),
    estimatedMrr:
      toNumber(payload.estimatedMrr) ||
      toNumber(data.estimatedMrr) ||
      toNumber(payload.mrr) ||
      toNumber(data.mrr) ||
      toNumber(payload.monthlyRevenue) ||
      toNumber(data.monthlyRevenue) ||
      toNumber(stats.mrr) ||
      toNumber(dataStats.mrr),
    pendingCharges:
      toNumber(payload.pendingCharges) ||
      toNumber(data.pendingCharges) ||
      toNumber(payload.pendingBilling) ||
      toNumber(data.pendingBilling) ||
      toNumber(payload.pending) ||
      toNumber(data.pending) ||
      toNumber(payload.pendingInvoices) ||
      toNumber(data.pendingInvoices) ||
      toNumber(stats.pendingBilling) ||
      toNumber(dataStats.pendingBilling) ||
      toNumber(stats.pendingInvoices) ||
      toNumber(dataStats.pendingInvoices),
  };
}

function toApiOptions(options: ControlApiOptions): Omit<ApiRequestOptions, "method" | "body"> {
  return {
    token: options.token,
    signal: options.signal,
    next: options.next,
    cache: options.cache,
  };
}

export function getControlOverview(options: ControlApiOptions = {}) {
  return apiGet<unknown>("/api/control/overview", toApiOptions(options)).then((response) => {
    if (response.error || !response.data) {
      return { data: null, error: response.error, status: response.status } as ApiResult<ControlOverview>;
    }
    return {
      data: mapOverviewPayload(response.data),
      error: null,
      status: response.status,
    } as ApiResult<ControlOverview>;
  });
}

export function getMasterServicesCatalog(options: ControlApiOptions = {}) {
  return apiGet<unknown>("/api/control/services", toApiOptions(options)).then((response) => {
    if (response.error) {
      return { data: null, error: response.error, status: response.status } as ApiResult<ServiceCatalogItem[]>;
    }
    const items = extractArray<ServiceCatalogItem>(response.data);
    return {
      data: items,
      error: null,
      status: response.status,
    } as ApiResult<ServiceCatalogItem[]>;
  });
}

const SERVICE_CATALOG_MUTATION_AVAILABLE = false;
const SERVICE_CATALOG_MUTATION_PATH = "/api/master-services/catalog/:id";

export function isServiceCatalogMutationAvailable() {
  return SERVICE_CATALOG_MUTATION_AVAILABLE;
}

export async function updateServiceCatalogStatus(
  serviceId: string,
  status: ServiceCatalogStatus,
  options: ControlApiOptions = {},
): Promise<ApiResult<{ id: string; status: ServiceCatalogStatus }>> {
  if (!SERVICE_CATALOG_MUTATION_AVAILABLE) {
    return {
      data: null,
      error: "Endpoint de mutação do catálogo de serviços ainda não disponível na camada API.",
      status: 501,
    };
  }

  const path = SERVICE_CATALOG_MUTATION_PATH.replace(":id", serviceId);
  return apiRequest<{ id: string; status: ServiceCatalogStatus }>(path, {
    ...toApiOptions(options),
    method: "PATCH",
    body: { status },
  });
}

const TENANT_BINDINGS_READ_AVAILABLE = true;

export function isTenantBindingsReadAvailable() {
  return TENANT_BINDINGS_READ_AVAILABLE;
}

export async function getTenantServiceBindings(
  options: ControlApiOptions = {},
): Promise<ApiResult<TenantServiceBinding[]>> {
  if (!TENANT_BINDINGS_READ_AVAILABLE) {
    return {
      data: null,
      error:
        "Endpoint global de bindings (tenant x serviço) não disponível no backend atual. Mantendo fallback seguro.",
      status: 501,
    };
  }

  const response = await apiGet<unknown>("/api/control/bindings", toApiOptions(options));
  if (response.error) {
    return {
      data: null,
      error: response.error,
      status: response.status,
    };
  }
  return {
    data: extractArray<TenantServiceBinding>(response.data),
    error: null,
    status: response.status,
  };
}

const TENANT_BINDING_MUTATION_AVAILABLE = false;
const TENANT_BINDING_MUTATION_PATH = "/api/control/bindings/:id/status";

export function isTenantBindingMutationAvailable() {
  return TENANT_BINDING_MUTATION_AVAILABLE;
}

export async function updateTenantServiceBindingStatus(
  bindingId: string,
  status: TenantServiceBindingStatus,
  options: ControlApiOptions = {},
): Promise<ApiResult<{ id: string; status: TenantServiceBindingStatus }>> {
  if (!TENANT_BINDING_MUTATION_AVAILABLE) {
    return {
      data: null,
      error:
        "Endpoint de mutação de vínculo ainda não disponível na camada API. Modo somente leitura ativo.",
      status: 501,
    };
  }

  const path = TENANT_BINDING_MUTATION_PATH.replace(":id", bindingId);
  return apiRequest<{ id: string; status: TenantServiceBindingStatus }>(path, {
    ...toApiOptions(options),
    method: "PATCH",
    body: { status },
  });
}

export function getTenantsList(options: ControlApiOptions = {}) {
  return apiGet<unknown>("/api/control/tenants", toApiOptions(options)).then((response) => {
    if (response.error) {
      return { data: null, error: response.error, status: response.status } as ApiResult<TenantListItem[]>;
    }
    return {
      data: extractArray<TenantListItem>(response.data),
      error: null,
      status: response.status,
    } as ApiResult<TenantListItem[]>;
  });
}

const TENANT_MUTATION_AVAILABLE = false;
const TENANT_MUTATION_PATH = "/api/tenants/:id";

export function isTenantMutationAvailable() {
  return TENANT_MUTATION_AVAILABLE;
}

export async function updateTenantStatus(
  tenantId: string,
  status: TenantStatus,
  options: ControlApiOptions = {},
): Promise<ApiResult<{ id: string; status: TenantStatus }>> {
  if (!TENANT_MUTATION_AVAILABLE) {
    return {
      data: null,
      error: "Endpoint de mutação de tenant ainda não disponível na camada API. Modo somente leitura ativo.",
      status: 501,
    };
  }

  const path = TENANT_MUTATION_PATH.replace(":id", tenantId);
  return apiRequest<{ id: string; status: TenantStatus }>(path, {
    ...toApiOptions(options),
    method: "PATCH",
    body: { status },
  });
}

const BILLING_OVERVIEW_READ_AVAILABLE = true;

export function isBillingOverviewReadAvailable() {
  return BILLING_OVERVIEW_READ_AVAILABLE;
}

export async function getBillingOverview(
  options: ControlApiOptions = {},
): Promise<ApiResult<BillingOverview>> {
  if (!BILLING_OVERVIEW_READ_AVAILABLE) {
    return {
      data: null,
      error:
        "Endpoint de billing overview global não disponível no backend atual. Mantendo fallback seguro.",
      status: 501,
    };
  }

  const subscriptionRes = await apiGet<unknown>("/api/control/billing/subscription", toApiOptions(options));
  if (subscriptionRes.error || !subscriptionRes.data) {
    return {
      data: null,
      error: subscriptionRes.error ?? "Não foi possível obter visão de billing via subscription.",
      status: subscriptionRes.status,
    };
  }
  return {
    data: mapSubscriptionToOverview(subscriptionRes.data),
    error: null,
    status: subscriptionRes.status,
  };
}

const BILLING_ITEMS_READ_AVAILABLE = true;
const BILLING_ITEMS_READ_PATH = "/api/control/billing/invoices";

export function isBillingItemsReadAvailable() {
  return BILLING_ITEMS_READ_AVAILABLE;
}

export async function getBillingItems(
  options: ControlApiOptions = {},
): Promise<ApiResult<BillingItem[]>> {
  if (!BILLING_ITEMS_READ_AVAILABLE) {
    return {
      data: null,
      error: "Endpoint read-only de billing items ainda não disponível na camada API.",
      status: 501,
    };
  }

  const response = await apiGet<unknown>(BILLING_ITEMS_READ_PATH, toApiOptions(options));
  if (response.error) {
    return { data: null, error: response.error, status: response.status };
  }
  return {
    data: extractArray<BillingItem>(response.data),
    error: null,
    status: response.status,
  };
}

const BILLING_SYNC_AVAILABLE = false;
const BILLING_SYNC_PATH = "/api/billing/items/:id/sync";

export function isBillingSyncAvailable() {
  return BILLING_SYNC_AVAILABLE;
}

export async function syncBillingItemStatus(
  itemId: string,
  options: ControlApiOptions = {},
): Promise<ApiResult<{ id: string; status: BillingItemStatus }>> {
  if (!BILLING_SYNC_AVAILABLE) {
    return {
      data: null,
      error: "Endpoint de sincronização de billing ainda não disponível na camada API.",
      status: 501,
    };
  }

  const path = BILLING_SYNC_PATH.replace(":id", itemId);
  return apiRequest<{ id: string; status: BillingItemStatus }>(path, {
    ...toApiOptions(options),
    method: "POST",
  });
}

const LICENSES_READ_AVAILABLE = true;
const LICENSES_READ_PATH = "/api/control/licenses";
const LICENSES_MUTATION_AVAILABLE = true;

export function isLicensesReadAvailable() {
  return LICENSES_READ_AVAILABLE;
}

export function isLicensesMutationAvailable() {
  return LICENSES_MUTATION_AVAILABLE;
}

export async function getLicensesList(
  options: ControlApiOptions = {},
): Promise<ApiResult<LicenseListItem[]>> {
  if (!LICENSES_READ_AVAILABLE) {
    return {
      data: null,
      error: "Endpoint read-only de licenças ainda não disponível na camada API.",
      status: 501,
    };
  }

  const response = await apiGet<unknown>(LICENSES_READ_PATH, toApiOptions(options));
  if (response.error) {
    return { data: null, error: response.error, status: response.status };
  }
  return {
    data: extractArray<LicenseListItem>(response.data),
    error: null,
    status: response.status,
  };
}

const LICENSES_ACTIVATE_PATH = "/api/control/licenses/:id/activate";
const LICENSES_BLOCK_PATH = "/api/control/licenses/:id/block";
const LICENSES_RENEW_PATH = "/api/control/licenses/:id/renew";

function mapLicenseMutationResult(input: unknown): LicenseListItem | null {
  if (!input || typeof input !== "object") return null;
  const payload = input as Record<string, unknown>;
  const source = (payload.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload) as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id : null;
  const client = typeof source.client === "string" ? source.client : null;
  const product = typeof source.product === "string" ? source.product : null;
  const key = typeof source.key === "string" ? source.key : null;
  const status = typeof source.status === "string" ? source.status : null;
  if (!id || !client || !product || !key || !status) return null;
  return {
    id,
    tenantId: typeof source.tenantId === "string" ? source.tenantId : undefined,
    client,
    product,
    key,
    status,
    expiration: typeof source.expiration === "string" || source.expiration === null ? (source.expiration as string | null) : null,
    environment: typeof source.environment === "string" || source.environment === null ? (source.environment as string | null) : null,
    validityDays: typeof source.validityDays === "number" ? source.validityDays : undefined,
    blocked: typeof source.blocked === "boolean" ? source.blocked : undefined,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : undefined,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
}

export async function activateLicense(
  id: string,
  options: ControlApiOptions = {},
): Promise<ApiResult<LicenseListItem>> {
  if (!LICENSES_MUTATION_AVAILABLE) {
    return { data: null, error: "Ação de ativação de licença indisponível.", status: 501 };
  }
  const path = LICENSES_ACTIVATE_PATH.replace(":id", id);
  const response = await apiRequest<unknown>(path, { ...toApiOptions(options), method: "POST", body: {} });
  if (response.error) return { data: null, error: response.error, status: response.status };
  const mapped = mapLicenseMutationResult(response.data);
  if (!mapped) return { data: null, error: "Resposta inválida na ativação da licença.", status: response.status };
  return { data: mapped, error: null, status: response.status };
}

export async function blockLicense(
  id: string,
  options: ControlApiOptions = {},
): Promise<ApiResult<LicenseListItem>> {
  if (!LICENSES_MUTATION_AVAILABLE) {
    return { data: null, error: "Ação de bloqueio de licença indisponível.", status: 501 };
  }
  const path = LICENSES_BLOCK_PATH.replace(":id", id);
  const response = await apiRequest<unknown>(path, { ...toApiOptions(options), method: "POST", body: {} });
  if (response.error) return { data: null, error: response.error, status: response.status };
  const mapped = mapLicenseMutationResult(response.data);
  if (!mapped) return { data: null, error: "Resposta inválida no bloqueio da licença.", status: response.status };
  return { data: mapped, error: null, status: response.status };
}

export async function renewLicense(
  id: string,
  days = 365,
  options: ControlApiOptions = {},
): Promise<ApiResult<LicenseListItem>> {
  if (!LICENSES_MUTATION_AVAILABLE) {
    return { data: null, error: "Ação de renovação de licença indisponível.", status: 501 };
  }
  const path = LICENSES_RENEW_PATH.replace(":id", id);
  const response = await apiRequest<unknown>(path, { ...toApiOptions(options), method: "POST", body: { days } });
  if (response.error) return { data: null, error: response.error, status: response.status };
  const mapped = mapLicenseMutationResult(response.data);
  if (!mapped) return { data: null, error: "Resposta inválida na renovação da licença.", status: response.status };
  return { data: mapped, error: null, status: response.status };
}
