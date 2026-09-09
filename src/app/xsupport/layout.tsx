import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xsupport",
  title: "Support Inbox | eSim2you",
  description: "Private eSim2you support-chat admin surface.",
  indexable: false
});

export default function AdminSupportLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
