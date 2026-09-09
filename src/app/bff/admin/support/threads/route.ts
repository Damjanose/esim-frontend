import { proxyAdminJson } from "@/lib/admin-bff";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return proxyAdminJson(request, `/admin/support/threads${query}`);
}
