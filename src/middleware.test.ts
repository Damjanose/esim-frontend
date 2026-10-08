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

describe("middleware indexing signals", () => {
  it("308s a known ?country= view to its /esim page, keeping the plan filters", () => {
    const response = middleware(proxied("/destinations?country=albania&daysMin=7"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/esim/albania?daysMin=7");
  });

  it("308s backend country codes to the public /esim slug", () => {
    const response = middleware(proxied("/destinations?country=united-states"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/esim/usa");
  });

  it("keeps the live plan view for countries without an /esim page, as noindex", () => {
    const response = middleware(proxied("/destinations?country=kenya"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("leaves the /destinations hub indexable", () => {
    const response = middleware(proxied("/destinations"));

    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it("308s uppercase content slugs to lowercase instead of a 404", () => {
    const response = middleware(proxied("/esim/Japan"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/esim/japan");
    expect(middleware(proxied("/travel/How-To-Install-eSIM")).headers.get("location")).toBe(
      "https://esim.uplisoft.com/travel/how-to-install-esim"
    );
  });

  it("does not lowercase private eSIM ids", () => {
    const response = middleware(proxied("/esim/id/AbC123"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("sends X-Robots-Tag on private pages and on their sign-in redirects", () => {
    expect(middleware(proxied("/checkout?package=x")).headers.get("x-robots-tag")).toBe(
      "noindex, nofollow"
    );
    expect(middleware(proxied("/signin")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(middleware(proxied("/profile")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(middleware(proxied("/partners/request")).headers.get("x-robots-tag")).toBe(
      "noindex, nofollow"
    );
  });

  it("does not send X-Robots-Tag on public content", () => {
    for (const path of ["/", "/esim/japan", "/travel/how-to-install-esim", "/trip-plan"]) {
      expect(middleware(proxied(path)).headers.get("x-robots-tag")).toBeNull();
    }
  });
});
