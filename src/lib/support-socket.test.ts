import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicSocketUrl } from "./support-socket";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getPublicSocketUrl", () => {
  it("prefers NEXT_PUBLIC_SOCKET_URL and strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_SOCKET_URL = "http://127.0.0.1:4000/";
    expect(getPublicSocketUrl()).toBe("http://127.0.0.1:4000");
  });

  it("derives the origin from NEXT_PUBLIC_API_URL by dropping /api", () => {
    delete process.env.NEXT_PUBLIC_SOCKET_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:4000/api";
    expect(getPublicSocketUrl()).toBe("http://127.0.0.1:4000");
  });

  it("defaults to the production host", () => {
    delete process.env.NEXT_PUBLIC_SOCKET_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getPublicSocketUrl()).toBe("https://esim.uplisoft.com");
  });
});
