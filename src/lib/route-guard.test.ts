import { describe, expect, it } from "vitest";
import { guardedRedirect } from "./route-guard";

describe("guardedRedirect", () => {
  it("allows anonymous visitors to view the checkout/plan details", () => {
    expect(
      guardedRedirect("/checkout", "?package=hej-telecom-in-30days-20gb", false)
    ).toBeNull();
  });

  it("sends anonymous visitors from the account area to sign-in", () => {
    expect(guardedRedirect("/account/42", "", false)).toBe("/signin?next=%2Faccount%2F42");
  });

  it("sends anonymous visitors from the profile to sign-in", () => {
    expect(guardedRedirect("/profile", "", false)).toBe("/signin?next=%2Fprofile");
  });

  it("lets signed-in visitors through guarded routes", () => {
    expect(guardedRedirect("/account", "", true)).toBeNull();
    expect(guardedRedirect("/profile", "", true)).toBeNull();
  });

  it("leaves public pages alone", () => {
    expect(guardedRedirect("/destinations/japan", "", false)).toBeNull();
    expect(guardedRedirect("/", "", false)).toBeNull();
  });

  it("does not guard the top-up return, even though it sits under /account", () => {
    expect(guardedRedirect("/account/topup/return", "?payment_id=abc", false)).toBeNull();
  });

  it("does not guard the plan checkout return, even though it sits under /checkout", () => {
    // Session may lapse while the buyer is on Pokpay; the return handler still
    // needs to run so it can send them to /checkout/failed rather than sign-in.
    expect(guardedRedirect("/checkout/return", "?payment_id=abc", false)).toBeNull();
  });

  it("lets a just-deleted account read its goodbye page", () => {
    // Deletion clears the session, so guarding this would bounce the visitor to
    // sign-in for an account that no longer exists.
    expect(guardedRedirect("/profile/deleted", "", false)).toBeNull();
  });

  it("does not trap signed-out visitors on the sign-in page itself", () => {
    expect(guardedRedirect("/signin", "?next=%2Faccount", false)).toBeNull();
  });

  it("sends anonymous visitors from the partner request form to sign-in", () => {
    expect(guardedRedirect("/partners/request", "", false)).toBe(
      "/signin?next=%2Fpartners%2Frequest"
    );
  });
});
