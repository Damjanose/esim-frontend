import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  PENDING_PAYMENT_COOKIE,
  PENDING_TOPUP_COOKIE,
  REFRESH_COOKIE,
  buildClearedSessionCookies,
  buildPendingTopupCookie,
  buildSessionCookies,
  parsePendingTopupCookie
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

describe("buildPendingTopupCookie", () => {
  it("remembers the eSIM and the payment together", () => {
    const cookie = buildPendingTopupCookie("42", "sdk_order_1");

    expect(cookie.name).toBe(PENDING_TOPUP_COOKIE);
    expect(cookie.value).toBe("42:sdk_order_1");
    expect(cookie.options.httpOnly).toBe(true);
    // SameSite=Lax still accompanies Pokpay's cross-site GET navigation back.
    expect(cookie.options.sameSite).toBe("lax");
  });
});

describe("parsePendingTopupCookie", () => {
  it("reads back the eSIM and the payment", () => {
    expect(parsePendingTopupCookie("42:sdk_order_1")).toEqual({
      orderId: "42",
      paymentId: "sdk_order_1"
    });
  });

  it("tolerates a value with no payment id", () => {
    expect(parsePendingTopupCookie("42")).toEqual({ orderId: "42", paymentId: null });
  });

  it("returns nothing for a missing or empty cookie", () => {
    expect(parsePendingTopupCookie(undefined)).toEqual({ orderId: null, paymentId: null });
    expect(parsePendingTopupCookie("")).toEqual({ orderId: null, paymentId: null });
    expect(parsePendingTopupCookie(":")).toEqual({ orderId: null, paymentId: null });
  });
});

describe("buildClearedSessionCookies", () => {
  it("expires both session cookies and both pending payment cookies", () => {
    const cookies = buildClearedSessionCookies();

    expect(cookies.map((cookie) => cookie.name)).toEqual([
      ACCESS_COOKIE,
      REFRESH_COOKIE,
      PENDING_PAYMENT_COOKIE,
      PENDING_TOPUP_COOKIE
    ]);
    expect(cookies.every((cookie) => cookie.value === "")).toBe(true);
    expect(cookies.every((cookie) => cookie.options.maxAge === 0)).toBe(true);
  });
});
