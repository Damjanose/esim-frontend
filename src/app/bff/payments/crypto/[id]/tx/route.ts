import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { isExternalPaymentId, type ExternalPayment } from "@/lib/externalPayments";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** The buyer pasted their transaction hash (fallback when the amount was not sent exactly). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isExternalPaymentId(id)) return errorJson("Payment not found", 404);

  let body: { tx_hash?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid request body", 400);
  }
  const txHash = typeof body.tx_hash === "string" ? body.tx_hash.trim() : "";
  if (!txHash) return errorJson("Paste the transaction hash from your wallet.", 400);

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ExternalPayment>(`/payments/crypto/${encodeURIComponent(id)}/tx`, {
      method: "POST",
      body: { tx_hash: txHash },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  return successJson(attempt.data, attempt.cookies);
}
