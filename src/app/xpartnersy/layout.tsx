import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xpartnersy",
  title: "Partners | eSim2you",
  description: "Private eSim2you affiliate/partner-program admin surface.",
  indexable: false
});

export default function AdminPartnersLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
