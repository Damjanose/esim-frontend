"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appSchemeUrlForPackage, sharedPackageIdFromLocation } from "@/lib/app-links";

/**
 * "Open in the eSim2you app" for a shared package link that ended up on the web.
 *
 * With the app installed, universal / App Links normally open the app before the
 * browser ever loads — this banner covers the cases where they don't (Instagram
 * or Facebook in-app browsers, a link pasted into the address bar). Phones only;
 * the custom scheme does nothing useful on desktop.
 */
export function OpenInAppBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPhone, setIsPhone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsPhone(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const search = searchParams.toString();
  const packageId = sharedPackageIdFromLocation(pathname, search ? `?${search}` : "");
  if (!isPhone || dismissed || !packageId) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl bg-brandInk px-4 py-3 text-white shadow-lg">
      <p className="flex-1 text-sm font-semibold">Have the eSim2you app?</p>
      <a
        href={appSchemeUrlForPackage(packageId)}
        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brandBlue"
      >
        Open in app
      </a>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="px-1 text-lg leading-none text-white/70"
      >
        ×
      </button>
    </div>
  );
}
