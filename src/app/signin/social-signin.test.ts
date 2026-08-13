import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const buttons = readFileSync("src/app/signin/SocialSignInButtons.tsx", "utf8");
const linkStep = readFileSync("src/app/signin/LinkEmailStep.tsx", "utf8");
const signInForm = readFileSync("src/app/signin/SignInForm.tsx", "utf8");

describe("social sign-in buttons", () => {
  it("renders nothing when neither provider is configured", () => {
    // Without client ids the backend answers 503, so a button would only fail.
    expect(buttons).toContain("if (!GOOGLE_CLIENT_ID && !APPLE_SERVICES_ID)");
    expect(buttons).toContain("return null");
  });

  it("gates each provider on its own client id", () => {
    expect(buttons).toContain("{GOOGLE_CLIENT_ID ?");
    expect(buttons).toContain("{APPLE_SERVICES_ID ?");
  });

  it("uses the Apple Services ID, which is what the web flow's aud claim carries", () => {
    expect(buttons).toContain("NEXT_PUBLIC_APPLE_SERVICES_ID");
    expect(buttons).toContain("clientId: APPLE_SERVICES_ID");
  });

  it("binds the Google credential to this page load with a nonce", () => {
    expect(buttons).toContain("crypto.randomUUID()");
    expect(buttons).toContain("nonce,");
  });

  it("hands the link-required challenge up instead of signing in", () => {
    expect(buttons).toContain("onLinkRequired");
    expect(buttons).toContain("payload.data?.linkRequired");
  });
});

describe("email claim after social sign-in", () => {
  it("keeps the link ticket out of the URL", () => {
    expect(linkStep).toContain("challenge.linkTicket");
    expect(linkStep).not.toContain("searchParams");
    expect(linkStep).not.toContain("sessionStorage");
  });

  it("prefills the suggested email, which is never a private relay address", () => {
    expect(linkStep).toContain("challenge.suggestedEmail ?? \"\"");
  });

  it("verifies the code before the session exists", () => {
    expect(linkStep).toContain("/api/auth/link/otp/verify");
  });

  it("replaces the email form while a claim is in progress", () => {
    expect(signInForm).toContain("if (linkChallenge)");
    expect(signInForm).toContain("<LinkEmailStep");
  });
});
