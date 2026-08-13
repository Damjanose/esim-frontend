import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { applyCookies, errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { buildPendingTopupCookie } from "@/lib/session";
import { callWithSession } from "@/lib/with-session";

type PaymentSession = {
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  environment: string;
  expiresAt?: string;
};

export async function POST(request: Request) {
  let body: { order_id?: unknown; package_id?: unknown };
  try {
    body = (await request.json()) as { order_id?: unknown; package_id?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const rawOrderId = body.order_id;
  const orderId =
    typeof rawOrderId === "number" || typeof rawOrderId === "string"
      ? String(rawOrderId).trim()
      : "";
  const packageId = typeof body.package_id === "string" ? body.package_id.trim() : "";

  if (!orderId) {
    return errorJson("We could not tell which eSIM to top up.", 400);
  }
  if (!packageId) {
    return errorJson("Choose a top-up before paying.", 400);
  }

  // Must be the public origin: Pokpay sends a real browser here, and the backend
  // checks it against POKPAY_WEB_RETURN_ORIGINS.
  const returnUrl = new URL("/account/topup/return", getPublicOrigin(request)).toString();

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<PaymentSession>("/payments/topups/intent", {
      method: "POST",
      body: { order_id: rawOrderId, package_id: packageId, return_url: returnUrl },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return applyCookies(successJson(attempt.data, attempt.cookies), [
    buildPendingTopupCookie(orderId, attempt.data.paymentId)
  ]);
}
