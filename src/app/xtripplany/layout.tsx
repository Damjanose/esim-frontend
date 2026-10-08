import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xtripplany",
  title: "Trip plans | eSIM2you",
  description: "Private eSIM2you trip plan settings.",
  indexable: false
});

export default function AdminTripPlanLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
