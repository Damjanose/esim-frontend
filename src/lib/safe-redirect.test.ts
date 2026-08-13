import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps a relative path with its query string", () => {
    expect(safeNextPath("/checkout?package=hej-telecom-in-30days-20gb")).toBe(
      "/checkout?package=hej-telecom-in-30days-20gb"
    );
  });

  it("rejects protocol-relative URLs that would leave the site", () => {
    expect(safeNextPath("//evil.example.com/phish")).toBe("/account");
  });

  it("rejects absolute URLs", () => {
    expect(safeNextPath("https://evil.example.com")).toBe("/account");
  });

  it("rejects backslash-prefixed paths browsers may normalise to //", () => {
    expect(safeNextPath("/\\evil.example.com")).toBe("/account");
  });

  it("rejects paths that do not start with a slash", () => {
    expect(safeNextPath("account")).toBe("/account");
  });

  it("falls back for missing values", () => {
    expect(safeNextPath(null)).toBe("/account");
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath("")).toBe("/account");
  });

  it("honours a caller-supplied fallback", () => {
    expect(safeNextPath("https://evil.example.com", "/signin")).toBe("/signin");
  });
});
