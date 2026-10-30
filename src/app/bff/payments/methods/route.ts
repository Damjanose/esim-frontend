import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { CARD_ONLY, type PaymentMethods } from "@/lib/externalPayments";
import { successJson } from "@/lib/route-response";

/**
 * Which payment methods checkout may offer. Public on the backend (no user data), so
 * no session: signed-out visitors see the same picker. Never fails the page: any
 * backend problem falls back to card only, the flow that always works.
 */
export async function GET(request: Request) {
  const result = await backendFetch<PaymentMethods>("/payments/methods?platform=web", {
    clientUserAgent: getClientUserAgent(request)
  });
  return successJson(result.ok ? result.data : CARD_ONLY);
}
