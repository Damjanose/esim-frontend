import { proxyAdminJson } from "@/lib/admin-bff";

export function GET(request: Request) {
  return proxyAdminJson(request, "/admin/testimonials");
}
