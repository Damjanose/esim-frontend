import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("support page content", () => {
  const source = readFileSync("src/app/support/SupportPageClient.tsx", "utf8");

  it("uses current eSim2you support flows and contact details", () => {
    expect(source).toContain("esim@uplisoft.com");
    expect(source).toContain("Email OTP sign-in");
    expect(source).toContain("Pokpay checkout");
    expect(source).toContain("QR or manual setup");
    expect(source).toContain("remaining data");
    expect(source).toContain("top-up");
    expect(source).toContain("delete your account");
  });

  it("does not publish stale or unsupported support claims", () => {
    expect(source).not.toContain("support@velocityesim.com");
    expect(source).not.toContain("View all articles");
    expect(source).not.toContain("confirmation email");
    expect(source).not.toContain("Where can I find my receipt?");
    expect(source).not.toContain("Update account information");
    expect(source).not.toContain("/support/topic-article");
  });
});
