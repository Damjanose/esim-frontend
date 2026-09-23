import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const id = encodeURIComponent((await context.params).id);
  const body = (await request.json()) as unknown;
  return proxyAdminJson(request, `/admin/testimonials/${id}/decision`, { method: "POST", body });
}
