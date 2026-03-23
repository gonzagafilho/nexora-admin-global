import { NextRequest, NextResponse } from "next/server";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

const CONTROL_BACKEND_BASE_URL = process.env.CONTROL_BACKEND_BASE_URL ?? "http://127.0.0.1:3023";

function backendUrl(path: string) {
  return `${CONTROL_BACKEND_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(CONTROL_ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const response = await fetch(backendUrl("/api/auth/me"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: response.status });
    }
    return NextResponse.json({ authenticated: true, user: payload }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 502 });
  }
}

