import { proxyItinerary } from "@/lib/tripPlan/bff";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return proxyItinerary(request, "/config");
}
