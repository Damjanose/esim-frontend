import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const url = new URL(request.url);
    const response = await fetch(`${getBackendApiUrl()}/admin/errors${url.search}`, {
      headers: { Authorization: authorization },
      cache: "no-store"
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to load error inbox" },
      { status: 502 }
    );
  }
}
