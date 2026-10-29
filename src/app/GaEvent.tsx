"use client";

import { useEffect, useRef } from "react";
import { trackGaEvent } from "@/lib/analytics";
import { useConsent } from "./ConsentManager";

/**
 * Sends one GA4 event per mount, once analytics consent is known to be granted
 * (so an event on a first visit fires as soon as the visitor accepts).
 */
export function GaEvent({ name, params }: { name: string; params: Record<string, unknown> }) {
  const { consent } = useConsent();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || consent?.analytics !== true || !window.gtag) return;
    sent.current = true;
    trackGaEvent(name, params);
  }, [consent?.analytics, name, params]);

  return null;
}
