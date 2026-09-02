import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xactivityy",
  title: "User Activity | eSim2you",
  description: "Private eSim2you activity-tracking and re-engagement admin surface.",
  indexable: false
});

export default function AdminActivityLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
