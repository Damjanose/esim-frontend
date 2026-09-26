"use client";

import { useEffect, useState } from "react";
import { androidIntentUrlForPackage, appSchemeUrlForPackage } from "@/lib/app-links";

type Platform = "ios" | "android" | "other";

/** How long to wait for the app to take over before sending iOS to the App Store. */
const IOS_STORE_FALLBACK_MS = 1500;

const openAppClass = "block rounded-full bg-brandBlue px-5 py-3 text-sm font-bold text-white";

export function OpenAppActions({
  packageId,
  appStoreUrl,
  playStoreUrl
}: {
  packageId: string;
  appStoreUrl: string;
  playStoreUrl: string;
}) {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/i.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : "other");
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

  const storeButton = (href: string, label: string) => (
    <a
      key={label}
      href={href}
      className="block rounded-full border border-brandBlue px-5 py-3 text-sm font-bold text-brandBlue"
    >
      {label}
    </a>
  );

  return (
    <div className="mt-7 flex flex-col gap-3">
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
      {platform !== "android" ? storeButton(appStoreUrl, "Download on the App Store") : null}
      {platform !== "ios" ? storeButton(playStoreUrl, "Get it on Google Play") : null}
    </div>
  );
}
