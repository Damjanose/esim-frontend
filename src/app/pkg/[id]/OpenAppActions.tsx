"use client";

import { useEffect, useState } from "react";
import {
  androidIntentUrlForPackage,
  appSchemeUrlForPackage,
  detectMobilePlatform,
  type MobilePlatform
} from "@/lib/app-links";
import { resolveButtonClasses } from "@/app/components/buttonClasses";

/** How long to wait for the app to take over before sending iOS to the App Store. */
const IOS_STORE_FALLBACK_MS = 1500;

// Shared lit-pill paint; these stay raw <a>/<button> because Android needs a real intent:// link.
const openAppClass = `${resolveButtonClasses({ size: "lg", hero: true })} w-full`;
const secondaryClass = `${resolveButtonClasses({ variant: "tint", size: "lg" })} w-full`;

export function OpenAppActions({
  packageId,
  webCheckoutUrl,
  appStoreUrl,
  playStoreUrl
}: {
  packageId: string;
  /** Web checkout for this plan, or null when the plan isn't in the web catalog. */
  webCheckoutUrl: string | null;
  appStoreUrl: string;
  playStoreUrl: string;
}) {
  const [platform, setPlatform] = useState<MobilePlatform>("other");

  useEffect(() => {
    setPlatform(detectMobilePlatform(navigator));
  }, []);

  const openAppIos = () => {
    // Try the app; if the page is still in front after a moment, the app
    // isn't installed, so go to the App Store.
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") window.location.href = appStoreUrl;
    }, IOS_STORE_FALLBACK_MS);
    const cancel = () => {
      if (document.visibilityState === "hidden") window.clearTimeout(timer);
    };
    document.addEventListener("visibilitychange", cancel, { once: true });
    window.location.href = appSchemeUrlForPackage(packageId);
  };

  const storeLink = (href: string, label: string) => (
    <a key={label} href={href} className="font-semibold text-brandBlue underline-offset-2 hover:underline">
      {label}
    </a>
  );

  return (
    <div className="mt-6 flex flex-col gap-3">
      {platform === "android" ? (
        // A real link, not script: Chrome blocks script-initiated intent:// navigation.
        // It opens the app if installed, otherwise the Play Store listing.
        <a
          href={androidIntentUrlForPackage(packageId, playStoreUrl)}
          className={openAppClass}
        >
          Open in the app
        </a>
      ) : null}
      {platform === "ios" ? (
        <button type="button" onClick={openAppIos} className={openAppClass}>
          Open in the app
        </button>
      ) : null}
      {webCheckoutUrl ? (
        <a href={webCheckoutUrl} className={platform === "other" ? openAppClass : secondaryClass}>
          Buy on the web
        </a>
      ) : null}
      <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-onSurfaceVariant">
        <span>Get the app:</span>
        {platform !== "android" ? storeLink(appStoreUrl, "App Store") : null}
        {platform !== "ios" ? storeLink(playStoreUrl, "Google Play") : null}
      </p>
    </div>
  );
}
