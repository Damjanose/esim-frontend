import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ packageId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const packageId = (await context.params).packageId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 }
    );
  }

  const result = await backendFetch<unknown>(
    `/admin/packages/pricing/${encodeURIComponent(packageId)}`,
    { method: "PUT", body, token }
  );

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
