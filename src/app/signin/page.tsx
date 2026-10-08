import { Suspense } from "react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = createMetadata({
  path: "/signin",
  title: "Sign in | eSIM2you",
  description: "Sign in to buy eSIM plans and manage your data on eSIM2you.",
  indexable: false
});

export default function SignInPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      {/* Phones: the card starts under the top bar (no vertical centring that the
          keyboard would push around). sm+: centred in the viewport. */}
      <section className="relative isolate mx-auto flex min-h-[100svh] w-full max-w-[1440px] items-start justify-center px-4 pb-16 pt-[92px] sm:items-center sm:px-6 sm:pt-28 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brandBlue/10 to-transparent"
        />

        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}
