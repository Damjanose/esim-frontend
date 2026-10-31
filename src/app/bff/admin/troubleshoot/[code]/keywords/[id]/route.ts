import { proxyAdminJson } from "@/lib/admin-bff";

export async function DELETE(request: Request, context: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await context.params;
  return proxyAdminJson(
    request,
    `/admin/troubleshoot/${encodeURIComponent(code)}/keywords/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
