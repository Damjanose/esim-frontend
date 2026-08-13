import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  PENDING_PAYMENT_COOKIE,
  REFRESH_COOKIE,
  buildClearedSessionCookies,
  buildSessionCookies
} from "./session";

afterEach(() => {
  vi.unstubAllEnvs();
});

const pair = {
  token: "access-token",
  refreshToken: "refresh-token",
  expiresInSeconds: 604800,
  refreshExpiresInSeconds: 2592000
};

describe("buildSessionCookies", () => {
  it("stores both tokens as httpOnly lax cookies with the backend max ages", () => {
    vi.stubEnv("NODE_ENV", "production");

    const cookies = buildSessionCookies(pair);

    expect(cookies).toEqual([
      {
        name: ACCESS_COOKIE,
        value: "access-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 604800
        }
      },
      {
        name: REFRESH_COOKIE,
        value: "refresh-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 2592000
        }
      }
    ]);
  });

  it("omits the Secure flag in development so plain-http LAN testing works", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookies = buildSessionCookies(pair);

    expect(cookies.every((cookie) => cookie.options.secure === false)).toBe(true);
  });
});

describe("buildClearedSessionCookies", () => {
  it("expires both session cookies and the pending payment cookie", () => {
    const cookies = buildClearedSessionCookies();

    expect(cookies.map((cookie) => cookie.name)).toEqual([
      ACCESS_COOKIE,
      REFRESH_COOKIE,
      PENDING_PAYMENT_COOKIE
    ]);
    expect(cookies.every((cookie) => cookie.value === "")).toBe(true);
    expect(cookies.every((cookie) => cookie.options.maxAge === 0)).toBe(true);
  });
});
