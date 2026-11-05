"use client";

import type { ReactNode } from "react";
import { GA_CURRENCY, roundMoney } from "@/lib/analytics";
import { metaProductParams, trackMetaEvent } from "@/lib/meta-pixel";

/** Reports AddToCart when the Buy link inside is activated (a keyboard Enter is a click too). */
export function MetaAddToCart({ planId, price, children }: { planId: string; price: number; children: ReactNode }) {
  return (
    <span
      className="contents"
      onClick={() => trackMetaEvent("AddToCart", metaProductParams([planId], roundMoney(price), GA_CURRENCY))}
    >
      {children}
    </span>
  );
}
