"use client";

import { useEffect, useState } from "react";
import { ReviewComposer } from "../../components/ReviewComposer";

/**
 * Asks for a review at the two high-intent moments on an order: right after
 * payment (`?new=1`) and once the eSIM is in use. "Not now" hides it for this
 * order only; the homepage button still works.
 */
export function OrderReviewCard({
  airaloOrderId,
  justPaid,
  lifecycle
}: {
  airaloOrderId: number;
  justPaid: boolean;
  lifecycle: "ready" | "active" | "expired";
}) {
  const key = `review_dismissed_${airaloOrderId}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === "1";
    } catch {
      // Storage blocked: just show it.
    }
    const reopened = new URLSearchParams(window.location.search).get("review") === "open";
    setShow(reopened || (!dismissed && (justPaid || lifecycle !== "ready")));
  }, [key, justPaid, lifecycle]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: hide for this visit only.
    }
    setShow(false);
  }

  return (
    <div className="mt-4">
      <ReviewComposer
        airaloOrderId={airaloOrderId}
        heading={justPaid && lifecycle === "ready" ? "How was buying your eSIM?" : "How's your trip data?"}
        onDismiss={dismiss}
        onlyWhenWritable
        subheading="Two taps and a line. It helps other travelers a lot."
      />
    </div>
  );
}
