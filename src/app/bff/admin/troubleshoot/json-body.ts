import { NextResponse } from "next/server";

/** Parses the request JSON body, or returns the 400 response to send back. */
export async function readJsonBody(request: Request): Promise<{ body: unknown } | { error: NextResponse }> {
  try {
    return { body: await request.json() };
  } catch {
    return {
      error: NextResponse.json({ status: "error", message: "Invalid JSON body" }, { status: 400 })
    };
  }
}
