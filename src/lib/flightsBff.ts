import { NextResponse } from "next/server";
import { backendFetch, getClientIp } from "@/lib/backend";

/**
 * Forwards one public flight call to the backend. Backend status codes pass
 * through unchanged (400 validation, 429 rate limit, 503 upstream down).
 * `revalidate` caches the reference lists (countries, airports); search is never cached.
 */
export async function proxyFlights(request: Request, path: string, revalidate?: number) {
  // Next's fetch cache key includes request headers, so reference (revalidated)
  // routes must not carry the per-visitor X-Client-IP/X-BFF-Key headers.
  const result = await backendFetch<unknown>(
    path,
    revalidate ? { next: { revalidate } } : { clientIp: getClientIp(request) }
  );

  if (!result.ok) {
    const retryAfter = result.payload?.retryAfterSeconds;
    return NextResponse.json(
      {
        status: "error",
        error: result.message,
        ...(typeof retryAfter === "number" ? { retryAfterSeconds: retryAfter } : {})
      },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { status: "success", data: result.data },
    {
      headers: {
        "Cache-Control": revalidate
          ? `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`
          : "no-store"
      }
    }
  );
}
