import { describe, expect, it } from "vitest";
import { destinationLabel } from "./destinationLabel";

describe("destinationLabel", () => {
  it("uses the web's country name for a backend code", () => {
    expect(destinationLabel("united-states")).toBe("United States");
  });

  it("falls back to title case for an unknown code", () => {
    expect(destinationLabel("saint-helena-island")).toBe("Saint Helena Island");
  });

  it("returns a dash for an empty value", () => {
    expect(destinationLabel("")).toBe("—");
  });
});
