import { backendFetch } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";

export async function POST(request: Request) {
  let body: { linkTicket?: unknown; email?: unknown };
  try {
    body = (await request.json()) as { linkTicket?: unknown; email?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const linkTicket = typeof body.linkTicket === "string" ? body.linkTicket.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!linkTicket) {
    return errorJson("Link session expired. Start sign-in again.", 401);
  }
  if (!email) {
    return errorJson("Enter your email address.", 400);
  }

  const result = await backendFetch<{ email: string; expiresInSeconds: number }>(
    "/auth/link/otp/send",
    { method: "POST", body: { linkTicket, email } }
  );

  if (!result.ok) {
    return errorJson(result.message, result.status, {
      // Preserved so the form can show an accurate resend cooldown.
      ...(typeof result.payload?.retryAfterSeconds === "number"
        ? { retryAfterSeconds: result.payload.retryAfterSeconds }
        : {})
    });
  }

  return successJson(result.data);
}
