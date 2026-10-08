import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xstreaky",
  title: "Streak Promo | eSIM2you",
  description: "Private eSIM2you games streak promo admin surface.",
  indexable: false
});

export default function AdminStreakPromoLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
