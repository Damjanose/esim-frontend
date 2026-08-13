import { backendFetch } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";
import { buildSessionCookies, type SessionPair } from "@/lib/session";

const OTP_PATTERN = /^\d{6}$/;

type VerifyData = SessionPair & { email: string };

export async function POST(request: Request) {
  let body: { email?: unknown; otp?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; otp?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  if (!email) {
    return errorJson("Enter your email address.", 400);
  }
  if (!OTP_PATTERN.test(otp)) {
    return errorJson("Enter the 6-digit code from your email.", 400);
  }

  const result = await backendFetch<VerifyData>("/auth/otp/verify", {
    method: "POST",
    body: { email, otp }
  });

  if (!result.ok) {
    return errorJson(result.message, result.status);
  }

  // Tokens go into httpOnly cookies only — never into the response body.
  return successJson({ email: result.data.email }, buildSessionCookies(result.data));
}
