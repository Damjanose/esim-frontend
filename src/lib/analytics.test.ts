import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE_NAME, serializeConsentCookie } from "@/lib/consent";
import {
  GA_ID,
  PENDING_TOPUP_PURCHASE_KEY,
  gaItem,
  gaTopupItem,
  takePendingTopupPurchase,
  trackGaEvent,
  writePendingTopupPurchase
} from "@/lib/analytics";

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

describe("gaTopupItem", () => {
  const esim = { country: "Turkey", region: "Europe" };

  it("names a top-up like the app: eSIM country + GB to one decimal + days", () => {
    expect(gaTopupItem({ id: "tr-topup-1gb", amount: 1024, day: 7 }, esim, 4.499)).toEqual({
      item_id: "tr-topup-1gb",
      item_name: "Turkey 1GB 7 days",
      item_category: "Europe",
      item_category2: "esim_topup",
      price: 4.5,
      quantity: 1
    });
    expect(gaTopupItem({ id: "x", amount: 512, day: 1 }, esim, 2).item_name).toBe("Turkey 0.5GB 1 day");
    expect(gaTopupItem({ id: "x", is_unlimited: true, day: 3 }, esim, 9).item_name).toBe("Turkey Unlimited 3 days");
    expect(gaTopupItem({ id: "x", title: "Data boost" }, {}, 2)).not.toHaveProperty("item_category");
  });
});

describe("pending top-up purchase", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubSessionStorage() {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key)
      }
    });
    return store;
  }

  const pending = {
    orderId: 42,
    paymentId: "pay_123",
    value: 4.5,
    currency: "EUR",
    item: gaTopupItem({ id: "x", amount: 1024, day: 7 }, { country: "Turkey" }, 4.5)
  };

  it("is returned once, for its own eSIM only", () => {
    const store = stubSessionStorage();
    writePendingTopupPurchase(pending);
    expect(takePendingTopupPurchase(7)).toBeNull();
    expect(store.has(PENDING_TOPUP_PURCHASE_KEY)).toBe(true);
    expect(takePendingTopupPurchase(42)).toEqual(pending);
    expect(takePendingTopupPurchase(42)).toBeNull();
  });

  it("ignores a malformed stash", () => {
    const store = stubSessionStorage();
    store.set(PENDING_TOPUP_PURCHASE_KEY, JSON.stringify({ ...pending, paymentId: "" }));
    expect(takePendingTopupPurchase(42)).toBeNull();
  });
});
