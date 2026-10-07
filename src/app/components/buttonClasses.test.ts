import { describe, expect, it } from "vitest";
import { resolveButtonClasses } from "./buttonClasses";

describe("resolveButtonClasses", () => {
  it("defaults to a medium lit pill: blue lit from above with the lift", () => {
    const classes = resolveButtonClasses();
    expect(classes).toContain("h-[46px]");
    expect(classes).toContain("rounded-full");
    expect(classes).toContain("from-litTop");
    expect(classes).toContain("to-brandBlue");
    expect(classes).toContain("text-white");
    expect(classes).toContain("shadow-lit");
    expect(classes).toContain("active:translate-y-[2px]");
  });

  it("sizes sm/md/lg to the mobile control heights, all full pills", () => {
    for (const [size, height] of [["sm", "34"], ["md", "46"], ["lg", "54"]] as const) {
      const classes = resolveButtonClasses({ size });
      expect(classes).toContain(`h-[${height}px]`);
      expect(classes).toContain("rounded-full");
    }
  });

  it("drops the lift on sm so rows of small buttons stay quiet", () => {
    expect(resolveButtonClasses({ size: "sm" })).not.toContain("shadow-lit");
  });

  it("swaps the sink for an opacity dip under reduced motion", () => {
    const classes = resolveButtonClasses();
    expect(classes).toContain("motion-reduce:active:translate-y-0");
    expect(classes).toContain("motion-reduce:active:opacity-85");
  });

  it("paints lit/danger red and keeps it red on a dark surface", () => {
    expect(resolveButtonClasses({ tone: "danger" })).toContain("to-error");
    expect(resolveButtonClasses({ tone: "danger", surface: "dark" })).toContain("to-error");
  });

  it("turns lit into the white moon on a dark surface", () => {
    const classes = resolveButtonClasses({ surface: "dark" });
    expect(classes).toContain("from-white");
    expect(classes).toContain("text-brandBlue");
    expect(classes).toContain("shadow-moon");
  });

  it("resolves tint as a soft wash with no outline or lift", () => {
    const classes = resolveButtonClasses({ variant: "tint" });
    expect(classes).toContain("bg-brandBlue/[0.08]");
    expect(classes).toContain("text-brandBlue");
    expect(classes).not.toContain("border");
    expect(classes).not.toContain("shadow-lit");
    expect(resolveButtonClasses({ variant: "tint", tone: "danger" })).toContain("text-error");
    expect(resolveButtonClasses({ variant: "tint", surface: "dark" })).toContain("bg-white/10");
  });

  it("resolves ghost as text-only", () => {
    const classes = resolveButtonClasses({ variant: "ghost" });
    expect(classes).toContain("bg-transparent");
    expect(classes).toContain("text-brandBlue");
  });

  it("shows the orbit dot only on an enabled lit md/lg hero", () => {
    expect(resolveButtonClasses({ hero: true })).toContain("after:bg-orbitCore");
    expect(resolveButtonClasses({ hero: true, size: "lg" })).toContain("pr-[30px]");
    for (const args of [
      { hero: true, variant: "tint" as const },
      { hero: true, variant: "ghost" as const },
      { hero: true, size: "sm" as const },
      { hero: true, disabled: true }
    ]) {
      expect(resolveButtonClasses(args)).not.toContain("after:bg-orbitCore");
    }
  });

  it("goes flat grey and non-interactive when disabled, with no lift", () => {
    const classes = resolveButtonClasses({ disabled: true });
    expect(classes).toContain("bg-disabledFill");
    expect(classes).toContain("text-disabledLabel");
    expect(classes).toContain("pointer-events-none");
    expect(classes).not.toContain("shadow-lit");
    expect(resolveButtonClasses({ variant: "ghost", disabled: true })).toContain("bg-transparent");
  });
});
