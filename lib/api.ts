export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  next?: RequestInit["next"];
  cache?: RequestCache;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

function buildUrl(path: string) {
  if (path.startsWith("/api/control/")) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function normalizeError(status: number, fallback: string, payload: unknown) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (status >= 500) return "Erro interno no servidor.";
  return fallback;
}

function parsePayload(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function unwrapApiData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  if ("data" in payload) {
    return (payload as { data?: unknown }).data ?? null;
  }
  return payload;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", token, headers = {}, body, signal, next, cache } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal,
      next,
      cache,
    });

    const text = await response.text();
    const payload = parsePayload(text);

    if (!response.ok) {
      return {
        data: null,
        error: normalizeError(response.status, `Falha na requisição (${response.status}).`, payload),
        status: response.status,
      };
    }

    return {
      data: unwrapApiData(payload) as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado na comunicação com API.";
    return { data: null, error: message, status: 0 };
  }
}

export function apiGet<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}
