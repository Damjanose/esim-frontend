import { backendFetchFormData } from "@/lib/backend";
import { errorJson, readSessionTokens, successJson } from "@/lib/route-response";
import { callWithSession } from "@/lib/with-session";

/** Uploads one photo; the returned attachment id is then sent with a message. */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorJson("Invalid multipart body", 400);
  }

  const attempt = await callWithSession(readSessionTokens(request), (token) =>
    backendFetchFormData<unknown>("/support/attachments", { token, formData })
  );

  if (!attempt.ok) {
    return errorJson(attempt.message, attempt.status, {}, attempt.cookies);
  }

  return successJson(attempt.data, attempt.cookies);
}
