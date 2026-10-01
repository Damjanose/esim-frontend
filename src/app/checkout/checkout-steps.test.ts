import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIELD_CONTROL_CLASSES, FIELD_INPUT_CLASSES, FIELD_TEXT_CLASSES } from "../components/fieldClasses";

const cardStep = readFileSync("src/app/checkout/steps/CardStep.tsx", "utf8");
const billingStep = readFileSync("src/app/checkout/steps/BillingStep.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("shared field classes", () => {
  it("are 48px controls with a visible focus ring and 16px text on phones", () => {
    expect(FIELD_CONTROL_CLASSES).toContain("h-12");
    expect(FIELD_CONTROL_CLASSES).toContain("focus:ring-4");
    expect(FIELD_CONTROL_CLASSES).toContain("focus:border-brandBlue");
    // Below 16px, iOS Safari zooms the page into a focused field.
    expect(FIELD_TEXT_CLASSES).toContain("text-base");
    expect(FIELD_INPUT_CLASSES).toContain(FIELD_CONTROL_CLASSES);
    expect(FIELD_CONTROL_CLASSES).not.toMatch(HEX);
  });
});

describe("checkout card step", () => {
  it("keeps one real Pay button, sticky at the bottom below lg and in the flow at lg+", () => {
    // No second, decorative Pay button anywhere: the sticky bar wraps the real one.
    expect(cardStep.match(/<Button\b/g)).toHaveLength(1);
    expect(cardStep).toContain('{submitting ? "Processing…" : "Pay"}');
    expect(cardStep).toContain("sticky bottom-0");
    expect(cardStep).toContain("pb-[max(12px,env(safe-area-inset-bottom))]");
    expect(cardStep).toContain("lg:static");
    // Same Pokpay tokenization as before.
    expect(cardStep).toContain("processPayment(card.cardNumber.replace(/\\D/g, \"\"), card.expiration, card.securityCode");
  });

  it("uses the shared fields and no hex colours", () => {
    // Focused card fields scroll clear of the sticky Pay bar.
    expect(cardStep).toContain("const CARD_INPUT_CLASSNAME = `${FIELD_INPUT_CLASSES} scroll-mb-32`;");
    expect(cardStep.match(/className=\{CARD_INPUT_CLASSNAME\}/g)).toHaveLength(3);
    expect(cardStep).not.toMatch(HEX);
  });
});

describe("checkout billing step", () => {
  it("saves with a flat button, so Pay stays the one gradient primary", () => {
    expect(billingStep).toContain('variant="flat"');
    expect(billingStep).toContain("className={FIELD_INPUT_CLASSES}");
    expect(billingStep).toContain("min-h-11");
    // Tells the wizard when it has its real height, so step 02 never jumps (CLS).
    expect(billingStep).toContain("onLoaded?.();");
    expect(billingStep).not.toContain("bg-mist");
    expect(billingStep).not.toMatch(HEX);
  });
});
