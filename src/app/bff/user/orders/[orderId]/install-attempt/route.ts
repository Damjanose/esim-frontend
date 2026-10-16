import { backendFetch } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

/**
 * Records the first install attempt (Install on this iPhone, activation code copied).
 * Idempotent on the backend. The mobile gift sheet warns on it, because a downloaded
 * profile can't install again and Airalo can't tell us whether one was downloaded.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  if (!/^\d+$/.test(orderId)) return errorJson("Order not found", 404);

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetch<{ install_attempted_at: string | null }>(`/orders/${orderId}/install-attempt`, {
      method: "POST",
      token
    })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
