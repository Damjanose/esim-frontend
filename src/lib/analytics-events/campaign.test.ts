import { describe, expect, it } from "vitest";
import { cleanCampaign, cleanUtmValue } from "./campaign";

describe("cleanUtmValue", () => {
  it("trims, lower-cases and keeps a plain value", () => {
    expect(cleanUtmValue("  Facebook  ")).toBe("facebook");
  });

  it("drops a value that contains @", () => {
    expect(cleanUtmValue("me@example.com")).toBeNull();
  });

  it("drops a value with 6 or more digits in a row, ignoring spaces and dashes", () => {
    expect(cleanUtmValue("4111 1111 1111")).toBeNull();
    expect(cleanUtmValue("call-123-456")).toBeNull();
  });

  it("keeps a value with fewer than 6 digits", () => {
    expect(cleanUtmValue("promo-12345")).toBe("promo-12345");
  });

  it("returns null for an empty value", () => {
    expect(cleanUtmValue("   ")).toBeNull();
    expect(cleanUtmValue(null)).toBeNull();
  });
});

describe("cleanCampaign", () => {
  it("keeps a clean source, medium and campaign", () => {
    expect(cleanCampaign({ source: "Google", medium: "cpc", campaign: "Spring" })).toEqual({
      source: "google",
      medium: "cpc",
      campaign: "spring"
    });
  });

  it("sets an invalid medium to null and keeps the rest", () => {
    expect(cleanCampaign({ source: "google", medium: "a@b", campaign: "spring" })).toEqual({
      source: "google",
      medium: null,
      campaign: "spring"
    });
  });

  it("drops the whole campaign when the source is invalid, so the campaign goes too", () => {
    expect(cleanCampaign({ source: "me@x.com", medium: "cpc", campaign: "spring" })).toBeNull();
  });

  it("returns null when there is no source", () => {
    expect(cleanCampaign({ source: null, medium: "cpc", campaign: "spring" })).toBeNull();
  });
});
