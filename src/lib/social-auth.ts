import { backendFetch } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";
import { buildSessionCookies, type SessionPair } from "@/lib/session";

/**
 * The backend answers a social sign-in with either a session or a challenge: an
 * identity whose email it cannot trust yet (Apple's Hide My Email, or a first
 * sign-in with no verified address) comes back as `linkRequired` plus a ticket,
 * which the browser redeems by claiming an email over OTP.
 */
export type SocialSignInData =
  | (SessionPair & { email: string; linkRequired?: undefined })
  | { linkRequired: true; linkTicket: string; suggestedEmail: string | null };

export async function exchangeSocialToken(
  path: "/auth/social/google" | "/auth/social/apple",
  body: Record<string, unknown>
) {
  const result = await backendFetch<SocialSignInData>(path, { method: "POST", body });

  if (!result.ok) {
    return errorJson(result.message, result.status);
  }

  if (result.data.linkRequired === true) {
    return successJson({
      linkRequired: true,
      linkTicket: result.data.linkTicket,
      suggestedEmail: result.data.suggestedEmail
    });
  }

  // Tokens go into httpOnly cookies only — never into the response body.
  return successJson({ email: result.data.email }, buildSessionCookies(result.data));
}
