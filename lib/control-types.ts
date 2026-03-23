export interface ControlOverview {
  totalTenants: number;
  activeServices: number;
  estimatedMrr: number;
  pendingCharges: number;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  key?: string;
  type?: "SaaS" | "Licenciado" | string;
  category?: string;
  status?: string;
  isActive?: boolean;
  description?: string;
  activeClients?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceCatalogStatus = "ativo" | "bloqueado";

export interface TenantServiceBinding {
  id: string;
  tenantName?: string;
  tenant?: string;
  clientName?: string;
  serviceName?: string;
  service?: string;
  plan?: string;
  status?: string;
  activatedAt?: string;
  suspendedAt?: string;
  createdAt?: string;
}

export type TenantServiceBindingStatus = "ativo" | "bloqueado" | "pendente" | "suspenso";

export interface TenantListItem {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  contactEmail?: string;
  plan?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TenantStatus = "ativo" | "bloqueado" | "pendente" | "suspenso";

export interface BillingOverview {
  estimatedMrr: number;
  pendingCharges: number;
  overdueCharges: number;
  paidInMonth: number;
}

export interface BillingItem {
  id: string;
  client: string;
  amount: number;
  status: string;
  method?: string;
  provider?: string;
  reference?: string;
  date?: string;
}

export type BillingItemStatus = "pago" | "pendente" | "falhou";

export interface LicenseListItem {
  id: string;
  tenantId?: string;
  client: string;
  product: string;
  key: string;
  expiration?: string | null;
  status: string;
  environment?: string | null;
  validityDays?: number;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
