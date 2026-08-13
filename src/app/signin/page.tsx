import { Suspense } from "react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = createMetadata({
  path: "/signin",
  title: "Sign in | eSim2you",
  description: "Sign in to buy eSIM plans and manage your data on eSim2you.",
  indexable: false
});

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="relative mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5 pb-20 pt-28 lg:px-10">
        {/* Coverage glow: the card reads as the lit point on an otherwise dark
            map, rather than floating in an empty field. Decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(24,87,255,0.16),rgba(41,201,255,0.06)_45%,transparent_70%)] blur-[2px]"
        />

        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}
