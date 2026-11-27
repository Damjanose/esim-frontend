import { proxyAdminJson } from "@/lib/admin-bff";
import { errorJson } from "@/lib/route-response";

const REPORTS = new Set(["overview", "locations", "audience", "screens", "destinations", "searches", "peak-times", "funnel", "first-source", "data-health", "daily", "campaign-return", "promotions", "customers", "seasons", "acquisition", "opportunities"]);
const PARAMS = ["from", "to", "platform", "country", "tz", "compare", "level", "basis"];

export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  if (!REPORTS.has(report)) return errorJson("Not found", 404);
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of PARAMS) {
    const value = incoming.get(key);
    if (value) query.set(key, value.slice(0, 40));
  }
  const qs = query.toString();
  return proxyAdminJson(request, `/admin/analytics/${report}${qs ? `?${qs}` : ""}`);
}
