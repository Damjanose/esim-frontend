import { NextResponse } from "next/server";

/** Parses a JSON request body. Returns null when the body is missing or malformed. */
export async function readInsightsJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** 400 for a missing or malformed JSON body. Nothing is forwarded to the backend. */
export function invalidBody(): NextResponse {
  return NextResponse.json({ status: "error", message: "invalid_body" }, { status: 400 });
}
