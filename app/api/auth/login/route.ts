import { NextRequest, NextResponse } from "next/server";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

const CONTROL_BACKEND_BASE_URL = process.env.CONTROL_BACKEND_BASE_URL ?? "http://127.0.0.1:3023";

type LoginPayload = {
  email?: string;
  password?: string;
};

function backendUrl(path: string) {
  return `${CONTROL_BACKEND_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Credenciais obrigatórias." },
        { status: 400 },
      );
    }

    const response = await fetch(backendUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      payload = null;
    }

    const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const dataRecord =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : null;
    const tokenSource = dataRecord ?? record;
    const accessToken =
      typeof tokenSource.accessToken === "string"
        ? tokenSource.accessToken
        : (tokenSource.tokens &&
            typeof tokenSource.tokens === "object" &&
            typeof (tokenSource.tokens as Record<string, unknown>).accessToken === "string")
          ? ((tokenSource.tokens as Record<string, unknown>).accessToken as string)
          : null;

    if (!response.ok || !accessToken) {
      const message =
        typeof record.message === "string"
          ? record.message
          : "Falha na autenticação.";
      return NextResponse.json({ error: message }, { status: response.status || 401 });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const result = NextResponse.json(
      { ok: true, user: (tokenSource.user as unknown) ?? null },
      { status: 200 },
    );
    result.cookies.set({
      name: CONTROL_ACCESS_TOKEN_COOKIE,
      value: accessToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno de autenticação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

