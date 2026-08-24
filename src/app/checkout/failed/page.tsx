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
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-5 pb-24 pt-28 lg:px-10">
        <div className="w-full max-w-[560px] rounded-[20px] border border-outline bg-white p-7 shadow-brandCard sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-[14px] border border-amber-600/30 bg-amber-50 text-amber-600">
            <AlertTriangle size={22} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            {copy.heading}
          </h1>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">{copy.body}</p>

          <p className="mt-4 rounded-[12px] border border-outline bg-mist px-4 py-3 text-sm font-semibold text-brandInk">
            {copy.chargeNote}
          </p>

          {payment ? (
            <p className="mt-4 text-xs text-onSurfaceVariant">
              Payment reference:{" "}
              <span className="font-mono font-bold text-brandInk">{payment}</span>
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {reason === "unpaid" && packageId ? (
              <LinkButton
                className="flex-1"
                href={`/checkout?package=${encodeURIComponent(packageId)}`}
                size="lg"
              >
                Try again
              </LinkButton>
            ) : (
              <LinkButton className="flex-1" href="/account" size="lg">
                Go to my eSIMs
              </LinkButton>
            )}

            <LinkButton className="flex-1" href="/support" size="lg" tone="brand" variant="flat">
              <LifeBuoy size={17} />
              Contact support
            </LinkButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
