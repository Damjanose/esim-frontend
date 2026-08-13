import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicOrigin } from "./public-origin";

function request(headers: Record<string, string> = {}, url = "http://localhost:3000/checkout/return") {
  return new Request(url, { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicOrigin", () => {
  it("prefers an explicitly configured public origin", () => {
    vi.stubEnv("PUBLIC_SITE_ORIGIN", "https://esim.uplisoft.com");

    expect(getPublicOrigin(request({ host: "internal:3000" }))).toBe("https://esim.uplisoft.com");
  });

  it("uses the forwarded host and protocol behind a reverse proxy", () => {
    expect(
      getPublicOrigin(
        request({ "x-forwarded-host": "esim.uplisoft.com", "x-forwarded-proto": "https" })
      )
    ).toBe("https://esim.uplisoft.com");
  });

  it("uses the Host header when there is no proxy", () => {
    expect(getPublicOrigin(request({ host: "192.168.1.4:3000" }))).toBe("http://192.168.1.4:3000");
  });

  it("does not fall back to the server bind hostname when a Host header exists", () => {
    // request.url reports localhost regardless of the Host header, which would
    // otherwise produce a return_url no allowlist can accept.
    expect(getPublicOrigin(request({ host: "esim.uplisoft.com" }))).not.toContain("localhost");
  });

  it("takes only the first entry of a forwarded host list", () => {
    expect(
      getPublicOrigin(
        request({ "x-forwarded-host": "esim.uplisoft.com, internal.lb", "x-forwarded-proto": "https" })
      )
    ).toBe("https://esim.uplisoft.com");
  });

  it("assumes https for a non-local forwarded host with no protocol given", () => {
    expect(getPublicOrigin(request({ "x-forwarded-host": "esim.uplisoft.com" }))).toBe(
      "https://esim.uplisoft.com"
    );
  });

  it("falls back to the request origin when no host information exists", () => {
    expect(getPublicOrigin(request({}))).toBe("http://localhost:3000");
  });

  it("ignores a malformed host header rather than building a broken origin", () => {
    expect(getPublicOrigin(request({ host: "not a host" }))).toBe("http://localhost:3000");
  });
});
