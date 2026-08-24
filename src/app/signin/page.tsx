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
    <main className="min-h-screen overflow-hidden bg-surface text-onSurface">
      <Navbar />

      <section className="relative isolate mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5 pb-20 pt-28 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_50%_15%,rgba(11,73,183,0.1),transparent_30%),radial-gradient(circle_at_18%_70%,rgba(9,195,190,0.06),transparent_27%)]" />
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" />

        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}
