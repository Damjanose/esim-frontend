import { backendFetch } from "@/lib/backend";
import { errorJson, successJson } from "@/lib/route-response";

type OtpSendData = {
  email: string;
  expiresInSeconds: number;
};

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return errorJson("Invalid request body", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return errorJson("Enter your email address.", 400);
  }

  const result = await backendFetch<OtpSendData>("/auth/otp/send", {
    method: "POST",
    body: { email }
  });

  if (!result.ok) {
    const retryAfterSeconds = result.payload?.retryAfterSeconds;
    return errorJson(
      result.message,
      result.status,
      typeof retryAfterSeconds === "number" ? { retryAfterSeconds } : {}
    );
  }

  return successJson(result.data);
}
