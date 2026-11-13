import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ account: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const account = encodeURIComponent((await context.params).account);
  const url = new URL(request.url);
  const query = new URLSearchParams();
  const folder = url.searchParams.get("folder")?.trim();
  const page = url.searchParams.get("page")?.trim();
  if (folder) query.set("folder", folder);
  if (page) query.set("page", page);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return proxyAdminJson(request, `/admin/mail/${account}/messages${suffix}`);
}
