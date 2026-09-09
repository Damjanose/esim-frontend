import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }

  return proxyAdminJson(request, `/admin/support/threads/${id}/messages`, {
    method: "POST",
    body
  });
}
