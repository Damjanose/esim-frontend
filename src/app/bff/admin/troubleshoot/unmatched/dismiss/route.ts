import { proxyAdminJson } from "@/lib/admin-bff";
import { readJsonBody } from "../../json-body";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return proxyAdminJson(request, "/admin/troubleshoot/unmatched/dismiss", { method: "POST", body: parsed.body });
}
