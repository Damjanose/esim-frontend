import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  const query = new URL(request.url).search;
  const result = await backendFetch<unknown>(`/admin/dashboard${query}`, { token });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
