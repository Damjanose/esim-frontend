import { describe, expect, it } from "vitest";
import { sanitizeSearchTerm } from "./sanitize";

describe("sanitizeSearchTerm (same rules as the backend)", () => {
  it.each([
    ["  Turkey  eSIM ", "turkey esim"],
    ["me@x.com", null],
    ["4111 1111 1111", null],
    ["call 123-456", null],
    ["a", null],
    ["   ", null]
  ])("%j becomes %j", (raw, expected) => {
    expect(sanitizeSearchTerm(raw)).toBe(expected);
  });

  it("cuts a long term to 60 characters", () => {
    expect(sanitizeSearchTerm("x".repeat(100))).toBe("x".repeat(60));
  });
});
