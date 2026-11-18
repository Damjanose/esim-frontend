import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";
import { INVALID_JSON_BODY, readJsonBody } from "../../json-body";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return NextResponse.json(INVALID_JSON_BODY, { status: 400 });
  return proxyAdminJson(request, `/admin/event-modals/${id}/disqualify`, { method: "POST", body: parsed.body });
}
