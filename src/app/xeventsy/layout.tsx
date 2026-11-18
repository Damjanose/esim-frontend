import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xeventsy",
  title: "Event Modals | eSIM2you",
  description: "Private eSIM2you in-app event modal admin surface.",
  indexable: false
});

export default function AdminEventModalsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
