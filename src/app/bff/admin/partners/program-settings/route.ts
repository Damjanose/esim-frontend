import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  const result = await backendFetch<{ maxDiscountPct: number; companyFloorCents: number }>(
    "/admin/partners/program-settings",
    { method: "GET", token }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}

export async function PATCH(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const body = await request.json().catch(() => ({}));

  const result = await backendFetch<{ maxDiscountPct: number; companyFloorCents: number }>(
    "/admin/partners/program-settings",
    { method: "PATCH", token, body }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
