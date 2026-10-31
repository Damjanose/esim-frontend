import { proxyAdminJson } from "@/lib/admin-bff";
import { readJsonBody } from "../../json-body";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) return parsed.error;
  return proxyAdminJson(request, `/admin/troubleshoot/${encodeURIComponent(code)}/keywords`, {
    method: "POST",
    body: parsed.body
  });
}
