import { errorJson } from "@/lib/route-response";
import { exchangeSocialToken } from "@/lib/social-auth";

export async function POST(request: Request) {
  let body: { idToken?: unknown; nonce?: unknown };
  try {
    body = (await request.json()) as { idToken?: unknown; nonce?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  const nonce = typeof body.nonce === "string" ? body.nonce.trim() : "";

  if (!idToken) {
    return errorJson("Google sign-in did not return a credential.", 400);
  }

  return exchangeSocialToken("/auth/social/google", {
    idToken,
    ...(nonce ? { nonce } : {})
  });
}
