import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";

export async function GET(request: Request) {
  return proxyAdminJson(request, "/admin/mail/accounts");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }
  return proxyAdminJson(request, "/admin/mail/accounts", { method: "POST", body });
}
