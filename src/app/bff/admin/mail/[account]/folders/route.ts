import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ account: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const account = encodeURIComponent((await context.params).account);
  return proxyAdminJson(request, `/admin/mail/${account}/folders`);
}
