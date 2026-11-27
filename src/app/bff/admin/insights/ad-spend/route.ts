import { proxyAdminJson } from "@/lib/admin-bff";
import { invalidBody, readInsightsJsonBody } from "../json-body";

const PARAMS = ["from", "to"];

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of PARAMS) {
    const value = incoming.get(key);
    if (value) query.set(key, value.slice(0, 40));
  }
  const qs = query.toString();
  return proxyAdminJson(request, `/admin/analytics/ad-spend${qs ? `?${qs}` : ""}`);
}

export async function POST(request: Request) {
  const body = await readInsightsJsonBody(request);
  if (body === null) return invalidBody();
  return proxyAdminJson(request, "/admin/analytics/ad-spend", { method: "POST", body });
}
