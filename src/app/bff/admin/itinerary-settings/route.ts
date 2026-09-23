import { proxyAdminJson } from "@/lib/admin-bff";

export function GET(request: Request) {
  return proxyAdminJson(request, "/admin/itinerary-settings");
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyAdminJson(request, "/admin/itinerary-settings", { method: "PUT", body });
}
