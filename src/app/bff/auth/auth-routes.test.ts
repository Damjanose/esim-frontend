import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { POST as otpSend } from "./otp/send/route";
import { POST as otpVerify } from "./otp/verify/route";
import { POST as signOut } from "./signout/route";

const sessionPair = {
  token: "access-token-value",
  refreshToken: "refresh-token-value",
  expiresInSeconds: 604800,
  refreshExpiresInSeconds: 2592000
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function postRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function setCookieHeaders(response: Response): string[] {
  return response.headers.getSetCookie();
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /bff/auth/otp/send", () => {
  it("forwards the email and returns the expiry without leaking backend internals", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ status: "success", data: { email: "a@b.co", expiresInSeconds: 300 } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await otpSend(
      postRequest("http://localhost:3000/bff/auth/otp/send", { email: "A@B.co" })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: "success", data: { email: "a@b.co", expiresInSeconds: 300 } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/otp/send");
    expect(init.body).toBe(JSON.stringify({ email: "A@B.co" }));
  });

  it("rejects a missing email before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await otpSend(postRequest("http://localhost:3000/bff/auth/otp/send", {}));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the rate limit retry hint through to the client", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Too many OTP requests.", retryAfterSeconds: 45 }, 429)
      )
    );

    const response = await otpSend(
      postRequest("http://localhost:3000/bff/auth/otp/send", { email: "a@b.co" })
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.retryAfterSeconds).toBe(45);
  });
});

describe("POST /bff/auth/otp/verify", () => {
  it("stores the session in httpOnly cookies and never returns tokens to the browser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { ...sessionPair, email: "a@b.co" } }))
    );

    const response = await otpVerify(
      postRequest("http://localhost:3000/bff/auth/otp/verify", {
        email: "a@b.co",
        otp: "123456"
      })
    );
    const raw = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(raw)).toEqual({ status: "success", data: { email: "a@b.co" } });
    expect(raw).not.toContain("access-token-value");
    expect(raw).not.toContain("refresh-token-value");

    const cookies = setCookieHeaders(response);
    const access = cookies.find((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=`));
    const refresh = cookies.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));

    expect(access).toContain("access-token-value");
    expect(access).toContain("HttpOnly");
    expect(access).toContain("SameSite=lax");
    expect(access).not.toContain("Secure");
    expect(refresh).toContain("refresh-token-value");
    expect(refresh).toContain("HttpOnly");
  });

  it("sets no cookies when the code is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Invalid code" }, 400))
    );

    const response = await otpVerify(
      postRequest("http://localhost:3000/bff/auth/otp/verify", {
        email: "a@b.co",
        otp: "000000"
      })
    );

    expect(response.status).toBe(400);
    expect(setCookieHeaders(response)).toEqual([]);
  });

  it("rejects a malformed code before calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await otpVerify(
      postRequest("http://localhost:3000/bff/auth/otp/verify", { email: "a@b.co", otp: "12" })
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /bff/auth/signout", () => {
  it("expires the session cookies", async () => {
    const response = await signOut();

    expect(response.status).toBe(200);
    const cookies = setCookieHeaders(response);
    expect(cookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=;`))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=;`))).toBe(true);
    expect(cookies.every((cookie) => cookie.includes("Max-Age=0"))).toBe(true);
  });
});
