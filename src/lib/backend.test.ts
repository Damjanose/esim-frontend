import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch, getBackendApiUrl } from "./backend";

const originalEnv = { ...process.env };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("getBackendApiUrl", () => {
  it("prefers BACKEND_API_URL and strips the trailing slash", () => {
    process.env.BACKEND_API_URL = "https://api.example.com/api/";

    expect(getBackendApiUrl()).toBe("https://api.example.com/api");
  });

  it("uses the hosted backend in development too", () => {
    delete process.env.BACKEND_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.stubEnv("NODE_ENV", "development");

    expect(getBackendApiUrl()).toBe("https://esim.uplisoft.com/api");
  });

  it("still allows an explicit local backend in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.BACKEND_API_URL = "http://127.0.0.1:4000/api";

    expect(getBackendApiUrl()).toBe("http://127.0.0.1:4000/api");
  });

  it("ignores a blank override", () => {
    process.env.BACKEND_API_URL = "   ";
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getBackendApiUrl()).toBe("https://esim.uplisoft.com/api");
  });

  it("falls back to the hosted backend outside development", () => {
    delete process.env.BACKEND_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.stubEnv("NODE_ENV", "production");

    expect(getBackendApiUrl()).toBe("https://esim.uplisoft.com/api");
  });
});

describe("backendFetch", () => {
  it("unwraps the success envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "success", data: { email: "a@b.co" } }))
    );

    const result = await backendFetch<{ email: string }>("/auth/otp/send");

    expect(result).toEqual({ ok: true, data: { email: "a@b.co" } });
  });

  it("returns the backend error message and status on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error", error: "Invalid code" }, 400))
    );

    const result = await backendFetch("/auth/otp/verify", { method: "POST", body: {} });

    expect(result).toMatchObject({ ok: false, status: 400, message: "Invalid code" });
  });

  it("preserves extra error fields such as the rate limit retry hint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ status: "error", error: "Too many OTP requests.", retryAfterSeconds: 45 }, 429)
      )
    );

    const result = await backendFetch("/auth/otp/send", { method: "POST", body: {} });

    expect(result).toMatchObject({
      ok: false,
      status: 429,
      payload: { retryAfterSeconds: 45 }
    });
  });

  it("reports a 502 when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );

    const result = await backendFetch("/orders");

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ status: 502 });
  });

  it("reports a 502 when the backend returns malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("<html>gateway timeout</html>", {
            status: 200,
            headers: { "content-type": "text/html" }
          })
      )
    );

    const result = await backendFetch("/orders");

    expect(result).toMatchObject({ ok: false, status: 502 });
  });

  it("sends the bearer token and JSON body when given one", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    process.env.BACKEND_API_URL = "https://api.example.com/api";

    await backendFetch("/payments/intent", {
      method: "POST",
      body: { package_id: "abc" },
      token: "tok-123"
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/api/payments/intent");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ package_id: "abc" }));
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer tok-123");
    expect(init.cache).toBe("no-store");
  });

  it("omits the authorization header when there is no token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: "success", data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await backendFetch("/packages");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });
});
