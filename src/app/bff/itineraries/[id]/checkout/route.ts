import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";
import { isPlanId } from "@/lib/tripPlan/logic";
import { WEB_PURCHASES_DISABLED_MESSAGE } from "@/lib/web-purchases";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type UnlockResult = { free?: boolean; alreadyPurchased?: boolean; paymentId?: string };

/**
 * Starts the unlock. Free (or already purchased) plans come back unlocked and
 * pass through. Paid ones would return a Pokpay `paymentId` to charge on the
 * page, but web purchases are disabled (app-only), so those are refused with
 * 403 and the payment session is never handed to the browser.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isPlanId(id)) return errorJson("Plan not found", 404);

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<UnlockResult>(`/itineraries/${id}/checkout`, { method: "POST", token })
  );
  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, attempt.code ? { code: attempt.code } : {}, attempt.cookies);
  }
  const result = attempt.data;
  if (!result?.free && !result?.alreadyPurchased) {
    return errorJson(WEB_PURCHASES_DISABLED_MESSAGE, 403, {}, attempt.cookies);
  }
  return successJson(result, attempt.cookies);
}
