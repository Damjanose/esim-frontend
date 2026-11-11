import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { CopyCodeCard } from "./CopyCodeCard";

export const metadata: Metadata = createMetadata({
  path: "/copy-code",
  title: "Copy your code | eSIM2you",
  description: "Copy your eSIM2you verification code.",
  indexable: false
});

export default function CopyCodePage() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-surfaceBright px-4 text-onSurface">
      <CopyCodeCard />
    </main>
  );
}
