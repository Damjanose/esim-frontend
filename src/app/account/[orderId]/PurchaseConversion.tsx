"use client";

import { useEffect } from "react";
import {
  GA_CURRENCY,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_LABEL,
  claimOnce,
  gaItem,
  readPendingPurchase,
  roundMoney,
  trackGaEvent
} from "@/lib/analytics";
import { useConsent } from "../../ConsentManager";

/** The catalog entry for the bought plan; null when it has left the catalog. */
export type PurchasedPlan = { id: string; title: string; country: string; priceNumeric: number } | null;

/**
 * Fires the Google Ads purchase conversion and the GA4 `purchase` event once
 * per order. Rendered only when the checkout return flow lands here with
 * `?new=1`, but that query string survives refreshes, so each is deduped by
 * order code in browser storage.
 */
export function PurchaseConversion({
  transactionId,
  packageId,
  plan
}: {
  transactionId: string;
  packageId: string;
  plan: PurchasedPlan;
}) {
  const { consent } = useConsent();

  useEffect(() => {
    if (consent?.marketing !== true) return;

    const key = `ga_purchase_${transactionId}`;
    if (sessionStorage.getItem(key)) return;

    window.gtag?.("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      transaction_id: transactionId
    });
    sessionStorage.setItem(key, "1");
  }, [consent?.marketing, transactionId]);

  useEffect(() => {
    if (consent?.analytics !== true || !window.gtag) return;
    if (!claimOnce(`ga4_purchase_${transactionId}`)) return;

    // What checkout charged (after promo / streak discounts); the catalog price otherwise.
    const pending = readPendingPurchase(packageId);
    const value = roundMoney(pending?.value ?? plan?.priceNumeric ?? 0);
    const item = plan
      ? gaItem(plan, value)
      : { item_id: packageId, item_name: packageId, price: value, quantity: 1 };

    trackGaEvent("purchase", {
      transaction_id: transactionId,
      value,
      currency: GA_CURRENCY,
      ...(pending?.coupon ? { coupon: pending.coupon } : {}),
      items: [item]
    });
  }, [consent?.analytics, packageId, plan, transactionId]);

  return null;
}
