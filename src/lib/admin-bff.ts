import { NextResponse } from "next/server";
import { backendFetch, type BackendRequest } from "./backend";

export function readAdminBearer(request: Request): string {
  return (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

export async function proxyAdminJson(
  request: Request,
  path: string,
  init: Pick<BackendRequest, "method" | "body"> = {}
): Promise<NextResponse> {
  const result = await backendFetch<unknown>(path, {
    ...init,
    token: readAdminBearer(request)
  });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }

  return NextResponse.json({ status: "success", data: result.data });
}
