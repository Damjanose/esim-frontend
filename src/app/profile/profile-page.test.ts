import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const profilePage = readFileSync("src/app/profile/page.tsx", "utf8");
const profileTabs = readFileSync("src/app/profile/ProfileTabs.tsx", "utf8");
const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
const accountPage = readFileSync("src/app/account/page.tsx", "utf8");

describe("profile page", () => {
  it("renders inside the shared public shell", () => {
    expect(profilePage).toContain("<Navbar />");
    expect(profilePage).toContain("<SiteFooter />");
  });

  it("keeps the signed-in identity server-side and display-only", () => {
    expect(profilePage).toContain("readEmailFromAccessToken");
    expect(profilePage).toContain("ACCESS_COOKIE");
    // The email must never round-trip through the client as a trusted value.
    expect(profilePage).not.toContain("localStorage");
  });

  it("offers sign out and a route to the eSIM list", () => {
    expect(profileTabs).toContain("<SignOutButton />");
    expect(profileTabs).toContain('href="/account"');
  });

  it("links the legal pages the mobile profile also exposes", () => {
    expect(profileTabs).toContain('href="/terms"');
    expect(profileTabs).toContain('href="/policy"');
  });

  it("is excluded from search indexing", () => {
    expect(profilePage).toContain("indexable: false");
  });

  it("is reachable from the navbar on every page", () => {
    expect(navbar).toContain('href="/profile"');
  });

  it("is reachable from the eSIM list", () => {
    expect(accountPage).toContain('href="/profile"');
  });

  it("links payments and billing", () => {
    expect(profileTabs).toContain('href="/profile/billing"');
  });

  it("offers account deletion", () => {
    expect(profileTabs).toContain("<DeleteAccountCard />");
  });

  it("lists the linked sign-in providers", () => {
    expect(profilePage).toContain('"/auth/identities"');
    expect(profileTabs).toContain("<LinkedProviders");
  });

  it("keeps the rest of the profile when the identity lookup fails", () => {
    expect(profilePage).toContain("identitiesResult.ok ? identitiesResult.data.identities : []");
  });
});

describe("linked providers", () => {
  const linked = readFileSync("src/app/profile/LinkedProviders.tsx", "utf8");

  it("explains an email-only account rather than showing an empty list", () => {
    expect(linked).toContain("No sign-in providers linked");
  });

  it("never shows a private relay address as if it were the user's inbox", () => {
    expect(linked).toContain("isPrivateRelay");
    expect(linked).toContain("Hidden email");
  });

  it("surfaces the backend's refusal to unlink the only sign-in method", () => {
    expect(linked).toContain("payload.error");
  });
});

describe("account deletion", () => {
  const deleteCard = readFileSync("src/app/profile/DeleteAccountCard.tsx", "utf8");
  const goodbyePage = readFileSync("src/app/profile/deleted/page.tsx", "utf8");

  it("confirms before deleting, since the action cannot be undone", () => {
    expect(deleteCard).toContain("confirming");
    expect(deleteCard).toContain("Yes, delete my account");
  });

  it("is honest that service records may be retained", () => {
    expect(deleteCard).toContain("retained where required");
  });

  it("sends the visitor to the goodbye page on success", () => {
    expect(deleteCard).toContain('window.location.assign("/profile/deleted")');
  });

  it("does not sign the visitor out when the deletion failed", () => {
    // The cookies are cleared by the route handler, and only on success.
    expect(deleteCard).not.toContain("document.cookie");
  });

  it("has a goodbye page that works with no session", () => {
    expect(goodbyePage).toContain("Goodbye for now");
    expect(goodbyePage).not.toContain("fetchForPage");
  });
});

describe("billing settings", () => {
  const billingPage = readFileSync("src/app/profile/billing/page.tsx", "utf8");
  const billingForm = readFileSync("src/app/profile/billing/BillingForm.tsx", "utf8");

  it("loads the stored address and the saved card together", () => {
    expect(billingPage).toContain('"/user/billing-address"');
    expect(billingPage).toContain('"/user/card-details"');
  });

  it("explains that cards live with the payment provider", () => {
    // PUT /user/card-details is 410 Gone; there is deliberately no card form.
    expect(billingPage).toContain("Cards are entered at checkout");
    expect(billingForm).not.toContain("card-details");
  });

  it("leaves address validation to the backend that owns the rules", () => {
    expect(billingForm).toContain("payload.error");
  });
});
