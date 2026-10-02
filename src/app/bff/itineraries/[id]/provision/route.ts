import { errorJson } from "@/lib/route-response";
import { proxyItinerary, readJsonBody } from "@/lib/tripPlan/bff";
import { isPlanId } from "@/lib/tripPlan/logic";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Confirms a card payment unlocked the plan. Idempotent on the backend. */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);

  const raw = (await readJsonBody(request))?.payment_id;
  const paymentId = typeof raw === "string" ? raw.trim() : "";
  if (!paymentId) {
    return errorJson("payment_id is required", 400);
  }

  return proxyItinerary(request, `/${id}/provision`, { method: "POST", body: { payment_id: paymentId } });
}
