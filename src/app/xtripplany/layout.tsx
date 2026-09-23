import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xtripplany",
  title: "Trip plans | eSim2you",
  description: "Private eSim2you trip plan settings.",
  indexable: false
});

export default function AdminTripPlanLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
