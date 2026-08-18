import { describe, expect, it } from "vitest";
import { resolveButtonClasses } from "./buttonClasses";

describe("resolveButtonClasses", () => {
  it("defaults to a medium primary button with the brand gradient", () => {
    const classes = resolveButtonClasses();
    expect(classes).toContain("h-[46px]");
    expect(classes).toContain("rounded-[12px]");
    expect(classes).toContain("from-brandBlue");
    expect(classes).toContain("to-brandTeal");
    expect(classes).toContain("text-white");
  });

  it("sizes sm/md/lg to the mobile control heights", () => {
    expect(resolveButtonClasses({ size: "sm" })).toContain("h-[34px]");
    expect(resolveButtonClasses({ size: "md" })).toContain("h-[46px]");
    expect(resolveButtonClasses({ size: "lg" })).toContain("h-[54px]");
  });

  it("sm uses the 8px radius, md/lg use 12px", () => {
    expect(resolveButtonClasses({ size: "sm" })).toContain("rounded-[8px]");
    expect(resolveButtonClasses({ size: "md" })).toContain("rounded-[12px]");
    expect(resolveButtonClasses({ size: "lg" })).toContain("rounded-[12px]");
  });

  it("resolves flat/brand as a bordered white button with brand-blue text, no gradient", () => {
    const classes = resolveButtonClasses({ variant: "flat", tone: "brand" });
    expect(classes).toContain("text-brandBlue");
    expect(classes).toContain("bg-white");
    expect(classes).not.toContain("from-brandBlue");
  });

  it("resolves flat/danger with the error color and a bordered white background, never a solid fill", () => {
    const classes = resolveButtonClasses({ variant: "flat", tone: "danger" });
    expect(classes).toContain("text-error");
    expect(classes).toContain("bg-white");
    expect(classes).not.toContain("bg-error");
  });

  it("marks disabled buttons at 40% opacity and non-interactive", () => {
    const classes = resolveButtonClasses({ disabled: true });
    expect(classes).toContain("disabled:opacity-40");
    expect(classes).toContain("pointer-events-none");
  });
});
