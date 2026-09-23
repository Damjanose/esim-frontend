import { NextResponse } from "next/server";
import { proxyAdminJson } from "@/lib/admin-bff";

export function GET(request: Request) {
  return proxyAdminJson(request, "/admin/itinerary-settings");
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  return proxyAdminJson(request, "/admin/itinerary-settings", { method: "PUT", body });
}
