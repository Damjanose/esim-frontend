import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { LinkButton } from "../../components/Button";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/profile/deleted",
  title: "Account deleted | eSim2you",
  description: "Your eSim2you account has been deleted.",
  indexable: false
});

/** Signed out by design (no session reads): the same centred card as /checkout/failed. */
export default function AccountDeletedPage() {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="w-full max-w-[560px] rounded-[24px] border border-outline/70 bg-surface p-6 text-center shadow-brandCard sm:p-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandTeal/15 text-brandTeal">
            <CheckCircle2 aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            Goodbye for now
          </h1>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            Your eSim2you account has been deleted and you have been signed out. Any eSIM
            you already installed keeps working until its data runs out.
          </p>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">
            You are welcome back any time — buying a new plan starts a fresh account.
          </p>

          <LinkButton className="mt-7 w-full sm:w-auto" href="/" size="lg">
            Back to eSim2you
            <ArrowRight aria-hidden="true" size={16} />
          </LinkButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
