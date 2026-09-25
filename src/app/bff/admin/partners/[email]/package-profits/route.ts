import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ email: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const email = (await context.params).email;

  const result = await backendFetch<{ packageProfits: Array<{ packageId: string; profitCents: number }> }>(
    `/admin/partners/${encodeURIComponent(email)}/package-profits`,
    { method: "GET", token }
  );

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
