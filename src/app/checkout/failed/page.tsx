import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, LifeBuoy } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/checkout/failed",
  title: "Payment problem | eSim2you",
  description: "We could not complete your eSIM purchase.",
  indexable: false
});

type FailureCopy = {
  heading: string;
  body: string;
  chargeNote: string;
};

/**
 * Only `unpaid` is known to mean the money did not move. Every other outcome may
 * have taken payment, so the copy must never promise the card was untouched.
 */
function copyFor(reason: string): FailureCopy {
  if (reason === "unpaid") {
    return {
      heading: "Your payment wasn't completed",
      body: "The payment was cancelled or declined before it went through, so your plan was not purchased.",
      chargeNote: "You have not been charged. You can safely try again."
    };
  }

  if (reason === "missing_payment") {
    return {
      heading: "We lost track of that payment",
      body: "We couldn't match this return link to a payment. If you completed a payment, it may still be processing.",
      chargeNote:
        "If you were charged, your eSIM will appear in your account shortly. Contact support if it doesn't."
    };
  }

  return {
    heading: "Your payment went through, but setup didn't finish",
    body: "We received your payment but could not finish setting up your eSIM. Our team can complete it for you.",
    chargeNote:
      "Do not pay again. Contact support with the reference below and we will sort it out."
  };
}

export default async function CheckoutFailedPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string; package?: string; payment?: string }>;
}) {
  const { reason = "provisioning", package: packageId, payment } = await searchParams;
  const copy = copyFor(reason);

  return (
    <main className="min-h-screen bg-[#040d1a] text-white">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-5 pb-24 pt-28 lg:px-10">
        <div className="w-full max-w-[560px] rounded-[20px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#7a4b1c] bg-[#2a1a07] text-[#ffb454]">
            <AlertTriangle size={22} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            {copy.heading}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#8ea3ba]">{copy.body}</p>

          <p className="mt-4 rounded-[12px] border border-[#163958] bg-[#061427]/85 px-4 py-3 text-sm font-semibold text-[#c7d6e5]">
            {copy.chargeNote}
          </p>

          {payment ? (
            <p className="mt-4 text-xs text-[#748aa2]">
              Payment reference:{" "}
              <span className="font-mono font-bold text-[#c7d6e5]">{payment}</span>
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {reason === "unpaid" && packageId ? (
              <Link
                className="inline-flex h-12 flex-1 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white transition hover:-translate-y-0.5"
                href={`/checkout?package=${encodeURIComponent(packageId)}`}
              >
                Try again
              </Link>
            ) : (
              <Link
                className="inline-flex h-12 flex-1 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white transition hover:-translate-y-0.5"
                href="/account"
              >
                Go to my eSIMs
              </Link>
            )}

            <Link
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#168cff]/75 text-sm font-black text-[#42b1ff] transition hover:bg-[#168cff] hover:text-white"
              href="/support"
            >
              <LifeBuoy size={17} />
              Contact support
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
