import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xerrors",
  title: "Error Inbox | eSim2you",
  description: "Private eSim2you error inbox.",
  indexable: false
});

export default function AdminErrorsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
