import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/profile/deleted",
  title: "Account deleted | eSim2you",
  description: "Your eSim2you account has been deleted.",
  indexable: false
});

export default function AccountDeletedPage() {
  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 pb-24 pt-36 text-center lg:px-10">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-[#1c7a4b] bg-[#07281a] text-[#4ade80]">
          <CheckCircle2 size={30} />
        </span>

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
          Goodbye for now
        </h1>

        <p className="mt-4 text-sm leading-6 text-[#8ea3ba]">
          Your eSim2you account has been deleted and you have been signed out. Any eSIM
          you already installed keeps working until its data runs out.
        </p>

        <p className="mt-3 text-sm leading-6 text-[#8ea3ba]">
          You are welcome back any time — buying a new plan starts a fresh account.
        </p>

        <Link
          className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-7 text-sm font-black transition hover:-translate-y-0.5"
          href="/"
        >
          Back to eSim2you
          <ArrowRight size={16} />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
