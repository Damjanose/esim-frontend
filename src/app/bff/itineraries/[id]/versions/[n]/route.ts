import { errorJson } from "@/lib/route-response";
import { proxyItinerary } from "@/lib/tripPlan/bff";
import { isPlanId, isVersionParam } from "@/lib/tripPlan/logic";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; n: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id, n } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);
  if (!isVersionParam(n)) return errorJson("version must be a non-negative integer", 400);
  return proxyItinerary(request, `/${id}/versions/${n}`);
}
