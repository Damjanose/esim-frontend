import { describe, expect, it } from "vitest";
import {
  androidAssetLinks,
  androidIntentUrlForEsim,
  androidIntentUrlForPackage,
  appSchemeUrlForEsim,
  appSchemeUrlForPackage,
  appleAppSiteAssociation,
  detectMobilePlatform,
  jsonFileResponse,
  sharedPackageIdFromLocation
} from "./app-links";

describe("app links verification files", () => {
  it("claims /pkg/*, /esim/id/* and /checkout?package= for the iOS app", () => {
    const [detail] = appleAppSiteAssociation().applinks.details;
    expect(detail.appIDs).toEqual(["R72R8C56GK.com.uplisoft.velocityesim"]);
    expect(detail.components).toEqual([
      { "/": "/pkg/*" },
      { "/": "/esim/id/*" },
      { "/": "/checkout", "?": { package: "?*" } }
    ]);
    expect(detail.paths).toEqual(["/pkg/*", "/esim/id/*", "/checkout"]);
  });

  it("builds an Android intent that falls back to the store", () => {
    expect(androidIntentUrlForPackage("a b", "https://play.example/x?id=1")).toBe(
      "intent://pkg/a%20b#Intent;scheme=velocity-esim;package=com.uplisoft.velocityesim;" +
        "S.browser_fallback_url=https%3A%2F%2Fplay.example%2Fx%3Fid%3D1;end"
    );
  });

  it("lists the Android package with SHA-256 fingerprints", () => {
    const [statement] = androidAssetLinks();
    expect(statement.target.package_name).toBe("com.uplisoft.velocityesim");
    for (const fp of statement.target.sha256_cert_fingerprints) {
      expect(fp).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });

  it("trusts both the upload key and the Play App Signing key", () => {
    // Play Store installs are re-signed by Google; without its key, links open in the browser.
    const [statement] = androidAssetLinks();
    expect(statement.target.sha256_cert_fingerprints).toEqual(
      expect.arrayContaining([
        "88:0B:A6:63:F7:A1:E9:EE:BB:A2:E4:21:06:FC:95:E8:99:F1:64:06:7D:29:A7:E9:9C:D3:D7:A9:59:7C:93:B3",
        "A3:98:03:1A:6D:9A:7D:04:30:D8:3D:AC:3C:53:5D:51:8A:57:A5:46:09:3D:C4:03:BF:20:31:9D:CF:CE:21:2E"
      ])
    );
  });

  it("serves JSON", async () => {
    const res = jsonFileResponse({ ok: true });
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("finds the shared package on checkout and on sign-in on the way there", () => {
    expect(sharedPackageIdFromLocation("/checkout", "?package=szia-in-7days-1gb")).toBe("szia-in-7days-1gb");
    expect(
      sharedPackageIdFromLocation("/signin", `?next=${encodeURIComponent("/checkout?package=abc")}`)
    ).toBe("abc");
    expect(sharedPackageIdFromLocation("/checkout", "")).toBeNull();
    expect(sharedPackageIdFromLocation("/signin", "?next=/account")).toBeNull();
    expect(sharedPackageIdFromLocation("/signin", "?next=https://evil.example/checkout?package=x")).toBeNull();
    expect(sharedPackageIdFromLocation("/esim/hungary", "?package=abc")).toBeNull();
  });

  it("builds the app scheme link", () => {
    expect(appSchemeUrlForPackage("a b")).toBe("velocity-esim://pkg/a%20b");
  });

  it("builds the eSIM app scheme link and Android intent", () => {
    expect(appSchemeUrlForEsim("tok en")).toBe("velocity-esim://esim/tok%20en");
    expect(androidIntentUrlForEsim("tok", "https://play.example/x?id=1")).toBe(
      "intent://esim/tok#Intent;scheme=velocity-esim;package=com.uplisoft.velocityesim;" +
        "S.browser_fallback_url=https%3A%2F%2Fplay.example%2Fx%3Fid%3D1;end"
    );
  });

  it("detects the phone platform, including in desktop-site mode", () => {
    const androidUa =
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
    const linuxDesktopUa = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
    const macUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
    const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

    expect(detectMobilePlatform({ userAgent: androidUa, maxTouchPoints: 5 })).toBe("android");
    expect(detectMobilePlatform({ userAgent: iphoneUa, maxTouchPoints: 5 })).toBe("ios");
    // "Desktop site" on Android (Samsung Internet / Chrome) and iPadOS Safari.
    expect(detectMobilePlatform({ userAgent: linuxDesktopUa, maxTouchPoints: 5 })).toBe("android");
    expect(
      detectMobilePlatform({ userAgent: linuxDesktopUa, userAgentData: { platform: "Android" } })
    ).toBe("android");
    expect(detectMobilePlatform({ userAgent: macUa, maxTouchPoints: 5 })).toBe("ios");
    // Real desktops.
    expect(detectMobilePlatform({ userAgent: macUa, maxTouchPoints: 0 })).toBe("other");
    expect(detectMobilePlatform({ userAgent: linuxDesktopUa, maxTouchPoints: 0 })).toBe("other");
    expect(
      detectMobilePlatform({ userAgent: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/129.0", maxTouchPoints: 10 })
    ).toBe("other");
  });
});
