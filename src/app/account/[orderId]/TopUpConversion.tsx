"use client";

import { useEffect } from "react";
import { claimOnce, takePendingTopupPurchase, trackGaEvent } from "@/lib/analytics";
import { useConsent } from "../../ConsentManager";

/**
 * Fires the GA4 `purchase` for a top-up on the /account/[orderId]?topup=1
 * return, as the app does (transaction_id = Pokpay payment id, item_category2
 * esim_topup). `paymentId` is the payment /account/topup/return provisioned;
 * the value and item come from what TopUpPanel stashed for that same payment.
 * Without a matching stash (another tab or browser) nothing is sent.
 */
export function TopUpConversion({ orderId, paymentId }: { orderId: number; paymentId: string }) {
  const { consent } = useConsent();

  useEffect(() => {
    if (consent?.analytics !== true || !window.gtag) return;
    const pending = takePendingTopupPurchase(orderId, paymentId);
    if (!pending || !claimOnce(`ga4_purchase_${pending.paymentId}`)) return;

    trackGaEvent("purchase", {
      transaction_id: pending.paymentId,
      value: pending.value,
      currency: pending.currency,
      items: [pending.item]
    });
  }, [consent?.analytics, orderId, paymentId]);

  return null;
}
