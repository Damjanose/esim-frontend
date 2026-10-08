import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xpartnersy",
  title: "Partners | eSIM2you",
  description: "Private eSIM2you affiliate/partner-program admin surface.",
  indexable: false
});

export default function AdminPartnersLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
