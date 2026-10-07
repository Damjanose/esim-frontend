import type { Metadata } from "next";
import { AlertTriangle, LifeBuoy } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { LinkButton } from "../../components/Button";
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
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="w-full max-w-[560px] rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-error/10 text-error">
            <AlertTriangle aria-hidden="true" size={24} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            {copy.heading}
          </h1>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">{copy.body}</p>

          <p className="mt-4 rounded-[16px] border border-outline/70 bg-surfaceBright px-4 py-3 text-sm font-semibold text-brandInk">
            {copy.chargeNote}
          </p>

          {payment ? (
            <p className="mt-4 break-all text-xs text-onSurfaceVariant">
              Payment reference:{" "}
              <span className="font-mono font-bold text-brandInk">{payment}</span>
            </p>
          ) : null}

          {/* w-full, not flex-1, below sm: in a column, flex-1 (basis 0) squashed the 54px buttons to ~24px. */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {reason === "unpaid" && packageId ? (
              <LinkButton
                className="w-full sm:flex-1"
                href={`/checkout?package=${encodeURIComponent(packageId)}`}
                size="lg"
              >
                Try again
              </LinkButton>
            ) : (
              <LinkButton className="w-full sm:flex-1" href="/account" size="lg">
                Go to my eSIMs
              </LinkButton>
            )}

            <LinkButton className="w-full sm:flex-1" href="/support" size="lg" tone="brand" variant="tint">
              <LifeBuoy aria-hidden="true" size={17} />
              Contact support
            </LinkButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
