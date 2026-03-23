import { NextRequest } from "next/server";
import { proxyGet } from "../../_shared";

export async function GET(request: NextRequest) {
  return proxyGet(request, "/api/billing/invoices", "billing/invoices");
}

