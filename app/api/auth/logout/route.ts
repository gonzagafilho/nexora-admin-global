import { NextResponse } from "next/server";
import { CONTROL_ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: CONTROL_ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

