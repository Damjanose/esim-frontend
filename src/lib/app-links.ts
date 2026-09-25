/**
 * Verification files that let the eSim2you mobile app open
 * `https://esim.uplisoft.com/checkout?package={id}` links directly (iOS
 * universal links, Android App Links). Without the app installed, the same URL
 * falls through to the web checkout for that package.
 *
 * Served from `/.well-known/*` by route handlers so they come back as JSON with
 * no redirect, which both platforms require.
 */

const APPLE_TEAM_ID = "R72R8C56GK";
const APP_ID = "com.uplisoft.velocityesim";

/** Paths the app claims. Keep in sync with `parseShareUrl` in the mobile app. */
export const APP_LINK_PATHS = ["/checkout"] as const;

/**
 * SHA-256 fingerprints of the certificates Android builds are signed with:
 * the repo's release keystore. If the app ships through Google Play with
 * Play App Signing, the Play "App signing key" fingerprint must be added here
 * too — Play re-signs installs with it.
 */
const ANDROID_SHA256_CERT_FINGERPRINTS = [
  "88:0B:A6:63:F7:A1:E9:EE:BB:A2:E4:21:06:FC:95:E8:99:F1:64:06:7D:29:A7:E9:9C:D3:D7:A9:59:7C:93:B3"
];

export function appleAppSiteAssociation() {
  const appID = `${APPLE_TEAM_ID}.${APP_ID}`;
  return {
    applinks: {
      // `components` (iOS 13+) can require the `package` query; `paths` is the
      // pre-iOS-13 form, which ignores queries.
      details: [
        {
          appIDs: [appID],
          components: APP_LINK_PATHS.map((path) => ({ "/": path, "?": { package: "?*" } })),
          appID,
          paths: [...APP_LINK_PATHS]
        }
      ]
    }
  };
}

export function androidAssetLinks() {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: APP_ID,
        sha256_cert_fingerprints: ANDROID_SHA256_CERT_FINGERPRINTS
      }
    }
  ];
}

export function jsonFileResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

/** The app's custom scheme link for a package; opens the app when installed. */
export function appSchemeUrlForPackage(packageId: string) {
  return `velocity-esim://pkg/${encodeURIComponent(packageId)}`;
}

function packageFromCheckoutUrl(url: URL): string | null {
  if (!(APP_LINK_PATHS as readonly string[]).includes(url.pathname.replace(/\/+$/, ""))) return null;
  const id = url.searchParams.get("package")?.trim();
  return id && !id.includes("/") ? id : null;
}

/**
 * The shared package a visitor landed on, if any: either the web checkout
 * itself (`/checkout?package=…`), or sign-in on the way there
 * (`/signin?next=/checkout?package=…`, where the route guard sends signed-out
 * visitors). Used to offer "Open in the app" where universal / App Links don't
 * fire — in-app browsers, or a link pasted into the address bar.
 */
export function sharedPackageIdFromLocation(pathname: string, search: string): string | null {
  const base = "https://esim.uplisoft.com";
  let url: URL;
  try {
    url = new URL(`${pathname}${search}`, base);
  } catch {
    return null;
  }
  const direct = packageFromCheckoutUrl(url);
  if (direct) return direct;
  if (url.pathname.replace(/\/+$/, "") !== "/signin") return null;
  const next = url.searchParams.get("next");
  if (!next?.startsWith("/")) return null;
  try {
    return packageFromCheckoutUrl(new URL(next, base));
  } catch {
    return null;
  }
}
