import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const id = encodeURIComponent((await context.params).id);
    const response = await fetch(`${getBackendApiUrl()}/admin/errors/${id}/repair`, {
      method: "POST",
      headers: { Authorization: authorization },
      cache: "no-store"
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to repair error event" },
      { status: 502 }
    );
  }
}
