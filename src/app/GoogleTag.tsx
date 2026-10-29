"use client";

import { useEffect } from "react";
import { useConsent } from "./ConsentManager";
import { GA_ID, GOOGLE_ADS_ID } from "@/lib/analytics";

/** Each config sends a page_view, so a later consent change must not repeat one. */
const configuredIds = new Set<string>();

function configureOnce(id: string) {
  if (configuredIds.has(id)) return;
  if (configuredIds.size === 0) window.gtag?.("js", new Date());
  configuredIds.add(id);
  window.gtag?.("config", id);
}

/**
 * One gtag.js loader for both tags: GA4 (analytics consent) and Google Ads
 * (marketing consent). GA4 page views come from the config's initial
 * page_view plus GA4 enhanced measurement's "page changes based on browser
 * history events", which catches every App Router navigation; no manual
 * page_view is sent, so nothing is counted twice.
 */
export function GoogleTag() {
  const { consent } = useConsent();

  useEffect(() => {
    const analyticsAllowed = consent?.analytics === true;
    const marketingAllowed = consent?.marketing === true;

    if (!analyticsAllowed && !marketingAllowed) {
      document.getElementById("google-tag-script")?.remove();
      window.gtag = undefined;
      configuredIds.clear();
      return;
    }

    window.dataLayer = window.dataLayer || [];
    // gtag.js only executes commands pushed as an `arguments` object; a rest-args
    // array is read as a dataLayer message and silently ignored.
    window.gtag =
      window.gtag ||
      function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
    window.gtag("consent", "default", {
      ad_personalization: marketingAllowed ? "granted" : "denied",
      ad_storage: marketingAllowed ? "granted" : "denied",
      ad_user_data: marketingAllowed ? "granted" : "denied",
      analytics_storage: analyticsAllowed ? "granted" : "denied"
    });
    window.gtag("consent", "update", {
      ad_personalization: marketingAllowed ? "granted" : "denied",
      ad_storage: marketingAllowed ? "granted" : "denied",
      ad_user_data: marketingAllowed ? "granted" : "denied",
      analytics_storage: analyticsAllowed ? "granted" : "denied"
    });

    if (analyticsAllowed && GA_ID) configureOnce(GA_ID);
    if (marketingAllowed) configureOnce(GOOGLE_ADS_ID);

    const googleTagId = marketingAllowed ? GOOGLE_ADS_ID : GA_ID;
    if (googleTagId && !document.getElementById("google-tag-script")) {
      const script = document.createElement("script");
      script.async = true;
      script.id = "google-tag-script";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
      document.head.appendChild(script);
    }
  }, [consent]);

  return null;
}
