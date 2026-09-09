import { describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  defaultConsent,
  parseConsentCookie,
  serializeConsentCookie,
  type ConsentState
} from "./consent";

describe("cookie consent state", () => {
  it("defaults optional categories to denied", () => {
    expect(defaultConsent).toEqual({
      version: CONSENT_VERSION,
      analytics: false,
      marketing: false
    });
  });

  it("round-trips a versioned consent choice", () => {
    const choice: ConsentState = {
      version: CONSENT_VERSION,
      analytics: true,
      marketing: false
    };

    expect(parseConsentCookie(serializeConsentCookie(choice))).toEqual(choice);
  });

  it("rejects malformed and outdated consent values", () => {
    expect(parseConsentCookie("not-json")).toBeNull();
    expect(parseConsentCookie(JSON.stringify({ version: "old", analytics: true, marketing: true }))).toBeNull();
  });
});
