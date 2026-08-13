import { errorJson } from "@/lib/route-response";
import { exchangeSocialToken } from "@/lib/social-auth";

export async function POST(request: Request) {
  let body: { identityToken?: unknown; nonce?: unknown };
  try {
    body = (await request.json()) as { identityToken?: unknown; nonce?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const identityToken =
    typeof body.identityToken === "string" ? body.identityToken.trim() : "";
  const nonce = typeof body.nonce === "string" ? body.nonce.trim() : "";

  if (!identityToken) {
    return errorJson("Apple sign-in did not return an identity token.", 400);
  }

  // Deliberately no `authorizationCode`. The backend exchanges codes against
  // APPLE_BUNDLE_ID, which is the native client; a code minted for the web
  // Services ID would be rejected by Apple. The consequence is that a web-only
  // Apple account has no stored refresh token, so revoke-on-delete does not
  // cover it — see the session log for the follow-up that would.
  return exchangeSocialToken("/auth/social/apple", {
    identityToken,
    ...(nonce ? { nonce } : {})
  });
}
