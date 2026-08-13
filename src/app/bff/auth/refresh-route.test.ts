import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { GET as refreshRoute } from "./refresh/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function getRequest(url: string, cookie?: string) {
  return new Request(url, {
    method: "GET",
    headers: cookie ? { cookie } : undefined
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /bff/auth/refresh", () => {
  it("rotates the cookies and returns the visitor to where they were", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "success",
          data: {
            token: "rotated-access",
            refreshToken: "rotated-refresh",
            expiresInSeconds: 604800,
            refreshExpiresInSeconds: 2592000
          }
        })
      )
    );

    const response = await refreshRoute(
      getRequest(
        "http://localhost:3000/bff/auth/refresh?next=%2Faccount%2F42",
        `${REFRESH_COOKIE}=valid-refresh`
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/account/42");
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.includes("rotated-access"))).toBe(true);
    expect(cookies.some((cookie) => cookie.includes("rotated-refresh"))).toBe(true);
  });

  it("sends the visitor to sign-in and clears cookies when the refresh token is dead", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Invalid refresh token" }, 401))
    );

    const response = await refreshRoute(
      getRequest(
        "http://localhost:3000/bff/auth/refresh?next=%2Faccount",
        `${REFRESH_COOKIE}=dead-refresh`
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/signin?next=%2Faccount"
    );
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=;`))).toBe(true);
  });

  it("goes to sign-in without calling the backend when there is no refresh cookie", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await refreshRoute(
      getRequest("http://localhost:3000/bff/auth/refresh?next=%2Faccount")
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/signin?next=%2Faccount"
    );
  });

  it("refuses to bounce the visitor to another origin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "success",
          data: {
            token: "rotated-access",
            refreshToken: "rotated-refresh",
            expiresInSeconds: 604800,
            refreshExpiresInSeconds: 2592000
          }
        })
      )
    );

    const response = await refreshRoute(
      getRequest(
        "http://localhost:3000/bff/auth/refresh?next=https%3A%2F%2Fevil.example.com",
        `${REFRESH_COOKIE}=valid-refresh`
      )
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/account");
  });

  it("returns the visitor to the public origin, not the proxied server's address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "success",
          data: {
            token: "rotated-access",
            refreshToken: "rotated-refresh",
            expiresInSeconds: 604800,
            refreshExpiresInSeconds: 2592000
          }
        })
      )
    );

    const request = new Request("https://localhost:3020/bff/auth/refresh?next=%2Fprofile", {
      method: "GET",
      headers: {
        cookie: `${REFRESH_COOKIE}=valid-refresh`,
        host: "esim.uplisoft.com",
        "x-forwarded-proto": "https"
      }
    });

    const response = await refreshRoute(request);

    expect(response.headers.get("location")).toBe("https://esim.uplisoft.com/profile");
  });

  it("sends a dead session to sign-in on the public origin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Invalid refresh token" }, 401))
    );

    const request = new Request("https://localhost:3020/bff/auth/refresh?next=%2Fprofile", {
      method: "GET",
      headers: {
        cookie: `${REFRESH_COOKIE}=dead-refresh`,
        host: "esim.uplisoft.com",
        "x-forwarded-proto": "https"
      }
    });

    const response = await refreshRoute(request);

    expect(response.headers.get("location")).toBe(
      "https://esim.uplisoft.com/signin?next=%2Fprofile"
    );
  });
});
