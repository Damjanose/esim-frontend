import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ring = readFileSync("src/app/components/UsageRing.tsx", "utf8");
const blueCard = readFileSync("src/app/components/ActiveEsimCard.tsx", "utf8");
const badge = readFileSync("src/app/components/StatusBadge.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("UsageRing / UsageRingCard (lg+)", () => {
  it("draws the share of data left as a teal ring, in token classes only", () => {
    expect(ring).toContain('className="stroke-brandTeal"');
    expect(ring).toContain('className="stroke-mist"');
    expect(ring).toContain("pathLength={100}");
    expect(ring).toContain("strokeDasharray={`${meter.leftPercent} 100`}");
    expect(ring).toContain('aria-label={meter.label}');
    expect(ring).toContain("data-usage-ring");
    expect(ring).not.toMatch(HEX);
  });

  it("makes Top up the gradient only when the page says so; Details stays flat", () => {
    expect(ring).toContain('variant={primaryTopUp ? "primary" : "flat"}');
    expect(ring.match(/variant="flat"/g)).toHaveLength(1);
  });
});

describe("ActiveEsimCard (phones/tablets)", () => {
  it("is the app's blue card: data left in large type, a bar, Top up / Details", () => {
    expect(blueCard).toContain("bg-brandBlue");
    expect(blueCard).toContain("data-active-esim-card");
    expect(blueCard).toContain("text-[30px]");
    expect(blueCard).toContain("width: `${meter.leftPercent ?? 0}%`");
    expect(blueCard).toContain(">\n              Top up");
    expect(blueCard).toContain(">\n              Details");
  });

  it("never puts a gradient on the blue card, and uses tokens only", () => {
    expect(blueCard).not.toContain('variant="primary"');
    expect(blueCard).toContain('variant="flat"');
    expect(blueCard).not.toMatch(HEX);
  });
});

describe("StatusBadge", () => {
  it("only knows the three lifecycle states", () => {
    expect(badge).toContain("active:");
    expect(badge).toContain("ready:");
    expect(badge).toContain("expired:");
    expect(badge).not.toContain("Connected");
  });
});
