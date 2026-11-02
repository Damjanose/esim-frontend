import { describe, expect, it } from "vitest";
import {
  CHARGED_PAYMENT_KEY,
  CHARGED_PAYMENT_MAX_AGE_MS,
  clearChargedPayment,
  readChargedPayment,
  saveChargedPayment
} from "./chargedPayment";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key)
  };
}

describe("chargedPayment", () => {
  it("round-trips a payment for the same package", () => {
    const storage = memoryStorage();
    saveChargedPayment({ paymentId: "pay_1", packageId: "pkg", at: 1000 }, storage);
    expect(readChargedPayment("pkg", 2000, storage)).toEqual({ paymentId: "pay_1", packageId: "pkg", at: 1000 });
  });

  it("ignores another package, stale entries, junk and missing storage", () => {
    const storage = memoryStorage();
    saveChargedPayment({ paymentId: "pay_1", packageId: "pkg", at: 1000 }, storage);
    expect(readChargedPayment("other", 2000, storage)).toBeNull();
    expect(readChargedPayment("pkg", 1000 + CHARGED_PAYMENT_MAX_AGE_MS + 1, storage)).toBeNull();
    storage.setItem(CHARGED_PAYMENT_KEY, "{not json");
    expect(readChargedPayment("pkg", 2000, storage)).toBeNull();
    expect(readChargedPayment("pkg", 2000, null)).toBeNull();
  });

  it("clears the entry", () => {
    const storage = memoryStorage();
    saveChargedPayment({ paymentId: "pay_1", packageId: "pkg", at: 1000 }, storage);
    clearChargedPayment(storage);
    expect(readChargedPayment("pkg", 2000, storage)).toBeNull();
  });
});
