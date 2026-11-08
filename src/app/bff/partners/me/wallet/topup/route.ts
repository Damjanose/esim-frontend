import { backendFetch } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";
import { buildPendingWalletTopupCookie } from "@/lib/session";

type PaymentSession = {
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  environment: string;
  expiresAt?: string;
};

/**
 * Starts a Pokpay-hosted checkout for a partner topping up their own wallet
 * balance (credited by `/partners/wallet/return`, which calls
 * `/payments/wallet-topups/provision` when Pokpay sends the partner back; there is
 * no Pokpay webhook), as opposed to `/partners/me/wallet/transfer`,
 * which moves already-earned commission into the wallet with no payment
 * involved). Mirrors `bff/payments/intent` and `bff/payments/topups/intent`:
 * the return_url must be the public origin, since the backend checks it
 * against POKPAY_WEB_RETURN_ORIGINS.
 */
export async function POST(request: Request) {
  let body: { amountCents?: unknown };
  try {
    body = (await request.json()) as { amountCents?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const amountCents = typeof body.amountCents === "number" ? body.amountCents : null;
  if (amountCents === null || !Number.isInteger(amountCents) || amountCents <= 0) {
    return errorJson("amountCents must be a positive integer", 400);
  }

  const returnUrl = new URL("/partners/wallet/return", getPublicOrigin(request)).toString();

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<PaymentSession>("/payments/wallet-topups/intent", {
      method: "POST",
      body: { amount_cents: amountCents, return_url: returnUrl },
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  // /partners/wallet/return reads this: Pokpay's return URL carries no payment id.
  return successJson(attempt.data, [...attempt.cookies, buildPendingWalletTopupCookie(attempt.data.paymentId)]);
}
