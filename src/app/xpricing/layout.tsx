import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xpricing",
  title: "Price Management | eSim2you",
  description: "Private eSim2you package pricing admin surface.",
  indexable: false
});

export default function AdminPricingLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
