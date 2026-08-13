import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, type CookieSpec } from "./session";

export function applyCookies<T extends NextResponse>(response: T, cookies: CookieSpec[]): T {
  for (const cookie of cookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export function successJson(data: unknown, cookies: CookieSpec[] = []): NextResponse {
  return applyCookies(NextResponse.json({ status: "success", data }), cookies);
}

export function errorJson(
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
  cookies: CookieSpec[] = []
): NextResponse {
  return applyCookies(
    NextResponse.json({ status: "error", error: message, ...extra }, { status }),
    cookies
  );
}

export function readSessionTokens(request: Request): {
  accessToken?: string;
  refreshToken?: string;
} {
  const header = request.headers.get("cookie") ?? "";
  const jar = new Map<string, string>();

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) {
      jar.set(name, decodeURIComponent(value));
    }
  }

  return {
    accessToken: jar.get(ACCESS_COOKIE) || undefined,
    refreshToken: jar.get(REFRESH_COOKIE) || undefined
  };
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim()) || undefined;
    }
  }
  return undefined;
}
