import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("/pkg/[id] shared-plan landing", () => {
  it("shows the plan as a PlanRow and keeps its own open-in-app / buy actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/pkg/[id]/page.tsx"), "utf8");

    expect(source).toContain('import { PlanRow } from "../../components/PlanRow";');
    // Not part of a list: no Best value tag, and no Buy now (OpenAppActions owns the CTAs).
    // The page heading already shows plan.title, so the row doesn't repeat it.
    expect(source).toContain(
      "<PlanRow plan={plan} showTitle={false} tags={planRowTags(plan, { position: null })} />"
    );
    expect(source).not.toContain("buyHref=");
    expect(source).toContain("Covers {coverage.length} countries:");
    // Buy flow and app links unchanged.
    expect(source).toContain("webCheckoutUrl={plan ? `/checkout?package=${encodeURIComponent(plan.id)}` : null}");
    expect(source).toContain("<OpenAppActions");
    expect(source).toContain("indexable: false");
    expect(source).not.toContain("bg-white");
  });
});
