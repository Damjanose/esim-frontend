/** Parses a JSON request body. Returns null when the body is missing or malformed. */
export async function readInsightsJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
