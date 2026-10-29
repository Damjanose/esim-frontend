import { proxyAdminJson } from "@/lib/admin-bff";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAdminJson(
    request,
    `/admin/dashboard/purchases/${encodeURIComponent(id)}/provider`,
  );
}
