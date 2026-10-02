import type { NextRequest } from "next/server";
import { successJson } from "@/lib/route-response";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Tells client components whether a session cookie is present, since both are
 * httpOnly. Same check as the middleware's route guard; it doesn't validate the
 * token, it only decides what the navbar shows.
 */
export function GET(request: NextRequest) {
  const signedIn = Boolean(
    request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE)?.value
  );
  return successJson({ signedIn });
}
