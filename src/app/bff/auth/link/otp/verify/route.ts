import { backendFetch } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";
import { buildSessionCookies, type SessionPair } from "@/lib/session";

const OTP_PATTERN = /^\d{6}$/;

type VerifyData = SessionPair & { email: string };

/**
 * Completes a social sign-in whose email the backend could not trust. Verifying
 * the code is what binds the provider identity to the account, so this is the
 * request that mints the session.
 */
export async function POST(request: Request) {
  let body: { linkTicket?: unknown; email?: unknown; otp?: unknown };
  try {
    body = (await request.json()) as { linkTicket?: unknown; email?: unknown; otp?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const linkTicket = typeof body.linkTicket === "string" ? body.linkTicket.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  if (!linkTicket) {
    return errorJson("Link session expired. Start sign-in again.", 401);
  }
  if (!email) {
    return errorJson("Enter your email address.", 400);
  }
  if (!OTP_PATTERN.test(otp)) {
    return errorJson("Enter the 6-digit code from your email.", 400);
  }

  const result = await backendFetch<VerifyData>("/auth/link/otp/verify", {
    method: "POST",
    body: { linkTicket, email, otp }
  });

  if (!result.ok) {
    return errorJson(result.message, result.status);
  }

  return successJson({ email: result.data.email }, buildSessionCookies(result.data));
}
