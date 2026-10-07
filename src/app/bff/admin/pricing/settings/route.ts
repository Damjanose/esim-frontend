import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

function bearerToken(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.replace(/^Bearer\s+/i, "").trim();
}

export async function GET(request: Request) {
  const result = await backendFetch<unknown>("/admin/pricing/settings", { token: bearerToken(request) });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 }
    );
  }

  const result = await backendFetch<unknown>("/admin/pricing/settings", {
    method: "PUT",
    body,
    token: bearerToken(request)
  });

  if (!result.ok) {
    return NextResponse.json(
      { status: "error", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ status: "success", data: result.data });
}
