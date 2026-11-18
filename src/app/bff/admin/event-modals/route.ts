import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";
import { INVALID_JSON_BODY, readJsonBody } from "./json-body";

export async function GET(request: Request) {
  return proxyAdminJson(request, "/admin/event-modals", { method: "GET" });
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return NextResponse.json(INVALID_JSON_BODY, { status: 400 });
  return proxyAdminJson(request, "/admin/event-modals", { method: "POST", body: parsed.body });
}
