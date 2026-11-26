import { describe, expect, it } from "vitest";
import { claimFailureSlot, failureCodeFromReason, failureEventFor } from "./failure";

describe("failureCodeFromReason", () => {
  it.each([
    ["unpaid", "declined"],
    ["missing_payment", "validation"],
    ["signin", "auth_failed"],
    ["unconfirmed", "provider_error"],
    ["provisioning", "provider_error"],
    ["setting_up", "provider_error"],
    ["pending", "other"],
    ["refunded", "other"],
    ["cancelled", "cancelled"],
    ["timeout", "timeout"],
    ["network", "network"],
    ["declined", "declined"]
  ])("maps %j to %j", (reason, code) => {
    expect(failureCodeFromReason(reason)).toBe(code);
  });

  it("never returns a provider message: anything unknown becomes other", () => {
    expect(failureCodeFromReason("Card 4111 was refused by bank XYZ")).toBe("other");
    expect(failureCodeFromReason(null)).toBe("other");
    expect(failureCodeFromReason(undefined)).toBe("other");
  });
});

describe("failureEventFor", () => {
  it("sends a declined card failure", () => {
    expect(failureEventFor({ reason: "unpaid", method: "card" })).toEqual({ paymentMethod: "card", failureCode: "declined" });
  });

  it("uses the method from the return route, and other when it is missing", () => {
    expect(failureEventFor({ reason: "unpaid", method: "paypal" })?.paymentMethod).toBe("paypal");
    expect(failureEventFor({ reason: "unpaid" })?.paymentMethod).toBe("other");
  });

  it.each(["setting_up", "pending", "review", "refunded", "signin"])("sends nothing for the %s outcome", (reason) => {
    expect(failureEventFor({ reason, method: "card" })).toBeNull();
  });

  it("sends nothing for a wallet top-up or partner payment", () => {
    expect(failureEventFor({ reason: "unpaid", method: "card", kind: "wallet" })).toBeNull();
  });
});

describe("claimFailureSlot", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  };

  it("claims a payment once, so a reload does not send it again", () => {
    const storage = memory();
    expect(claimFailureSlot(storage, "pay_123")).toBe(true);
    expect(claimFailureSlot(storage, "pay_123")).toBe(false);
    expect(claimFailureSlot(storage, "pay_456")).toBe(true);
  });

  it("cannot dedupe without a payment reference, so it always claims", () => {
    expect(claimFailureSlot(memory(), "")).toBe(true);
  });
});

