import { proxyAdminJson } from "@/lib/admin-bff";

export function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 200) : 50;
  return proxyAdminJson(request, `/admin/games/streak-promo/claims?limit=${safeLimit}`);
}
