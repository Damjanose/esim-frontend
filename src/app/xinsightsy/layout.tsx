import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xinsightsy",
  title: "Growth Insights | eSIM2you",
  description: "Private eSIM2you growth insights admin surface.",
  indexable: false
});

export default function AdminInsightsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
