"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isAdminPath, removeMetaPixel, trackMetaEvent } from "@/lib/meta-pixel";
import { useConsent } from "./ConsentManager";

/** Loads the pixel after Marketing consent and sends one PageView per public route. */
export function MetaPixel() {
  const { consent } = useConsent();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const allowed = consent?.marketing === true;

  useEffect(() => {
    if (!allowed) {
      lastPath.current = null;
      removeMetaPixel();
      return;
    }
    if (isAdminPath(pathname) || lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackMetaEvent("PageView");
  }, [allowed, pathname]);

  return null;
}
