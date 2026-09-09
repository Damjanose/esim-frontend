import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  return proxyAdminJson(request, `/admin/support/threads/${id}/read`, { method: "POST" });
}
