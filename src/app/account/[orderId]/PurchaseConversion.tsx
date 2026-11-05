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
import { metaProductParams, trackMetaEvent } from "@/lib/meta-pixel";
import { useConsent } from "../../ConsentManager";

/** The catalog entry for the bought plan; null when it has left the catalog. */
export type PurchasedPlan = {
  id: string;
  country: string;
  region?: string;
  dataLabel: string;
  durationLabel: string;
  priceNumeric: number;
} | null;

/**
 * Fires the Google Ads conversion, GA4 `purchase` and Meta `Purchase` once
 * per order. Rendered only when the checkout return flow lands here with
 * `?new=1`, but that query string survives refreshes, so each is deduped by
 * transaction id in browser storage. The transaction id is the Pokpay payment
 * reference, the same id the mobile app reports.
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
      : { item_id: packageId, item_name: packageId, item_category2: "esim_package" as const, price: value, quantity: 1 };

    trackGaEvent("purchase", {
      transaction_id: transactionId,
      value,
      currency: GA_CURRENCY,
      ...(pending?.coupon ? { coupon: pending.coupon } : {}),
      items: [item]
    });
  }, [consent?.analytics, packageId, plan, transactionId]);

  // eventID = the transaction id, so a future Conversions API Purchase dedupes against this.
  useEffect(() => {
    if (consent?.marketing !== true) return;
    if (!claimOnce(`meta_purchase_${transactionId}`)) return;

    const value = roundMoney(readPendingPurchase(packageId)?.value ?? plan?.priceNumeric ?? 0);
    trackMetaEvent("Purchase", metaProductParams([packageId], value, GA_CURRENCY), transactionId);
  }, [consent?.marketing, packageId, plan, transactionId]);

  return null;
}
