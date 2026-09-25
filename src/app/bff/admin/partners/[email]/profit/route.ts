import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ email: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const email = (await context.params).email;
  const body = await request.json().catch(() => ({}));

  const result = await backendFetch<unknown>(
    `/admin/partners/${encodeURIComponent(email)}/profit`,
    { method: "PATCH", token, body }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
