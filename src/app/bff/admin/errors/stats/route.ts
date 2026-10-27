import { proxyAdminJson } from "@/lib/admin-bff";

/** Filter-aware counts for the /xerrors stat cards (same query params as the list). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyAdminJson(request, `/admin/errors/stats${url.search}`);
}
