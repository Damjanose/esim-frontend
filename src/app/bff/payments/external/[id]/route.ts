import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { isExternalPaymentId, type ExternalPayment } from "@/lib/externalPayments";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Status of a PayPal/crypto payment; polled by the crypto step until it settles. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isExternalPaymentId(id)) return errorJson("Payment not found", 404);

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ExternalPayment>(`/payments/external/${encodeURIComponent(id)}`, {
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  return successJson(attempt.data, attempt.cookies);
}
