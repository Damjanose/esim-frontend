import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE_NAME, serializeConsentCookie } from "@/lib/consent";
import { META_PIXEL_ID, isAdminPath, metaProductParams, trackMetaEvent } from "@/lib/meta-pixel";

function stubBrowser(marketing: boolean) {
  const win: { fbq?: { queue: ArrayLike<unknown>[]; disablePushState?: boolean } } = {};
  const appendChild = vi.fn();
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    cookie: `${CONSENT_COOKIE_NAME}=${serializeConsentCookie({ version: 1, analytics: false, marketing })}`,
    getElementById: () => null,
    createElement: () => ({}),
    head: { appendChild }
  });
  return { win, appendChild };
}

const queued = (win: { fbq?: { queue: ArrayLike<unknown>[] } }) => (win.fbq?.queue ?? []).map((args) => Array.from(args));

describe("trackMetaEvent", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads nothing and sends nothing without marketing consent", () => {
    const { win, appendChild } = stubBrowser(false);
    trackMetaEvent("ViewContent", { value: 1 });
    expect(win.fbq).toBeUndefined();
    expect(appendChild).not.toHaveBeenCalled();
  });

  it("initializes once, loads one script and queues `arguments` objects", () => {
    const { win, appendChild } = stubBrowser(true);
    trackMetaEvent("PageView");
    trackMetaEvent("ViewContent", { value: 1 });
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(win.fbq?.disablePushState).toBe(true);
    expect(queued(win)).toEqual([
      ["init", META_PIXEL_ID],
      ["track", "PageView"],
      ["track", "ViewContent", { value: 1 }]
    ]);
  });

  it("passes the event id for Conversions API dedupe", () => {
    const { win } = stubBrowser(true);
    trackMetaEvent("Purchase", metaProductParams(["p1"], 9.99, "EUR"), "ORDER1");
    expect(queued(win)[1]).toEqual([
      "track",
      "Purchase",
      { content_ids: ["p1"], content_type: "product", value: 9.99, currency: "EUR" },
      { eventID: "ORDER1" }
    ]);
  });
});

describe("isAdminPath", () => {
  it("matches obfuscated admin routes only", () => {
    expect(isAdminPath("/xloginy")).toBe(true);
    expect(isAdminPath("/xsupport/12")).toBe(true);
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/esim/spain")).toBe(false);
    expect(isAdminPath("/account/1")).toBe(false);
  });
});
