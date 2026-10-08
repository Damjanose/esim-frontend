import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xpricing",
  title: "Price Management | eSIM2you",
  description: "Private eSIM2you package pricing admin surface.",
  indexable: false
});

export default function AdminPricingLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
