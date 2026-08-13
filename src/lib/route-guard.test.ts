import { describe, expect, it } from "vitest";
import { guardedRedirect } from "./route-guard";

describe("guardedRedirect", () => {
  it("sends anonymous visitors from checkout to sign-in, preserving the plan", () => {
    expect(
      guardedRedirect("/checkout", "?package=hej-telecom-in-30days-20gb", false)
    ).toBe("/signin?next=%2Fcheckout%3Fpackage%3Dhej-telecom-in-30days-20gb");
  });

  it("sends anonymous visitors from the account area to sign-in", () => {
    expect(guardedRedirect("/account/42", "", false)).toBe("/signin?next=%2Faccount%2F42");
  });

  it("sends anonymous visitors from the profile to sign-in", () => {
    expect(guardedRedirect("/profile", "", false)).toBe("/signin?next=%2Fprofile");
  });

  it("lets signed-in visitors through", () => {
    expect(guardedRedirect("/checkout", "?package=abc", true)).toBeNull();
    expect(guardedRedirect("/account", "", true)).toBeNull();
    expect(guardedRedirect("/profile", "", true)).toBeNull();
  });

  it("leaves public pages alone", () => {
    expect(guardedRedirect("/destinations/japan", "", false)).toBeNull();
    expect(guardedRedirect("/", "", false)).toBeNull();
  });

  it("does not guard the payment return, which authenticates by its own cookie", () => {
    expect(guardedRedirect("/checkout/return", "?payment_id=abc", false)).toBeNull();
  });

  it("does not guard the top-up return, even though it sits under /account", () => {
    expect(guardedRedirect("/account/topup/return", "?payment_id=abc", false)).toBeNull();
  });

  it("lets a just-deleted account read its goodbye page", () => {
    // Deletion clears the session, so guarding this would bounce the visitor to
    // sign-in for an account that no longer exists.
    expect(guardedRedirect("/profile/deleted", "", false)).toBeNull();
  });

  it("does not trap signed-out visitors on the sign-in page itself", () => {
    expect(guardedRedirect("/signin", "?next=%2Faccount", false)).toBeNull();
  });
});
