import { errorJson } from "@/lib/route-response";
import { ITINERARY_LONG_TIMEOUT_MS, proxyItinerary, readJsonBody } from "@/lib/tripPlan/bff";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return proxyItinerary(request, "");
}

/** Generates a plan. Holds the request open for the whole generation (2–5 min). */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) {
    return errorJson("Invalid request body", 400);
  }
  return proxyItinerary(request, "", { method: "POST", body, timeoutMs: ITINERARY_LONG_TIMEOUT_MS });
}
