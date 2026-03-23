import { NextRequest } from "next/server";
import { proxyPost } from "../../../_shared";

const allowedActions = new Set(["activate", "block", "renew"]);

type Params = {
  params: Promise<{ id: string; action: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { id, action } = await params;
  if (!allowedActions.has(action)) {
    return new Response(JSON.stringify({ error: "Ação de licença inválida." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (action === "renew") {
    return proxyPost(request, `/api/control/licenses/${id}/renew`, "licenses:renew");
  }
  if (action === "block") {
    return proxyPost(request, `/api/control/licenses/${id}/block`, "licenses:block", { body: {} });
  }
  return proxyPost(request, `/api/control/licenses/${id}/activate`, "licenses:activate", { body: {} });
}
