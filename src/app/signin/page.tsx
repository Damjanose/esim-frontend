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

      <section className="mx-auto flex min-h-screen max-w-[1440px] items-center justify-center px-5 pb-20 pt-28 lg:px-10">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}
