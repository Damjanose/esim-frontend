"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "./ConsentManager";
import { destinationFromPath, screenTemplate } from "@/lib/analytics-events/screen";
import { syncAnalyticsConsent, trackWebEvent } from "@/lib/analytics-events";

/**
 * Sends one screen_view per page (route template only, never the full URL). Nothing is sent
 * on admin pages, nothing without analytics consent, and the same path is never sent twice
 * in a row (for example after a re-render or a consent change on the same page).
 * The visitor sees no change.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const { consent } = useConsent();
  const analyticsAllowed = consent?.analytics === true;
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    // Withdrawn consent clears the stored ids at once, on any page.
    syncAnalyticsConsent();
    if (!analyticsAllowed) return;
    if (!pathname || pathname.startsWith("/x")) return;
    if (lastSent.current === pathname) return;
    const screen = screenTemplate(pathname);
    if (!screen) return;
    lastSent.current = pathname;
    const destination = destinationFromPath(pathname);
    trackWebEvent(destination ? { type: "screen_view", screen, destination } : { type: "screen_view", screen });
  }, [pathname, analyticsAllowed]);

  return null;
}
