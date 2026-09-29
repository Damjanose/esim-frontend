import { proxyAdminJson } from "@/lib/admin-bff";

export function POST(request: Request) {
  return proxyAdminJson(request, "/admin/itinerary-settings/test", { method: "POST" });
}
