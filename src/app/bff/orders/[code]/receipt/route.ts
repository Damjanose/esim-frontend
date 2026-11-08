import { NextResponse } from "next/server";
import { backendFetchBinary } from "@/lib/backend";
import { isOrderCode } from "@/lib/orderCode";
import { applyCookies, errorJson, readSessionTokens } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ code: string }> };

/**
 * Streams the receipt PDF for one order. The backend decides access (buyer or
 * admin only) and answers everyone else with the same 404 as an unknown code.
 */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  if (!isOrderCode(code)) return errorJson("Order not found", 404);

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetchBinary(`/orders/${encodeURIComponent(code)}/receipt`, { token })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return applyCookies(
    new NextResponse(new Uint8Array(attempt.data.buffer), {
      status: 200,
      headers: {
        "Content-Type": attempt.data.contentType,
        "Content-Disposition": attempt.data.contentDisposition ?? `attachment; filename="receipt-${code}.pdf"`,
        "Cache-Control": "private, no-store"
      }
    }),
    attempt.cookies
  );
}
