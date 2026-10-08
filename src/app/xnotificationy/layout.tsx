import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xnotificationy",
  title: "Push Notifications | eSIM2you",
  description: "Private eSIM2you broadcast notification admin surface.",
  indexable: false
});

export default function AdminNotificationsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
