import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { appPurchaseHref } from "@/lib/web-purchases";

export const metadata: Metadata = createMetadata({
  path: "/checkout",
  title: "Checkout | eSIM2you",
  description: "Buy this eSIM plan in the eSIM2you app.",
  indexable: false
});

/**
 * Web checkout is disabled: purchases happen only in the mobile app.
 * `/checkout?package={id}` is still claimed by the app's universal / App Links
 * (older shares), so with the app installed it never reaches this page. On the
 * web it forwards to the package's open-in-app page.
 */
export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageId = "" } = await searchParams;
  redirect(packageId ? appPurchaseHref(packageId) : "/destinations");
}
