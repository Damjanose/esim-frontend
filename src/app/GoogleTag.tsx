"use client";

import { useEffect } from "react";
import { useConsent } from "./ConsentManager";
import { GOOGLE_ADS_ID } from "@/lib/analytics";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleTag() {
  const { consent } = useConsent();

  useEffect(() => {
    const analyticsAllowed = consent?.analytics === true;
    const marketingAllowed = consent?.marketing === true;

    if (!analyticsAllowed && !marketingAllowed) {
      document.getElementById("google-tag-script")?.remove();
      window.gtag = undefined;
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      ((...args: unknown[]) => {
        window.dataLayer?.push(args);
      });
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

    if (analyticsAllowed && GA_MEASUREMENT_ID) {
      window.gtag("config", GA_MEASUREMENT_ID);
    }
    if (marketingAllowed) {
      window.gtag("config", GOOGLE_ADS_ID);
    }

    const googleTagId = marketingAllowed ? GOOGLE_ADS_ID : GA_MEASUREMENT_ID;
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

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}
