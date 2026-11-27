import { proxyAdminJson } from "@/lib/admin-bff";
import { invalidBody, readInsightsJsonBody } from "../../json-body";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await readInsightsJsonBody(request);
  if (body === null) return invalidBody();
  return proxyAdminJson(request, `/admin/analytics/ad-spend/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  return proxyAdminJson(request, `/admin/analytics/ad-spend/${encodeURIComponent(id)}`, { method: "DELETE" });
}
