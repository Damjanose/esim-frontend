"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useConsent } from "./ConsentManager";

/**
 * Sends one Meta event per mount, once marketing consent is known to be granted
 * (so an event on a first visit fires as soon as the visitor accepts).
 */
export function MetaEvent({ name, params }: { name: string; params: Record<string, unknown> }) {
  const { consent } = useConsent();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || consent?.marketing !== true) return;
    sent.current = true;
    trackMetaEvent(name, params);
  }, [consent?.marketing, name, params]);

  return null;
}
