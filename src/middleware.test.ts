import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

/**
 * In production nginx terminates TLS and proxies to the Next server on
 * 127.0.0.1:3020, so `nextUrl` reports the internal listen address while the
 * public host only survives in the forwarded headers. Every redirect the
 * middleware emits must be built from those headers, never from `nextUrl`.
 */
function proxied(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "https://localhost:3020"), {
    headers: {
      host: "esim.uplisoft.com",
      "x-forwarded-host": "esim.uplisoft.com",
      "x-forwarded-proto": "https",
      ...headers
    }
  });
}

describe("middleware redirects behind a reverse proxy", () => {
  it("sends signed-out visitors to the public sign-in URL, not the internal one", () => {
    const response = middleware(proxied("/profile"));

    expect(response.headers.get("location")).toBe(
      "https://esim.uplisoft.com/signin?next=%2Fprofile"
    );
  });

  it("keeps the query string on the guarded path it came from", () => {
    const response = middleware(proxied("/account?topup=1"));

    expect(response.headers.get("location")).toBe(
      "https://esim.uplisoft.com/signin?next=%2Faccount%3Ftopup%3D1"
    );
  });

  it("strips a trailing slash without leaking the internal host", () => {
    const response = middleware(proxied("/destinations/"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/destinations");
  });

  it("redirects the www host to the canonical host", () => {
    const response = middleware(
      proxied("/", { host: "www.esim.uplisoft.com", "x-forwarded-host": "www.esim.uplisoft.com" })
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/");
  });

  it("upgrades a proxied plain-http request to https on the canonical host", () => {
    const response = middleware(proxied("/support", { "x-forwarded-proto": "http" }));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/support");
  });

  it("leaves unguarded pages alone", () => {
    const response = middleware(proxied("/destinations"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("still works when nothing sits in front of the server", () => {
    const response = middleware(
      new NextRequest(new URL("/profile", "http://localhost:3000"), {
        headers: { host: "localhost:3000" }
      })
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/signin?next=%2Fprofile"
    );
  });
});
