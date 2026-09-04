import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PROMO_STORAGE_KEY,
  clearStoredPromo,
  readStoredPromo,
  writeStoredPromo
} from "./PromoCodeField";

/**
 * These cover only the pure localStorage read/write/clear helpers — this repo's
 * vitest setup runs in a plain `node` environment (no jsdom/testing-library), so
 * there's no rendering here. `window` is stubbed with a minimal in-memory
 * localStorage rather than a real one.
 */
function stubWindow() {
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      }
    }
  };
  return store;
}

describe("checkout promo localStorage persistence", () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  beforeEach(() => {
    stubWindow();
  });

  it("round-trips a promo code for the same package", () => {
    writeStoredPromo("pkg-a", "FRIEND10");
    expect(readStoredPromo("pkg-a")).toBe("FRIEND10");
  });

  it("ignores a stored code when the package id no longer matches", () => {
    writeStoredPromo("pkg-a", "FRIEND10");
    expect(readStoredPromo("pkg-b")).toBeNull();
  });

  it("returns null when nothing has been stored", () => {
    expect(readStoredPromo("pkg-a")).toBeNull();
  });

  it("clears the stored value", () => {
    writeStoredPromo("pkg-a", "FRIEND10");
    clearStoredPromo();
    expect(readStoredPromo("pkg-a")).toBeNull();
  });

  it("stores under the documented key so it's inspectable/debuggable", () => {
    const store = stubWindow();
    writeStoredPromo("pkg-a", "FRIEND10");
    expect(store.has(PROMO_STORAGE_KEY)).toBe(true);
    expect(JSON.parse(store.get(PROMO_STORAGE_KEY)!)).toEqual({
      promoCode: "FRIEND10",
      packageId: "pkg-a"
    });
  });

  it("tolerates malformed JSON already in storage", () => {
    const store = stubWindow();
    store.set(PROMO_STORAGE_KEY, "{not json");
    expect(readStoredPromo("pkg-a")).toBeNull();
  });
});
