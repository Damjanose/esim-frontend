import { describe, expect, it } from "vitest";
import { isAllowedClientErrorOrigin } from "./client-error-origin";

describe("isAllowedClientErrorOrigin", () => {
  it("allows the site, local dev, the request host and a missing origin", () => {
    expect(isAllowedClientErrorOrigin("https://esim.uplisoft.com", "127.0.0.1:3020")).toBe(true);
    expect(isAllowedClientErrorOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(isAllowedClientErrorOrigin("https://preview.example.com", "preview.example.com")).toBe(true);
    expect(isAllowedClientErrorOrigin(null, null)).toBe(true);
  });

  it("rejects foreign or malformed origins", () => {
    expect(isAllowedClientErrorOrigin("https://evil.example", "esim.uplisoft.com")).toBe(false);
    expect(isAllowedClientErrorOrigin("not a url", "esim.uplisoft.com")).toBe(false);
  });
});
