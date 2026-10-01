import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/signin/page.tsx", "utf8");
const form = readFileSync("src/app/signin/SignInForm.tsx", "utf8");
const linkStep = readFileSync("src/app/signin/LinkEmailStep.tsx", "utf8");
const buttons = readFileSync("src/app/signin/SocialSignInButtons.tsx", "utf8");
const classes = readFileSync("src/app/signin/signInClasses.ts", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("sign-in card (spec section 5)", () => {
  it("sits on a token background, with no hard-coded colours", () => {
    expect(page).toContain("bg-surfaceBright");
    expect(page).toContain("from-brandBlue/10");
    expect(page).not.toContain("rgba(");
    expect(page).not.toContain("hero-grid");
    for (const source of [page, form, linkStep, classes]) {
      expect(source).not.toMatch(HEX);
      expect(source).not.toContain("bg-mist");
    }
  });

  it("keeps the field order: email, Send code, then Google/Apple, then the terms", () => {
    const email = form.indexOf('autoComplete="email"');
    const sendCode = form.indexOf("Send code");
    const social = form.indexOf("<SocialSignInButtons");
    const terms = form.indexOf("By continuing you agree to our");
    expect(email).toBeGreaterThan(-1);
    expect(email).toBeLessThan(sendCode);
    expect(sendCode).toBeLessThan(social);
    expect(social).toBeLessThan(terms);
  });

  it("uses the shared 48px fields with a focus ring, and 44px text actions", () => {
    expect(form).toContain("className={FIELD_INPUT_CLASSES}");
    expect(form).toContain("className={CODE_INPUT_CLASSES}");
    expect(linkStep).toContain("className={FIELD_INPUT_CLASSES}");
    expect(linkStep).toContain("className={CODE_INPUT_CLASSES}");
    expect(classes).toContain("min-h-11");
    expect(form).toContain("className={SIGN_IN_CARD_CLASSES}");
  });

  it("keeps one gradient primary per step (Send code, Verify and continue)", () => {
    // Button defaults to the gradient primary; sign-in never passes a variant.
    expect(form.match(/<Button\b/g)).toHaveLength(2);
    expect(linkStep.match(/<Button\b/g)).toHaveLength(2);
  });

  it("still measures the row to size Google's fixed-width button (ResizeObserver trap)", () => {
    expect(buttons).toContain("const GOOGLE_MAX_WIDTH = 400;");
    expect(buttons).toContain("new ResizeObserver(");
    expect(buttons).toContain("Math.min(width, GOOGLE_MAX_WIDTH)");
    expect(buttons).toContain("width: googleWidth,");
    expect(buttons).toContain('<div className="mt-5 flex flex-col items-center gap-3" ref={rowRef}>');
    expect(buttons).toContain('<div className="flex h-10 w-full justify-center [&>div>*]:[grid-area:1/1] [&>div]:grid" ref={googleButtonRef} />');
    // Apple matches Google's 40px pill; an invisible ::after takes its hit area to 44px,
    // the same as Google's own 44px iframe.
    expect(buttons).toContain("h-10 w-full");
    expect(buttons).toContain("after:-inset-y-0.5");
  });
});
