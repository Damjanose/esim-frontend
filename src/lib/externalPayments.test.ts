import { describe, expect, it } from "vitest";
import {
  CARD_ONLY,
  availableMethods,
  formatCountdown,
  isExternalPaymentId,
  shouldKeepPolling,
  successPath
} from "./externalPayments";

describe("external payments helpers", () => {
  it("always offers card first, then only the enabled methods", () => {
    expect(availableMethods(CARD_ONLY)).toEqual(["card"]);
    expect(
      availableMethods({ card: true, paypal: true, crypto: true, cryptoNetworks: [{ id: "tron-usdt", label: "x" }] })
    ).toEqual(["card", "paypal", "crypto"]);
    // Crypto switched on but no network configured: not offered.
    expect(availableMethods({ card: true, paypal: false, crypto: true, cryptoNetworks: [] })).toEqual(["card"]);
  });

  it("accepts only our pp_/cx_ ids", () => {
    expect(isExternalPaymentId("pp_abc-1_Z")).toBe(true);
    expect(isExternalPaymentId("cx_abc")).toBe(true);
    expect(isExternalPaymentId("pokpay-uuid")).toBe(false);
    expect(isExternalPaymentId("cx_../../admin")).toBe(false);
    expect(isExternalPaymentId(null)).toBe(false);
  });

  it("formats the invoice countdown", () => {
    const expires = "2026-10-30T10:30:00.000Z";
    expect(formatCountdown(expires, Date.parse("2026-10-30T10:00:00Z"))).toBe("30:00");
    expect(formatCountdown(expires, Date.parse("2026-10-30T10:29:51Z"))).toBe("0:09");
    expect(formatCountdown(expires, Date.parse("2026-10-30T10:30:00Z"))).toBeNull();
  });

  it("routes a finished plan to its order and a top-up back to its eSIM", () => {
    expect(successPath({ paymentId: "pp_1", kind: "package", order: { id: 42 } })).toBe("/account/42?new=1");
    expect(successPath({ paymentId: "pp_1", kind: "package", order: null })).toBeNull();
    expect(successPath({ paymentId: "cx_1", kind: "topup" }, 7)).toBe("/account/7?topup=1&payment=cx_1");
  });

  it("polls while pending, and briefly while a completed eSIM is still being set up", () => {
    expect(shouldKeepPolling({ status: "pending" }, 99)).toBe(true);
    expect(shouldKeepPolling({ status: "completed", order: { id: 1 } }, 0)).toBe(false);
    expect(shouldKeepPolling({ status: "completed", order: null }, 3)).toBe(true);
    expect(shouldKeepPolling({ status: "completed", order: null }, 24)).toBe(false);
    expect(shouldKeepPolling({ status: "underpaid" }, 0)).toBe(false);
  });
});
