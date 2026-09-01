import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("JourneyAndCoverage section", () => {
  it("renders the 3 steps as separate elevated cards instead of one shared container with connector arrows", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).not.toContain("cardClassName");
    expect(source).not.toContain("usage-map.png");
    expect(source).toContain("installationSteps.map((step, index)");
  });

  it("replaces the static coverage map image with a live flag mosaic", () => {
    const source = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");

    expect(source).toContain("import { CoverageFlagMosaic }");
    expect(source).toContain("<CoverageFlagMosaic");
  });

  it("CoverageFlagMosaic sources real destination flags from the same live groups endpoint, and degrades silently on failure", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/CoverageFlagMosaic.tsx"),
      "utf8",
    );

    expect(source).toContain("fetchPackageGroups");
    expect(source).toContain("groups.popular");
    expect(source).toContain(".catch(");
  });
});
