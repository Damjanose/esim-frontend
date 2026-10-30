"use client";

import { useEffect, useState } from "react";
import { CARD_ONLY, type PaymentMethods } from "@/lib/externalPayments";

/** Enabled payment methods; card only until (or unless) the backend says otherwise. */
export function usePaymentMethods(): PaymentMethods {
  const [methods, setMethods] = useState<PaymentMethods>(CARD_ONLY);

  useEffect(() => {
    let cancelled = false;
    void fetch("/bff/payments/methods")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: PaymentMethods } | null) => {
        if (!cancelled && payload?.data) setMethods(payload.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return methods;
}
