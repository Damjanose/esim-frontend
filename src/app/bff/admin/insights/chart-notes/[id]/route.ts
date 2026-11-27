import { proxyAdminJson } from "@/lib/admin-bff";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAdminJson(request, `/admin/analytics/chart-notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
