import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE_NAME, serializeConsentCookie } from "@/lib/consent";
import { GA_ID, trackGaEvent } from "@/lib/analytics";

function stubBrowser(consent: { analytics: boolean; marketing: boolean }) {
  const gtag = vi.fn();
  vi.stubGlobal("window", { gtag });
  vi.stubGlobal("document", {
    cookie: `${CONSENT_COOKIE_NAME}=${serializeConsentCookie({ version: 1, ...consent })}`
  });
  return gtag;
}

describe("trackGaEvent", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends to the GA4 property with analytics consent", () => {
    const gtag = stubBrowser({ analytics: true, marketing: false });
    trackGaEvent("login", { method: "email" });
    expect(gtag).toHaveBeenCalledWith("event", "login", { send_to: GA_ID, method: "email" });
  });

  it("sends nothing with marketing consent alone, though gtag exists for Ads", () => {
    const gtag = stubBrowser({ analytics: false, marketing: true });
    trackGaEvent("login", { method: "email" });
    expect(gtag).not.toHaveBeenCalled();
  });
});
