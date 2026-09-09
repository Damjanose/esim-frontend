"use client";

import { useEffect } from "react";
import { useConsent } from "./ConsentManager";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!META_PIXEL_ID || consent?.marketing !== true) {
      document.getElementById("meta-pixel-script")?.remove();
      window.fbq = undefined;
      return;
    }

    if (!window.fbq) {
      const fbq = ((...args: unknown[]) => {
        fbq.queue = fbq.queue || [];
        fbq.queue.push(args);
      }) as Fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      window.fbq = fbq;
    }
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");

    if (!document.getElementById("meta-pixel-script")) {
      const script = document.createElement("script");
      script.async = true;
      script.id = "meta-pixel-script";
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
  }, [consent]);

  return null;
}

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

type Fbq = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  queue?: unknown[][];
  version?: string;
};
