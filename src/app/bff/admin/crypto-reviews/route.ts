import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const response = await fetch(`${getBackendApiUrl()}/admin/crypto-reviews`, {
      headers: { Authorization: request.headers.get("Authorization") ?? "" },
      cache: "no-store"
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ status: "error", message: "Failed to load crypto reviews" }, { status: 502 });
  }
}
