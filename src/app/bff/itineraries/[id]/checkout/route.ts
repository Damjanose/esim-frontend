import { errorJson } from "@/lib/route-response";
import { proxyItinerary } from "@/lib/tripPlan/bff";
import { isPlanId } from "@/lib/tripPlan/logic";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Starts the unlock. Free plans come back already purchased; paid ones return a
 * Pokpay `paymentId` + `environment` that the page's inline CardStep charges.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);
  return proxyItinerary(request, `/${id}/checkout`, { method: "POST" });
}
