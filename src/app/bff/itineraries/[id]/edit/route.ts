import { errorJson } from "@/lib/route-response";
import { ITINERARY_LONG_TIMEOUT_MS, proxyItinerary, readJsonBody } from "@/lib/tripPlan/bff";
import { EDIT_PROMPT_MAX, isPlanId, readEditPrompt } from "@/lib/tripPlan/logic";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Rewrites a purchased plan from a prompt. Runs as long as a generation. */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);

  const prompt = readEditPrompt((await readJsonBody(request))?.prompt);
  if (!prompt) {
    return errorJson(`Describe the change in 1–${EDIT_PROMPT_MAX} characters.`, 400);
  }

  return proxyItinerary(request, `/${id}/edit`, {
    method: "POST",
    body: { prompt },
    timeoutMs: ITINERARY_LONG_TIMEOUT_MS
  });
}
