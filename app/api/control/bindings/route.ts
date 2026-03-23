import { NextRequest, NextResponse } from "next/server";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

const CONTROL_BACKEND_BASE_URL = process.env.CONTROL_BACKEND_BASE_URL ?? "http://127.0.0.1:3023";
const REQUEST_TIMEOUT_MS = 15000;

type Tenant = { id: string; name?: string };
type Binding = Record<string, unknown> & { tenantName?: string };

function buildBackendUrl(path: string) {
  return `${CONTROL_BACKEND_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function parseJsonSafe(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function extractArray<T = unknown>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  const source = asRecord(input);
  if (Array.isArray(source.data)) return source.data as T[];
  if (Array.isArray(source.items)) return source.items as T[];
  if (Array.isArray(source.results)) return source.results as T[];
  const nested = asRecord(source.data);
  if (Array.isArray(nested.items)) return nested.items as T[];
  if (Array.isArray(nested.results)) return nested.results as T[];
  if (Array.isArray(nested.data)) return nested.data as T[];
  return [];
}

function getForwardHeaders(request: NextRequest) {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const cookieAccessToken =
    request.cookies.get(CONTROL_ACCESS_TOKEN_COOKIE)?.value ??
    request.cookies.get("accessToken")?.value ??
    request.cookies.get("access_token")?.value ??
    request.cookies.get("token")?.value ??
    null;
  const effectiveAuthorization =
    authHeader && authHeader.trim()
      ? authHeader
      : cookieAccessToken
        ? `Bearer ${cookieAccessToken}`
        : null;

  if (effectiveAuthorization) headers.set("authorization", effectiveAuthorization);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  return headers;
}

async function backendGet(request: NextRequest, path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(buildBackendUrl(path), {
      method: "GET",
      headers: getForwardHeaders(request),
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = parseJsonSafe(text);
    return { status: response.status, payload };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantsResponse = await backendGet(request, "/api/tenants");
    if (tenantsResponse.status >= 400) {
      return NextResponse.json(tenantsResponse.payload, { status: tenantsResponse.status });
    }

    const tenants = extractArray<Tenant>(tenantsResponse.payload);
    if (!tenants.length) return NextResponse.json([]);

    const perTenant = await Promise.all(
      tenants.map(async (tenant) => {
        const tenantBindings = await backendGet(
          request,
          `/api/master-services/tenants/${tenant.id}/services`,
        );
        if (tenantBindings.status >= 400) return [] as Binding[];
        return extractArray<Binding>(tenantBindings.payload).map((binding) => ({
          ...binding,
          tenantName: binding.tenantName ?? tenant.name ?? "N/A",
        }));
      }),
    );

    return NextResponse.json(perTenant.flat(), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao compor bindings no proxy.";
    return NextResponse.json({ error: "CONTROL_PROXY_ERROR", message }, { status: 502 });
  }
}

