"use client";

import { useEffect } from "react";
import { GOOGLE_ADS_ID, GOOGLE_ADS_PURCHASE_LABEL } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fires the Google Ads purchase conversion once per order. Rendered only when
 * the checkout return flow lands here with `?new=1`, but that query string
 * survives refreshes, so dedupe by order id in sessionStorage to avoid
 * double-counting the same conversion.
 */
export function PurchaseConversion({ transactionId }: { transactionId: string }) {
  useEffect(() => {
    const key = `ga_purchase_${transactionId}`;
    if (sessionStorage.getItem(key)) return;

    window.gtag?.("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      transaction_id: transactionId
    });
    sessionStorage.setItem(key, "1");
  }, [transactionId]);

  return null;
}
