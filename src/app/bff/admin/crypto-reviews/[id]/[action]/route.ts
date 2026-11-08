import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

type RouteContext = { params: Promise<{ id: string; action: string }> };

const ACTIONS = new Set(["confirm", "deny"]);

export async function POST(request: Request, context: RouteContext) {
  const { id, action } = await context.params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ status: "error", message: "Unknown action" }, { status: 404 });
  }
  try {
    const response = await fetch(
      `${getBackendApiUrl()}/admin/crypto-reviews/${encodeURIComponent(id)}/${action}`,
      {
        method: "POST",
        headers: {
          Authorization: request.headers.get("Authorization") ?? "",
          "Content-Type": "application/json"
        },
        body: (await request.text()) || "{}",
        cache: "no-store"
      }
    );
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ status: "error", message: `Failed to ${action} crypto payment` }, { status: 502 });
  }
}
