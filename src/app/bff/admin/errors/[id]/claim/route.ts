import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Provisioning-claim recovery (attach provider order/result, mark safe to retry). Admin bearer only. */
export async function POST(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }
  const id = encodeURIComponent((await context.params).id);
  return proxyAdminJson(request, `/admin/errors/${id}/claim`, { method: "POST", body });
}
