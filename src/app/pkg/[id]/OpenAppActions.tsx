"use client";

import { useEffect, useState } from "react";
import {
  androidIntentUrlForPackage,
  appSchemeUrlForPackage,
  detectMobilePlatform,
  type MobilePlatform,
} from "@/lib/app-links";
import { resolveButtonClasses } from "@/app/components/buttonClasses";
import { WEB_PURCHASES_DISABLED_MESSAGE } from "@/lib/web-purchases";

/** How long to wait for the app to take over before sending iOS to the App Store. */
const IOS_STORE_FALLBACK_MS = 1500;

// Shared lit-pill paint; these stay raw <a>/<button> because Android needs a real intent:// link.
const openAppClass = `${resolveButtonClasses({ size: "lg", hero: true })} w-full`;

export function OpenAppActions({
  packageId,
  appStoreUrl,
  playStoreUrl,
}: {
  packageId: string;
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
      if (document.visibilityState === "visible")
        window.location.href = appStoreUrl;
    }, IOS_STORE_FALLBACK_MS);
    const cancel = () => {
      if (document.visibilityState === "hidden") window.clearTimeout(timer);
    };
    document.addEventListener("visibilitychange", cancel, { once: true });
    window.location.href = appSchemeUrlForPackage(packageId);
  };

  const storeLink = (href: string, label: string) => (
    <a
      key={label}
      href={href}
      className="font-semibold text-brandBlue underline-offset-2 hover:underline"
    >
      {label}
    </a>
  );

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p
        role="status"
        className="rounded-[14px] bg-brandBlue/10 px-4 py-3 text-sm font-semibold text-brandBlue"
      >
        {WEB_PURCHASES_DISABLED_MESSAGE}
      </p>
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
      {platform === "other" ? (
        // Desktop: no app to open here, so the store buttons are the next step.
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={appStoreUrl} className={openAppClass}>
            App Store
          </a>
          <a href={playStoreUrl} className={openAppClass}>
            Google Play
          </a>
        </div>
      ) : null}
      {platform !== "other" ? (
        <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-onSurfaceVariant">
          {platform === "ios" ? (
            <>
              <span>Don&apos;t have the app?</span>
              {storeLink(appStoreUrl, "App Store")}
            </>
          ) : null}
          {platform === "android" ? (
            <>
              <span>Don&apos;t have the app?</span>
              {storeLink(playStoreUrl, "Google Play")}
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
