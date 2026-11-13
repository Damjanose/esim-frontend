import { proxyAdminJson } from "@/lib/admin-bff";

type RouteContext = {
  params: Promise<{ account: string; uid: string }>;
};

function messagePath(account: string, uid: string, folder: string | null) {
  const base = `/admin/mail/${encodeURIComponent(account)}/messages/${encodeURIComponent(uid)}`;
  const trimmed = folder?.trim();
  return trimmed ? `${base}?folder=${encodeURIComponent(trimmed)}` : base;
}

export async function GET(request: Request, context: RouteContext) {
  const { account, uid } = await context.params;
  const folder = new URL(request.url).searchParams.get("folder");
  return proxyAdminJson(request, messagePath(account, uid, folder));
}

export async function DELETE(request: Request, context: RouteContext) {
  const { account, uid } = await context.params;
  const folder = new URL(request.url).searchParams.get("folder");
  return proxyAdminJson(request, messagePath(account, uid, folder), { method: "DELETE" });
}
