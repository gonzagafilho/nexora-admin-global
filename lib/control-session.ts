import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { mapBackendRoleToProfile, type BackendRole, type ControlProfile } from "@/lib/control-rbac";

const CONTROL_BACKEND_BASE_URL = process.env.CONTROL_BACKEND_BASE_URL ?? "http://127.0.0.1:3023";

function backendUrl(path: string) {
  return `${CONTROL_BACKEND_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: BackendRole | string;
  tenantId: string;
  establishmentId?: string | null;
};

function extractUser(payload: unknown): BackendUser | null {
  if (!payload || typeof payload !== "object") return null;

  const direct = payload as Partial<BackendUser>;
  if (typeof direct.id === "string" && typeof direct.role === "string") {
    return direct as BackendUser;
  }

  const nested = (payload as { data?: Partial<BackendUser> }).data;
  if (nested && typeof nested.id === "string" && typeof nested.role === "string") {
    return nested as BackendUser;
  }

  return null;
}

export type ControlSessionUser = {
  id: string;
  name: string;
  email: string;
  backendRole: string;
  profile: ControlProfile;
};

export async function getControlSessionUser(): Promise<ControlSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CONTROL_ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!token) return null;

  try {
    const response = await fetch(backendUrl("/api/auth/me"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json().catch(() => null)) as unknown;
    const user = extractUser(payload);
    if (!user) return null;

    const profile = mapBackendRoleToProfile(user.role);
    if (!profile) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      backendRole: user.role,
      profile,
    };
  } catch {
    return null;
  }
}

export async function requireControlSessionUser(): Promise<ControlSessionUser> {
  const user = await getControlSessionUser();
  if (!user) redirect("/login");
  return user;
}
