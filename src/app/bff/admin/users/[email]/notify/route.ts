import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ email: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const email = (await context.params).email;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
  }

  const result = await backendFetch<unknown>(`/admin/users/${encodeURIComponent(email)}/notify`, {
    method: "POST",
    body,
    token,
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
