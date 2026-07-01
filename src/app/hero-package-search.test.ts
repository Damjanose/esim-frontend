import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("HeroPackageSearch", () => {
  it("uses static landing destinations without restoring the package API", () => {
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");

    expect(componentSource).toContain("landingContent.destinations");
    expect(componentSource).not.toContain("/api/packages");
  });
});
