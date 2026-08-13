import { successJson } from "@/lib/route-response";
import { buildClearedSessionCookies } from "@/lib/session";

/**
 * Clears the browser session. Backend session tokens are stateless HMAC values
 * with no revocation list, so the token itself stays valid until it expires.
 */
export async function POST() {
  return successJson({ signedOut: true }, buildClearedSessionCookies());
}
