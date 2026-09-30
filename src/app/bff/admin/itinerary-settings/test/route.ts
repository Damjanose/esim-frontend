import { proxyAdminJson } from "@/lib/admin-bff";

export async function POST(request: Request) {
  let body: Record<string, unknown> | undefined;
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    body = await request.json();
  }
  return proxyAdminJson(request, "/admin/itinerary-settings/test", { method: "POST", body });
}
