import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xerrors",
  title: "Error Inbox | eSIM2you",
  description: "Private eSIM2you error inbox.",
  indexable: false
});

export default function AdminErrorsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
