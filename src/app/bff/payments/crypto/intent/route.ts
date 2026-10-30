import { backendFetch, getClientUserAgent } from "@/lib/backend";
import type { ExternalPayment } from "@/lib/externalPayments";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Creates a crypto invoice for a plan ({package_id, promo_code?}) or a top-up ({order_id, package_id}). */
export async function POST(request: Request) {
  let body: { package_id?: unknown; promo_code?: unknown; order_id?: unknown; network?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const packageId = typeof body.package_id === "string" ? body.package_id.trim() : "";
  const network = typeof body.network === "string" ? body.network : "";
  if (!packageId) return errorJson("Choose a plan before paying.", 400);
  if (network !== "tron-usdt" && network !== "bsc-usdt") return errorJson("Choose a network.", 400);
  const hasOrder = typeof body.order_id === "number" || (typeof body.order_id === "string" && body.order_id.trim());
  const promoCode = typeof body.promo_code === "string" ? body.promo_code.trim() : "";

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<ExternalPayment>("/payments/crypto/intent", {
      method: "POST",
      body: {
        package_id: packageId,
        network,
        ...(hasOrder ? { order_id: body.order_id } : promoCode ? { promoCode } : {})
      },
      token,
      clientUserAgent: getClientUserAgent(request)
    })
  );

  if (!attempt.ok) return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  return successJson(attempt.data, attempt.cookies);
}
