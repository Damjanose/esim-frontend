import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ account: string; uid: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { account, uid } = await context.params;
  const folder = new URL(request.url).searchParams.get("folder")?.trim();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }

  const base = `/admin/mail/${encodeURIComponent(account)}/messages/${encodeURIComponent(uid)}/move`;
  const path = folder ? `${base}?folder=${encodeURIComponent(folder)}` : base;
  return proxyAdminJson(request, path, { method: "POST", body });
}
