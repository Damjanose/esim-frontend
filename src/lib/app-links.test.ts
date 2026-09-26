import { describe, expect, it } from "vitest";
import {
  androidAssetLinks,
  androidIntentUrlForPackage,
  appSchemeUrlForPackage,
  appleAppSiteAssociation,
  jsonFileResponse,
  sharedPackageIdFromLocation
} from "./app-links";

describe("app links verification files", () => {
  it("claims /pkg/* and /checkout?package= for the iOS app", () => {
    const [detail] = appleAppSiteAssociation().applinks.details;
    expect(detail.appIDs).toEqual(["R72R8C56GK.com.uplisoft.velocityesim"]);
    expect(detail.components).toEqual([
      { "/": "/pkg/*" },
      { "/": "/checkout", "?": { package: "?*" } }
    ]);
    expect(detail.paths).toEqual(["/pkg/*", "/checkout"]);
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
});
