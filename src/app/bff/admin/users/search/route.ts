import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const result = await backendFetch<unknown>(`/admin/users/search?q=${encodeURIComponent(q)}`, { token });

  if (!result.ok) {
    return NextResponse.json({ status: "error", message: result.message }, { status: result.status });
  }
  return NextResponse.json({ status: "success", data: result.data });
}
