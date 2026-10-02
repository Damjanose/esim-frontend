import { errorJson } from "@/lib/route-response";
import { proxyItinerary } from "@/lib/tripPlan/bff";
import { isPlanId } from "@/lib/tripPlan/logic";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);
  return proxyItinerary(request, `/${id}`);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);
  return proxyItinerary(request, `/${id}`, { method: "DELETE" });
}
