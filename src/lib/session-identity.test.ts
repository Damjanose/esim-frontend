import { describe, expect, it } from "vitest";
import { readEmailFromAccessToken } from "./session-identity";

function makeToken(payload: unknown, prefix = "dev-auth"): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${encoded}.signature-we-cannot-check`;
}

const validPayload = {
  email: "traveller@example.com",
  kind: "access",
  iat: 1_760_000_000_000,
  exp: 4_102_444_800_000
};

describe("readEmailFromAccessToken", () => {
  it("reads the email out of a session access token", () => {
    expect(readEmailFromAccessToken(makeToken(validPayload))).toBe("traveller@example.com");
  });

  it("lowercases and trims the address so it displays consistently", () => {
    expect(
      readEmailFromAccessToken(makeToken({ ...validPayload, email: "  Traveller@Example.COM " }))
    ).toBe("traveller@example.com");
  });

  it("ignores refresh tokens, which are not the signed-in identity", () => {
    expect(readEmailFromAccessToken(makeToken({ ...validPayload, kind: "refresh" }))).toBeNull();
  });

  it("ignores an expired token rather than showing a stale identity", () => {
    expect(readEmailFromAccessToken(makeToken({ ...validPayload, exp: 1 }))).toBeNull();
  });

  it("returns null for anything that is not a readable token", () => {
    expect(readEmailFromAccessToken(null)).toBeNull();
    expect(readEmailFromAccessToken("")).toBeNull();
    expect(readEmailFromAccessToken("not-a-token")).toBeNull();
    expect(readEmailFromAccessToken("dev-auth.%%%.sig")).toBeNull();
    expect(readEmailFromAccessToken(makeToken({ ...validPayload, email: "not-an-email" }))).toBeNull();
    expect(readEmailFromAccessToken(makeToken("a string payload"))).toBeNull();
  });
});
