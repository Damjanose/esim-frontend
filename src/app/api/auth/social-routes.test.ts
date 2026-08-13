import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { POST as appleSignIn } from "./social/apple/route";
import { POST as googleSignIn } from "./social/google/route";
import { POST as linkVerify } from "./link/otp/verify/route";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const sessionPair = {
  token: "access-token",
  refreshToken: "refresh-token",
  expiresInSeconds: 604800,
  refreshExpiresInSeconds: 2592000,
  email: "traveller@example.com"
};

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/auth/social/google", () => {
  it("exchanges the Google credential for session cookies", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: sessionPair }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await googleSignIn(
      post("http://localhost:3000/api/auth/social/google", {
        idToken: "google-id-token",
        nonce: "n-1"
      })
    );
    const payload = (await response.json()) as { data: Record<string, unknown> };

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/social/google");
    expect(JSON.parse(String(init.body))).toEqual({ idToken: "google-id-token", nonce: "n-1" });

    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=access-token`))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=refresh-token`))).toBe(
      true
    );

    // Tokens belong in httpOnly cookies, never in a body the page can read.
    expect(JSON.stringify(payload.data)).not.toContain("access-token");
    expect(JSON.stringify(payload.data)).not.toContain("refresh-token");
  });

  it("passes the link-required challenge back without minting a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "success",
          data: { linkRequired: true, linkTicket: "ticket-1", suggestedEmail: "bob@example.com" }
        })
      )
    );

    const response = await googleSignIn(
      post("http://localhost:3000/api/auth/social/google", { idToken: "google-id-token" })
    );
    const payload = (await response.json()) as {
      data: { linkRequired: boolean; linkTicket: string; suggestedEmail: string };
    };

    expect(payload.data.linkRequired).toBe(true);
    expect(payload.data.linkTicket).toBe("ticket-1");
    expect(payload.data.suggestedEmail).toBe("bob@example.com");
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("rejects a request with no credential", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await googleSignIn(
      post("http://localhost:3000/api/auth/social/google", {})
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend's refusal when Google sign-in is not configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Google sign-in is not configured" }, 503)
      )
    );

    const response = await googleSignIn(
      post("http://localhost:3000/api/auth/social/google", { idToken: "google-id-token" })
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(503);
    expect(payload.error).toBe("Google sign-in is not configured");
  });
});

describe("POST /api/auth/social/apple", () => {
  it("forwards the identity token and nonce", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: sessionPair }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await appleSignIn(
      post("http://localhost:3000/api/auth/social/apple", {
        identityToken: "apple-identity-token",
        nonce: "n-2"
      })
    );

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/social/apple");

    const sent = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(sent.identityToken).toBe("apple-identity-token");
    expect(sent.nonce).toBe("n-2");
    // No authorizationCode: a web code cannot be exchanged against the bundle id,
    // so sending one would only produce a failed exchange.
    expect(sent.authorizationCode).toBeUndefined();

    expect(response.headers.getSetCookie().length).toBeGreaterThan(0);
  });

  it("rejects a request with no identity token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await appleSignIn(post("http://localhost:3000/api/auth/social/apple", {}));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/link/otp/verify", () => {
  it("mints session cookies once the email is claimed", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: sessionPair }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await linkVerify(
      post("http://localhost:3000/api/auth/link/otp/verify", {
        linkTicket: "ticket-1",
        email: "bob@example.com",
        otp: "123456"
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().some((c) => c.startsWith(ACCESS_COOKIE))).toBe(true);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      linkTicket: "ticket-1",
      email: "bob@example.com",
      otp: "123456"
    });
  });

  it("rejects a malformed code before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await linkVerify(
      post("http://localhost:3000/api/auth/link/otp/verify", {
        linkTicket: "ticket-1",
        email: "bob@example.com",
        otp: "12"
      })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an expired link session so the visitor restarts sign-in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Link session expired. Start sign-in again." }, 401)
      )
    );

    const response = await linkVerify(
      post("http://localhost:3000/api/auth/link/otp/verify", {
        linkTicket: "stale",
        email: "bob@example.com",
        otp: "123456"
      })
    );
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toContain("Link session expired");
  });
});
