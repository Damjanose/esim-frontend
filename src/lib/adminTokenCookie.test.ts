import { describe, expect, it } from "vitest";
import {
  ADMIN_TOKEN_COOKIE,
  adminTokenCookie,
  adminTokenMaxAgeSeconds,
  clearedAdminTokenCookie,
  readAdminTokenCookie
} from "./adminTokenCookie";

function tokenWithExp(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ email: "a@b.co", iat: 0, exp }))
    .toString("base64url");
  return `adm1.${payload}.sig`;
}

describe("admin token cookie", () => {
  const now = 1_700_000_000_000;

  it("lives exactly as long as the token", () => {
    expect(adminTokenMaxAgeSeconds(tokenWithExp(now + 12 * 3600 * 1000), now)).toBe(12 * 3600);
    expect(adminTokenMaxAgeSeconds(tokenWithExp(now - 1000), now)).toBe(0);
    expect(adminTokenMaxAgeSeconds("garbage", now)).toBe(0);
    expect(adminTokenMaxAgeSeconds("a.!!!.c", now)).toBe(0);
  });

  it("reads the token back from document.cookie", () => {
    const token = tokenWithExp(now);
    const cookie = `other=1; ${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(token)}; theme=dark`;
    expect(readAdminTokenCookie(cookie)).toBe(token);
    expect(readAdminTokenCookie("other=1")).toBe("");
  });

  it("is strict same-site, site-wide, and secure on https", () => {
    const cookie = adminTokenCookie("t", 60, true);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=60");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Secure");
    expect(adminTokenCookie("t", 60, false)).not.toContain("Secure");
    expect(clearedAdminTokenCookie(true)).toContain("Max-Age=0");
  });
});
