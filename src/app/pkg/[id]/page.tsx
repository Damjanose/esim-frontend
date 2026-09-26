import type { Metadata } from "next";
import Image from "next/image";
import { createMetadata } from "@/lib/seo";
import { landingContent } from "@/content/landing";
import { OpenAppActions } from "./OpenAppActions";

export const metadata: Metadata = createMetadata({
  path: "/pkg",
  title: "Open in the eSim2you app",
  description: "Open this eSIM plan in the eSim2you app, or download the app to get it.",
  indexable: false
});

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Landing for a package shared from the mobile app (`/pkg/{id}`).
 *
 * With the app installed, universal / App Links open the app before this page
 * loads. Reaching it means the app isn't installed, or the link was opened
 * somewhere links don't fire (in-app browsers), so it offers both: open the
 * app, or download it.
 */
export default async function PackageLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packageId = safeDecode(id);
  const { appLinks } = landingContent;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-onSurface">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lg">
        <Image src="/logo-icon.png" alt="eSim2you" width={72} height={72} className="mx-auto" priority />
        <h1 className="mt-5 text-2xl font-bold">Get this eSIM plan in eSim2you</h1>
        <p className="mt-2 text-sm text-onSurface/70">
          Someone shared a plan with you. Open it in the app, or download eSim2you to buy it.
        </p>
        <OpenAppActions
          packageId={packageId}
          appStoreUrl={appLinks.ios.href}
          playStoreUrl={appLinks.android.href}
        />
      </div>
    </main>
  );
}
