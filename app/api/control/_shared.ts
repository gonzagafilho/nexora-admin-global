import { NextRequest, NextResponse } from "next/server";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

const CONTROL_BACKEND_BASE_URL = process.env.CONTROL_BACKEND_BASE_URL ?? "http://127.0.0.1:3023";
const REQUEST_TIMEOUT_MS = 12000;

function buildBackendUrl(path: string) {
  return `${CONTROL_BACKEND_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
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

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  return headers;
}

export async function proxyGet(request: NextRequest, path: string, logLabel: string) {
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
    let payload: unknown = null;
    try {
      payload = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      payload = text || null;
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao comunicar com backend do control.";
    return NextResponse.json(
      { error: "CONTROL_PROXY_ERROR", message },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxyPost(
  request: NextRequest,
  path: string,
  logLabel: string,
  options?: { body?: unknown },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body =
      options?.body !== undefined
        ? JSON.stringify(options.body)
        : await request.text().catch(() => "");
    const headers = getForwardHeaders(request);
    if (body && !headers.get("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(buildBackendUrl(path), {
      method: "POST",
      headers,
      cache: "no-store",
      signal: controller.signal,
      body: body || undefined,
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      payload = text || null;
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao comunicar com backend do control.";
    return NextResponse.json(
      { error: "CONTROL_PROXY_ERROR", message, op: logLabel },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

