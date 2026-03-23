export type BackendRole = "SUPER_ADMIN" | "TENANT_OWNER" | "TENANT_ADMIN" | "TENANT_STAFF";

export type ControlProfile = "SUPER_ADMIN" | "ADMIN" | "SUPORTE";

export type ControlMenuKey =
  | "dashboard"
  | "companies"
  | "solutions"
  | "contracts"
  | "finance"
  | "licenses"
  | "apps"
  | "operations"
  | "backups";

export type ControlPageKey =
  | "control"
  | "tenants"
  | "services"
  | "bindings"
  | "billing"
  | "licenses"
  | "apps"
  | "infra"
  | "backups";

const ACCESS_MATRIX: Record<ControlProfile, ControlPageKey[]> = {
  SUPER_ADMIN: [
    "control",
    "tenants",
    "services",
    "bindings",
    "billing",
    "licenses",
    "apps",
    "infra",
    "backups",
  ],
  ADMIN: ["control", "tenants", "services", "bindings", "billing", "apps"],
  SUPORTE: ["control", "tenants", "services", "bindings"],
};

const PAGE_TO_MENU: Partial<Record<ControlPageKey, ControlMenuKey>> = {
  control: "dashboard",
  tenants: "companies",
  services: "solutions",
  bindings: "contracts",
  billing: "finance",
  licenses: "licenses",
  apps: "apps",
  infra: "operations",
  backups: "backups",
};

export function mapBackendRoleToProfile(role: string | null | undefined): ControlProfile | null {
  if (!role) return null;
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "TENANT_OWNER" || role === "TENANT_ADMIN") return "ADMIN";
  if (role === "TENANT_STAFF") return "SUPORTE";
  return null;
}

export function canAccessPage(profile: ControlProfile, page: ControlPageKey): boolean {
  return ACCESS_MATRIX[profile].includes(page);
}

export function allowedMenuKeys(profile: ControlProfile): ControlMenuKey[] {
  const keys = new Set<ControlMenuKey>();
  for (const page of ACCESS_MATRIX[profile]) {
    const menuKey = PAGE_TO_MENU[page];
    if (menuKey) keys.add(menuKey);
  }
  return Array.from(keys);
}

export function profileLabel(profile: ControlProfile): string {
  if (profile === "SUPER_ADMIN") return "Super Admin";
  if (profile === "ADMIN") return "Admin";
  return "Suporte";
}
