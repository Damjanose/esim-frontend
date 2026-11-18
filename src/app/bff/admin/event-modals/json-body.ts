/** Parses a JSON request body, or returns null when it is missing or malformed. */
export async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

export const INVALID_JSON_BODY = { status: "error", message: "Invalid JSON body" } as const;
