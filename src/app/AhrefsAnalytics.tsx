"use client";

import { usePathname } from "next/navigation";
import { AHREFS_ANALYTICS_KEY } from "@/lib/analytics";
import { isAdminPath } from "@/lib/meta-pixel";

/**
 * Ahrefs Web Analytics. Cookieless, so it is not behind the consent banner and
 * is in the server HTML for every visitor (React hoists an async script to
 * <head>, which is where Ahrefs' installation check looks for it). Never
 * rendered on admin x* paths, whose URLs must not reach a third party.
 */
export function AhrefsAnalytics() {
  const pathname = usePathname();
  if (!AHREFS_ANALYTICS_KEY || isAdminPath(pathname)) return null;

  return <script async data-key={AHREFS_ANALYTICS_KEY} src="https://analytics.ahrefs.com/analytics.js" />;
}
