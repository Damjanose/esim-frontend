import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE_NAME, serializeConsentCookie } from "@/lib/consent";
import { GA_ID, gaItem, trackGaEvent } from "@/lib/analytics";

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

describe("gaItem", () => {
  const plan = {
    id: "turkey-5gb-7days",
    country: "Turkey",
    region: "Europe",
    dataLabel: "5 GB",
    durationLabel: "7 Days",
    priceNumeric: 6.499
  };

  it("matches the app's item shape: country + data + duration, region, product kind", () => {
    expect(gaItem(plan)).toEqual({
      item_id: "turkey-5gb-7days",
      item_name: "Turkey 5GB 7 Days",
      item_category: "Europe",
      item_category2: "esim_package",
      price: 6.5,
      quantity: 1
    });
  });

  it("names unlimited and non-GB plans like the app", () => {
    expect(gaItem({ ...plan, dataLabel: "Unlimited" }).item_name).toBe("Turkey Unlimited 7 Days");
    expect(gaItem({ ...plan, dataLabel: "500 MB" }).item_name).toBe("Turkey 500 MB 7 Days");
    expect(gaItem({ ...plan, dataLabel: "1.5 GB", durationLabel: "30 Days Duration" }).item_name).toBe("Turkey 1.5GB 30 Days");
  });

  it("omits item_category without a region and prices at the charged amount", () => {
    const item = gaItem({ ...plan, region: undefined }, 4);
    expect(item).not.toHaveProperty("item_category");
    expect(item.price).toBe(4);
  });
});
