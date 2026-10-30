import { backendFetch, getClientUserAgent } from "@/lib/backend";
import { getPublicOrigin } from "@/lib/public-origin";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

type PaypalSession = { paymentId: string; approveUrl: string; amountCents: number; currency: string };

/**
 * Starts a PayPal checkout for a plan ({package_id, promo_code?}) or a top-up
 * ({order_id, package_id}). The return/cancel URLs must be on the public origin:
 * PayPal sends a real browser there and the backend checks it against its allowlist.
 * The backend appends ?payment_id= to both.
 */
export async function POST(request: Request) {
  let body: { package_id?: unknown; promo_code?: unknown; order_id?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const packageId = typeof body.package_id === "string" ? body.package_id.trim() : "";
  if (!packageId) return errorJson("Choose a plan before paying.", 400);
  const orderId =
    typeof body.order_id === "number" || typeof body.order_id === "string" ? String(body.order_id).trim() : "";
  const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim() : "";

  const origin = getPublicOrigin(request);
  const returnUrl = new URL("/checkout/paypal/return", origin);
  let cancelUrl: URL;
  if (orderId) {
    returnUrl.searchParams.set("order", orderId);
    cancelUrl = new URL(`/account/${encodeURIComponent(orderId)}`, origin);
    cancelUrl.searchParams.set("paypal", "cancelled");
  } else {
    cancelUrl = new URL("/checkout", origin);
    cancelUrl.searchParams.set("package", packageId);
    cancelUrl.searchParams.set("paypal", "cancelled");
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<PaypalSession>("/payments/paypal/intent", {
      method: "POST",
      body: {
        package_id: packageId,
        ...(orderId ? { order_id: body.order_id } : promoCode ? { promoCode } : {}),
        return_url: returnUrl.toString(),
        cancel_url: cancelUrl.toString()
      },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  return successJson(attempt.data, attempt.cookies);
}
