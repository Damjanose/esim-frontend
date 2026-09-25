import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ email: string; packageId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const { email, packageId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const result = await backendFetch<unknown>(
    `/admin/partners/${encodeURIComponent(email)}/package-profits/${encodeURIComponent(packageId)}`,
    { method: "PUT", token, body }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const { email, packageId } = await context.params;

  const result = await backendFetch<unknown>(
    `/admin/partners/${encodeURIComponent(email)}/package-profits/${encodeURIComponent(packageId)}`,
    { method: "DELETE", token }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
